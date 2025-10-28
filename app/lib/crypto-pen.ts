// app/lib/crypto-pen.ts
export type PenContainerV1 = {
  format: "pen";
  version: 1;
  app?: { name?: string; schema?: string; build?: string };
  kdf: { name: "PBKDF2"; hash: "SHA-256"; iterations: number; salt_b64: string };
  cipher: { name: "AES-GCM"; iv_b64: string };
  meta?: { created_at?: string; notes_count?: number; hint?: string | null };
  ct_b64: string;
};

function b64encode(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}
function b64decodeToU8(b64: string): Uint8Array {
  return new Uint8Array(Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer);
}

export async function exportEncrypted(
  data: unknown,
  password: string,
  build = "2025.10.28"
): Promise<PenContainerV1> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 200_000;

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // 🔥 Conversion en texte JSON
  const jsonText = JSON.stringify(data);
  console.log("exportEncrypted: encoding length =", jsonText.length);

  // ✅ Brave RangeError fix: encodage en morceaux
  const chunkSize = 64 * 1024; // 64 KB
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < jsonText.length; i += chunkSize) {
    const slice = jsonText.slice(i, i + chunkSize);
    chunks.push(enc.encode(slice));
  }

  // concatène tous les morceaux dans un buffer unique
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const pt = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    pt.set(c, offset);
    offset += c.length;
  }

  console.log("Plaintext total bytes:", pt.length);

  // 🧠 Chiffrement final
  const ctBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, pt);

  return {
    format: "pen",
    version: 1,
    app: { name: "PortableNotes", schema: "notes.v1", build },
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt_b64: b64encode(salt),
    },
    cipher: { name: "AES-GCM", iv_b64: b64encode(iv) },
    meta: {
      created_at: new Date().toISOString(),
      notes_count: Array.isArray((data as any)?.notes)
        ? (data as any).notes.length
        : undefined,
      hint: null,
    },
    ct_b64: b64encode(new Uint8Array(ctBuf)),
  };
}

export async function importDecrypted<T = unknown>(
  container: PenContainerV1,
  password: string
): Promise<T> {
  if (container.format !== "pen" || container.version !== 1) {
    throw new Error("Unsupported container version");
  }
  const dec = new TextDecoder();
  const salt = b64decodeToU8(container.kdf.salt_b64);
  const iv = b64decodeToU8(container.cipher.iv_b64);
  const ct = b64decodeToU8(container.ct_b64);

  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: container.kdf.iterations, hash: "SHA-256" },
  baseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["decrypt"]
);


  try {
  const ptBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    ct as unknown as BufferSource
  );
  return JSON.parse(dec.decode(ptBuf));
} catch {
  throw new Error("DecryptError");
}
}
