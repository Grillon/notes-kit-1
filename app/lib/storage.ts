'use client';
import Dexie, { Table } from 'dexie';
import type { Note, ImageData } from '../types';

class PortableNotesDB extends Dexie {
  notes!: Table<Note, string>;
  images!: Table<ImageData, number>;

  constructor() {
    super('PortableNotesDB');
    this.version(1).stores({
      notes: 'id, updatedAt',
      images: '++id, noteId, createdAt',
    });
  }
}
export const db = new PortableNotesDB();

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
    await db.transaction('rw', db.notes, db.images, async () => {
      await db.images.where('noteId').equals(id).delete();
      await db.notes.delete(id);
    });
  },

  async export(): Promise<string> {
    const notes = await db.notes.toArray();
    const images = await db.images.toArray();
    const imageData = await Promise.all(
      images.map(async (img) => ({
        ...img,
        data: await blobToBase64(img.data),
      })),
    );
    return JSON.stringify({ notes, images: imageData }, null, 2);
  },

  async import(json: string) {
    const { notes, images } = JSON.parse(json);
    await db.transaction('rw', db.notes, db.images, async () => {
      await db.notes.clear();
      await db.images.clear();
      await db.notes.bulkAdd(notes);
      for (const img of images) {
        const blob = base64ToBlob(img.data);
        await db.images.add({ ...img, data: blob });
      }
    });
  },

  async addImage(noteId: string, file: File): Promise<ImageData> {
    const data = await file.arrayBuffer();
    const blob = new Blob([data], { type: file.type });
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

  async listAllImages(): Promise<ImageData[]> {
  return db.images.toArray();
},

  async removeImage(id: number) {
    await db.images.delete(id);
  },
      // ... en bas de storage
async exportNote(noteId: string): Promise<string> {
  const note = await db.notes.get(noteId);
  if (!note) throw new Error('Note introuvable');

  const images = await db.images.where('noteId').equals(noteId).toArray();
  const imageData = await Promise.all(
    images.map(async (img) => ({
      ...img,
      data: await blobToBase64(img.data), // <-- base64 inside JSON
    })),
  );

  return JSON.stringify({ notes: [note], images: imageData }, null, 2);
},
};
