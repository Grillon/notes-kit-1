'use client';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // style de code blocks
import { storage } from './lib/storage';
import { Note } from './types';

export default function Page() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [preview, setPreview] = useState(false);
  const [search, setSearch] = useState('');

  // Charger les notes au démarrage
  useEffect(() => {
    const all = storage.list();
    setNotes(all);
    setActive(all[0] ?? null);
  }, []);

  const createNote = () => {
    const n = storage.create();
    setNotes(storage.list());
    setActive(n);
  };

  const updateNote = (patch: Partial<Note>) => {
    if (!active) return;
    const updated = storage.update(active.id, patch);
    if (updated) {
      setNotes(storage.list());
      setActive(updated);
    }
  };

  const deleteNote = () => {
    if (!active) return;
    storage.remove(active.id);
    const all = storage.list();
    setNotes(all);
    setActive(all[0] ?? null);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? notes.filter(n =>
          (n.title + ' ' + n.content).toLowerCase().includes(q),
        )
      : notes;
  }, [notes, search]);

  const exportNotes = () => {
    const blob = new Blob([storage.export()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `portable-notes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importNotes = (file: File | null) => {
    if (!file) return;
    file.text().then(json => {
      storage.import(json);
      const all = storage.list();
      setNotes(all);
      setActive(all[0] ?? null);
    });
  };

  return (
    <main className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Liste */}
      <aside className="w-72 border-r border-gray-800 p-3 space-y-2">
        <button
          onClick={createNote}
          className="w-full py-2 bg-blue-600 rounded hover:bg-blue-500"
        >
          + Nouvelle note
        </button>
        <div className="flex gap-2">
          <button onClick={exportNotes} className="flex-1 py-1 bg-gray-800 rounded">
            ⤓ Exporter
          </button>
          <label className="flex-1 py-1 bg-gray-800 rounded text-center cursor-pointer">
            ⤒ Importer
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={e => importNotes(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full px-2 py-1 bg-gray-800 rounded"
        />
        <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
          {filtered.map(n => (
            <div
              key={n.id}
              onClick={() => setActive(n)}
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
          ))}
        </div>
      </aside>

      {/* Éditeur */}
      <section className="flex-1 p-4 max-w-3xl mx-auto">
        {!active ? (
          <div className="text-gray-500">Aucune note sélectionnée</div>
        ) : (
          <>
            <input
              value={active.title}
              onChange={e => updateNote({ title: e.target.value })}
              placeholder="Titre..."
              className="w-full text-2xl bg-transparent border-b border-gray-700 focus:outline-none mb-3"
            />
            <textarea
              value={active.content}
              onChange={e => updateNote({ content: e.target.value })}
              placeholder="Contenu (Markdown)..."
              rows={12}
              className="w-full p-2 bg-gray-800 rounded-lg focus:outline-none"
            />
            <div className="flex justify-between mt-3">
              <span className="text-xs text-gray-400">
                {new Date(active.updatedAt).toLocaleTimeString()}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setPreview(!preview)}
                  className="px-3 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700"
                >
                  {preview ? 'Fermer' : 'Preview'}
                </button>
                <button
                  onClick={deleteNote}
                  className="px-3 py-1 text-sm bg-red-600 rounded hover:bg-red-500"
                >
                  Supprimer
                </button>
              </div>
            </div>
            {preview && (
  <div className="mt-4 p-4 bg-gray-800 rounded border border-gray-700 markdown-preview prose prose-invert max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
    >
      {active.content || ''}
    </ReactMarkdown>
  </div>
)}

          </>
        )}
      </section>
    </main>
  );
}
