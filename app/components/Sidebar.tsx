'use client';
import React from 'react';
import type { Note } from '../types';
import { storage } from '../lib/storage';


type Props = {
  notes: Note[];
  active: Note | null;
  onSelect: (n: Note) => void;
  onCreate: () => void;
  onExport: () => void;
  onImport: (f: File | null) => void;
  onExportEncrypted: () => void;
  onImportEncrypted: (f: File | null) => void;
  search: string;
  setSearch: (s: string) => void;
  allTags: string[];
  sidebarView: 'notes' | 'tags';
  setSidebarView: (v: 'notes' | 'tags') => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
};

export default function Sidebar({
  notes,
  active,
  onSelect,
  onCreate,
  onExport,
  onImport,
  onExportEncrypted,
  onImportEncrypted,
  search,
  setSearch,
  allTags,
  sidebarView,
  setSidebarView,
  menuOpen,
  setMenuOpen,
}: Props) {
      const filtered = notes; // ✅ simple alias pour corriger l'erreur

  return (
    <>
      {/* === Bouton burger (mobile) === */}
      <div className="md:hidden fixed top-3 right-3 z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded bg-gray-800 hover:bg-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                menuOpen
                  ? 'M6 18L18 6M6 6l12 12' // croix
                  : 'M4 6h16M4 12h16M4 18h16' // trois barres
              }
            />
          </svg>
        </button>
      </div>

      {/* === Sidebar === */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-10
          w-72 bg-gray-900 border-r border-gray-800 p-3 space-y-2
          transform transition-transform duration-300
          ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* --- Tabs (notes/tags) --- */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setSidebarView('notes')}
            className={`flex-1 py-1 rounded ${
              sidebarView === 'notes' ? 'bg-blue-600' : 'bg-gray-800'
            }`}
          >
            🗒️ Notes
          </button>
          <button
            onClick={() => setSidebarView('tags')}
            className={`flex-1 py-1 rounded ${
              sidebarView === 'tags' ? 'bg-blue-600' : 'bg-gray-800'
            }`}
          >
            🏷️ Tags
          </button>
        </div>

        {/* --- Actions principales --- */}
        <button
          onClick={onCreate}
          className="w-full py-2 bg-blue-600 rounded hover:bg-blue-500"
        >
          + Nouvelle note
        </button>

        {/* --- Export / Import clair --- */}
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="flex-1 py-1 bg-gray-800 rounded hover:bg-gray-700"
          >
            ⤓ Export
          </button>
          <label className="flex-1 py-1 bg-gray-800 rounded text-center cursor-pointer hover:bg-gray-700">
            ⤒ Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => onImport(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* --- Export / Import chiffré --- */}
        <div className="flex gap-2">
          <button
            onClick={onExportEncrypted}
            className="flex-1 py-1 bg-blue-700 rounded hover:bg-blue-600"
          >
            🔐 Export chiffré
          </button>
          <label className="flex-1 py-1 bg-green-700 rounded text-center cursor-pointer hover:bg-green-600">
            🔓 Import chiffré
            <input
              type="file"
              accept="application/pen+json,application/json"
              className="hidden"
              onChange={(e) => onImportEncrypted(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* --- Barre de recherche --- */}
        <div className="relative w-full">
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Rechercher..."
    className="w-full px-2 py-1 bg-gray-800 rounded pr-8"
  />
  {search && (
    <button
      onClick={() => setSearch('')}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400"
      title="Effacer"
    >
      ✕
    </button>
  )}
</div>


        

        <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
  {sidebarView === 'notes' ? (
    notes.map((n) => (
      <div
        key={n.id}
        className={`p-2 rounded cursor-pointer flex justify-between items-center ${
          active?.id === n.id ? 'bg-blue-700' : 'hover:bg-gray-800'
        }`}
      >
        <div
          className="flex-1 min-w-0"
          onClick={() => {
            onSelect(n);
            setMenuOpen(false);
          }}
        >
          <div className="font-semibold truncate">
            {n.title || '(sans titre)'}
          </div>
          <div className="text-xs text-gray-400">
            {new Date(n.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {/* --- Export individuel chiffré --- */}
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const password = prompt('Mot de passe pour le chiffrement :');
            if (!password) return;

            try {
              const raw = await storage.exportNote(n.id);
              const obj = JSON.parse(raw);
              const { encryptVault } = await import('../lib/crypto-pen');
              const encrypted = await encryptVault(password, obj);

              const blob = new Blob([JSON.stringify(encrypted, null, 2)], {
                type: 'application/pen+json',
              });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `${n.title || 'note'}-encrypted.pen.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            } catch (err) {
              console.error('Erreur export individuel', err);
              alert('❌ Erreur lors de l’export de la note');
            }
          }}
          className="ml-2 text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-blue-300"
          title="Exporter cette note (chiffré)"
        >
          ⤓
        </button>
      </div>
    ))
  ) : (
    allTags.map((tag) => (
      <div
        key={tag}
        onClick={() => {
          setSearch('#' + tag);
          setSidebarView('notes');
        }}
        className="p-2 rounded cursor-pointer hover:bg-gray-800 text-blue-400"
      >
        #{tag}
      </div>
    ))
  )}
</div>
      </aside>
    </>
  );
}
