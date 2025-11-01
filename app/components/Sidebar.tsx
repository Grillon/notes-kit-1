'use client';
import React from 'react';
import type { Note } from '../types';

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
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full px-2 py-1 bg-gray-800 rounded"
        />

        {/* --- Liste notes / tags --- */}
        <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
          {sidebarView === 'notes' ? (
            notes.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  onSelect(n);
                  setMenuOpen(false);
                }}
                className={`p-2 rounded cursor-pointer ${
                  active?.id === n.id ? 'bg-blue-700' : 'hover:bg-gray-800'
                }`}
              >
                <div className="font-semibold truncate">
                  {n.title || '(sans titre)'}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(n.updatedAt).toLocaleDateString()}
                </div>
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
