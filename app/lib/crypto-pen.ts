// app/lib/crypto-pen.ts

export type PenContainerV1 = {
  format: "pen";
  version: 1;
  kdf: { name: "PBKDF2"; hash: "SHA-256"; iterations: number; salt_b64: string };
  cipher: { name: "AES-GCM"; iv_b64: string };
  ct_b64: string;
  meta?: Record<string, any>;
};

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(buf: ArrayBuffer | Uint8Array) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000; // 32 768 octets
  for (let i = 0; i < u8.length; i += chunkSize) {
    const chunk = u8.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function unb64(s: string) {
  const bin = atob(s);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations = 150_000
) {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // 💡 On convertit explicitement le salt en ArrayBuffer
  const saltBuf = salt.buffer.slice(0) as ArrayBuffer;


  const params: Pbkdf2Params = {
    name: "PBKDF2",
    hash: "SHA-256",
    salt: saltBuf,
    iterations,
  };

  return crypto.subtle.deriveKey(
    params,
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}


export async function encryptVault(password: string, vaultData: any): Promise<PenContainerV1> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plain = enc.encode(JSON.stringify(vaultData));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return {
    format: "pen",
    version: 1,
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: 150_000, salt_b64: b64(salt) },
    cipher: { name: "AES-GCM", iv_b64: b64(iv) },
    ct_b64: b64(ct),
    meta: { date: new Date().toISOString(), notes: vaultData.notes?.length ?? 0 },
  };
}

export async function decryptVault(password: string, container: PenContainerV1): Promise<any> {
  const salt = unb64(container.kdf.salt_b64);
  const iv = unb64(container.cipher.iv_b64);
  const ct = unb64(container.ct_b64);
  const key = await deriveKey(password, salt, container.kdf.iterations);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(dec.decode(pt));
}
