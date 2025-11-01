'use client';
import Dexie, { Table } from 'dexie';
import type { Note, ImageData } from '../types';

/* === Type pour les fichiers === */
export interface FileData {
  id?: number;
  noteId: string;
  name: string;
  type: string;
  data: Blob;
  createdAt: string;
}

/* === Base de données === */
class PortableNotesDB extends Dexie {
  notes!: Table<Note, string>;
  images!: Table<ImageData, number>;
  files!: Table<FileData, number>; // ✅ nouvelle table

  constructor() {
    super('PortableNotesDB');
    this.version(2).stores({
      notes: 'id, updatedAt',
      images: '++id, noteId, createdAt',
      files: '++id, noteId, createdAt', // ✅ nouvelle store
    });
  }
}
export const db = new PortableNotesDB();

/* === Helpers base64 === */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string): Blob {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}

/* === Storage API principale === */
export const storage = {
  async list(): Promise<Note[]> {
    return db.notes.orderBy('updatedAt').reverse().toArray();
  },

  async create(): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = {
      id: `n_${Date.now()}`,
      title: '',
      content: '',
      createdAt: now,
      updatedAt: now,
    };
    await db.notes.add(note);
    return note;
  },

  async update(id: string, patch: Partial<Note>): Promise<Note | undefined> {
    const note = await db.notes.get(id);
    if (!note) return;
    const updated = { ...note, ...patch, updatedAt: new Date().toISOString() };
    await db.notes.put(updated);
    return updated;
  },

  async remove(id: string) {
    await db.transaction('rw', db.notes, db.images, db.files, async () => {
      await db.images.where('noteId').equals(id).delete();
      await db.files.where('noteId').equals(id).delete();
      await db.notes.delete(id);
    });
  },

  /* === EXPORT GLOBAL (notes + images + fichiers) === */
  async export(): Promise<string> {
    const notes = await db.notes.toArray();
    const images = await db.images.toArray();
    const files = await db.files.toArray();

    const imageData = await Promise.all(
      images.map(async (img) => ({
        ...img,
        data: await blobToBase64(img.data),
      }))
    );

    const fileData = await Promise.all(
      files.map(async (f) => ({
        ...f,
        data: await blobToBase64(f.data),
      }))
    );

    return JSON.stringify({ notes, images: imageData, files: fileData }, null, 2);
  },

  /* === IMPORT (fusion intelligente, ne remplace pas tout) === */
  async import(json: string) {
    const { notes, images = [], files = [] } = JSON.parse(json);

    await db.transaction('rw', db.notes, db.images, db.files, async () => {
      for (const note of notes) {
        const existing = await db.notes.get(note.id);
        if (existing) {
          if (
            new Date(note.updatedAt).getTime() >
            new Date(existing.updatedAt).getTime()
          ) {
            await db.notes.put(note);
          }
        } else {
          await db.notes.add(note);
        }
      }

      for (const img of images) {
        const existing = await db.images
          .where({ noteId: img.noteId, name: img.name })
          .first();
        if (!existing) {
          const blob = base64ToBlob(img.data);
          await db.images.add({ ...img, data: blob });
        }
      }

      for (const f of files) {
        const existing = await db.files
          .where({ noteId: f.noteId, name: f.name })
          .first();
        if (!existing) {
          const blob = base64ToBlob(f.data);
          await db.files.add({ ...f, data: blob });
        }
      }
    });
  },

  /* === IMAGES === */
  async addImage(noteId: string, file: File): Promise<ImageData> {
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const image: ImageData = {
      noteId,
      name: file.name,
      data: blob,
      createdAt: new Date().toISOString(),
    };
    image.id = await db.images.add(image);
    return image;
  },

  async listImages(noteId: string): Promise<ImageData[]> {
    return db.images.where('noteId').equals(noteId).toArray();
  },

  async removeImage(id: number) {
    await db.images.delete(id);
  },

  /* === FICHIERS === */
  async addFile(noteId: string, file: File): Promise<FileData> {
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const fdata: FileData = {
      noteId,
      name: file.name,
      type: file.type,
      data: blob,
      createdAt: new Date().toISOString(),
    };
    fdata.id = await db.files.add(fdata);
    return fdata;
  },

  async listFiles(noteId: string): Promise<FileData[]> {
    return db.files.where('noteId').equals(noteId).toArray();
  },

  async removeFile(id: number) {
    await db.files.delete(id);
  },

  /* === EXPORT INDIVIDUEL (note + images + fichiers liés) === */
  async exportNote(noteId: string): Promise<string> {
    const note = await db.notes.get(noteId);
    if (!note) throw new Error('Note introuvable');

    const images = await db.images.where('noteId').equals(noteId).toArray();
    const files = await db.files.where('noteId').equals(noteId).toArray();

    const imageData = await Promise.all(
      images.map(async (img) => ({
        ...img,
        data: await blobToBase64(img.data),
      }))
    );

    const fileData = await Promise.all(
      files.map(async (f) => ({
        ...f,
        data: await blobToBase64(f.data),
      }))
    );

    return JSON.stringify({ notes: [note], images: imageData, files: fileData }, null, 2);
  },
  async listAllImages(): Promise<ImageData[]> {
  return db.images.toArray();
},

async listAllFiles(): Promise<FileData[]> {
  return db.files.toArray();
},

};
