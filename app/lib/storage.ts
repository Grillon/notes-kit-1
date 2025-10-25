'use client';
import { Note, NoteID } from '../types';

const KEY = 'portable-notes:v1';

function loadAll(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as Note[];
  } catch {
    return [];
  }
}
function saveAll(notes: Note[]) {
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export const storage = {
  list(): Note[] {
    return loadAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  create(): Note {
    const now = new Date().toISOString();
    const n: Note = { id: `n_${Date.now()}`, title: '', content: '', createdAt: now, updatedAt: now };
    const all = loadAll();
    all.push(n);
    saveAll(all);
    return n;
  },
  update(id: NoteID, patch: Partial<Note>): Note | undefined {
    const all = loadAll();
    const i = all.findIndex(n => n.id === id);
    if (i === -1) return;
    const updated = { ...all[i], ...patch, updatedAt: new Date().toISOString() };
    all[i] = updated;
    saveAll(all);
    return updated;
  },
  remove(id: NoteID) {
    saveAll(loadAll().filter(n => n.id !== id));
  },
  export(): string {
    return JSON.stringify(loadAll(), null, 2);
  },
  import(json: string) {
    saveAll(JSON.parse(json) as Note[]);
  },
};
