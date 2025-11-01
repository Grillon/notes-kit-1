# 🗝️ Portable Notes — Local Vault for Ideas and Documents

**Portable Notes** est un **vault personnel local**, conçu comme un carnet chiffrable et exportable,  
capable d’évoluer vers un véritable **espace de stockage personnel décentralisé**.  
Il fonctionne entièrement **dans le navigateur**, sans serveur ni inscription.

---

## ✨ Objectif

> Créer un **portfolio de fichiers et documents locaux**,  
> pouvant être échangé librement entre utilisateurs,  
> en clair ou sous forme chiffrée.

Portable Notes vise à devenir un **espace personnel de confiance**,  
où l’on peut centraliser des notes, documents, images et idées,  
tout en gardant la possibilité de les **exporter / importer** facilement.

La donnée reste **100 % locale** (IndexedDB + PWA)  
et peut être échangée **par fichiers portables (`.json` ou `.pen.json`)**.

---

## 🚀 Fonctionnalités actuelles (`v0.x`)

| Catégorie | Description |
|------------|-------------|
| 💾 Stockage local | Sauvegarde automatique dans IndexedDB (Dexie.js) |
| 📝 Éditeur Markdown | Support des images, balises `{width=...}` `{align=center}`, tags `#motclé` |
| 🖼️ Images intégrées | Insertion et affichage d’images locales (Blob base64) |
| 🧭 Navigation | Liste de notes + tags filtrables, mode mobile |
| 🔁 Import / Export | Fichiers JSON en clair ou `.pen.json` chiffrés |
| 🔐 Chiffrement | AES-GCM + PBKDF2-SHA256 (WebCrypto, 100 % local) |
| 🧩 PWA | Fonctionne hors ligne, installable en local |

---

## 🧰 Stack technique

- **Framework** : [Next.js](https://nextjs.org/) + React (TypeScript)  
- **Stockage local** : [Dexie.js](https://dexie.org/) (IndexedDB)  
- **Markdown** :
  - [`react-markdown`](https://github.com/remarkjs/react-markdown)
  - [`remark-gfm`](https://github.com/remarkjs/remark-gfm)
  - [`remark-attributes`](https://github.com/arobase-che/remark-attributes)
  - [`rehype-highlight`](https://github.com/rehypejs/rehype-highlight)
- **Chiffrement** : API WebCrypto (AES-GCM / PBKDF2)
- **PWA** : [next-pwa](https://github.com/shadowwalker/next-pwa)

---

## 🧩 Structure du projet

```text
app/
├─ components/
│  ├─ Sidebar.tsx         → Liste des notes / tags / actions
│  ├─ NoteEditor.tsx      → Éditeur Markdown avec preview et images
│
├─ hooks/
│  └─ useVault.ts         → Logique principale (notes, autosave, recherche)
│
├─ lib/
│  ├─ storage.ts          → IndexedDB (Dexie)
│  ├─ markdown-utils.ts   → Extracteurs de tags, transform Markdown
│  ├─ crypto-pen.ts       → Chiffrement AES-GCM (export/import chiffrés)
│  └─ remarkAttributes.ts → Support des attributs Markdown
│
└─ page.tsx               → Composition principale (Sidebar + NoteEditor)
````

---

## 🔐 Format d’échange (`.pen.json`)

Les fichiers chiffrés sont auto-contenus :

```json
{
  "format": "pen",
  "version": 1,
  "kdf": { "name": "PBKDF2", "hash": "SHA-256", "iterations": 150000, "salt_b64": "..." },
  "cipher": { "name": "AES-GCM", "iv_b64": "..." },
  "ct_b64": "...",
  "meta": { "date": "...", "notes": 3 }
}
```

Aucune donnée n’est transmise sur le réseau.
Tout le chiffrement et le déchiffrement s’effectuent dans ton navigateur.

---

## 🗺️ Roadmap

| Phase    | Objectif                                                                | Statut                    |
| -------- | ----------------------------------------------------------------------- | ------------------------- |
| **v0.x** | Prototype fonctionnel : notes + images, import/export clair ou chiffré  | ✅ en cours                |
| **v1.0** | Vault complet : gestion multi-objets, classification, automation locale | 🧩 en conception          |
| **v2.0** | Version **locale WebAssembly** (moteur et base embarqués, sans JS)      | 💡 objectif à moyen terme |
| **v3.0** | Synchronisation optionnelle entre vaults (pair-à-pair, chiffrée)        | 🚀 vision finale          |

---

## 💭 Philosophie

> **Local d’abord. Partage ensuite.**

Portable Notes part du principe qu’un outil doit d’abord être **utile seul**,
puis s’ouvrir à l’échange sans sacrifier la simplicité ni la souveraineté des données.
Chaque utilisateur reste **maître de ses fichiers et de ses clés**.

Le chiffrement n’est pas une option de sécurité complexe,
c’est une **brique native de confiance** dans un écosystème libre et ouvert.

---

## 🧭 Vision long terme

* **v0.x – Vault local** : base fonctionnelle, markdown + images + import/export
* **v1.0 – Vault organisé** : gestion multi-objets, filtres, classification intelligente
* **v2.0 – Vault WebAssembly** : fonctionnement entièrement local, offline-first total
* **v3.0 – Vault interopérable** : synchronisation pair-à-pair, sans serveur central

Chaque étape vise à renforcer la **propreté du code**, la **pérennité des données**
et la **fluidité d’usage**, sans dépendance ni friction.

---

## 🪶 Licence

MIT — Libre de copier, modifier et partager.

---

## 🧑‍💻 Projet Outillage

Portable Notes fait partie du projet **Outillage**,
un ensemble d’outils légers et modulaires créés pour amplifier l’efficacité,
l’autonomie et l’impact individuel à travers des logiciels sobres et ouverts.