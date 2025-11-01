'use client';
import { useState, useMemo } from 'react';
import { storage } from './lib/storage';
import type { Note, ImageData } from './types';
import { extractTags, renderMarkdown } from './lib/markdown-utils';
import { useVault } from './hooks/useVault';
import Sidebar from './components/Sidebar';
import NoteEditor from './components/NoteEditor';
import { encryptVault, decryptVault, type PenContainerV1 } from './lib/crypto-pen';

export default function Page() {
  const { notes, setNotes, active, setActive, draft, setDraft, search, setSearch, filtered } =
    useVault();

  const [images, setImages] = useState<ImageData[]>([]);
  const [preview, setPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<'notes' | 'tags'>('notes');

  // === CRUD notes ===
  const createNote = async () => {
    const n = await storage.create();
    const all = await storage.list();
    setNotes(all);
    setActive(n);
  };
  const deleteNote = async () => {
    if (!active) return;
    await storage.remove(active.id);
    const all = await storage.list();
    setNotes(all);
    setActive(all[0] ?? null);
  };

  // === Import / export clair ===
  const handleExport = async () => {
    const blob = new Blob([await storage.export()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `portable-notes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const handleImport = async (file: File | null) => {
    if (!file) return;
    const json = await file.text();
    await storage.import(json);
    const all = await storage.list();
    setNotes(all);
    setActive(all[0] ?? null);
  };

  // === Import / export chiffré ===
  const handleExportEncrypted = async () => {
    const password = prompt("Mot de passe pour chiffrer l'export :");
    if (!password) return;
    const raw = await storage.export();
    const data = JSON.parse(raw);
    const encrypted = await encryptVault(password, data);
    const blob = new Blob([JSON.stringify(encrypted, null, 2)], {
      type: 'application/pen+json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `portable-notes-encrypted-${new Date().toISOString().slice(0, 10)}.pen.json`;
    a.click();
  };

  const handleImportEncrypted = async (file: File | null) => {
    if (!file) return;
    const json = await file.text();
    const container = JSON.parse(json) as PenContainerV1;
    const password = prompt('Mot de passe pour déchiffrer :');
    if (!password) return;
    try {
      const plain = await decryptVault(password, container);
      await storage.import(JSON.stringify(plain));
      const all = await storage.list();
      setNotes(all);
      setActive(all[0] ?? null);
      alert('Import chiffré réussi !');
    } catch {
      alert('Mot de passe incorrect ou fichier corrompu.');
    }
  };

  // === Tags globaux ===
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => extractTags(n.content).forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [notes]);

  return (
    <main className="flex min-h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Panneau gauche */}
      <Sidebar
        notes={notes}
        active={active}
        onSelect={setActive}
        onCreate={createNote}
        onExport={handleExport}
        onImport={handleImport}
        onExportEncrypted={handleExportEncrypted}
        onImportEncrypted={handleImportEncrypted}
        search={search}
        setSearch={setSearch}
        allTags={allTags}
        sidebarView={sidebarView}
        setSidebarView={setSidebarView}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* Éditeur principal */}
      <section className="flex-1 p-6 mx-auto w-full max-w-none">
        <NoteEditor
          active={active}
          draft={draft}
          setDraft={setDraft}
          deleteNote={deleteNote}
          preview={preview}
          setPreview={setPreview}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          search={search}
          setSearch={setSearch}
          setImages={setImages}
          images={images}
        />
      </section>
    </main>
  );
}
