'use client';
import { useEffect, useMemo, useState } from 'react';
import { storage } from './lib/storage';
import type { Note, ImageData } from './types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { remarkAttributes } from './lib/remarkAttributes';

export default function Page() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [draft, setDraft] = useState<Note | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [preview, setPreview] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [menuOpen, setMenuOpen] = useState(false);



  /* === Charger les notes === */
  useEffect(() => {
    (async () => {
      const all = await storage.list();
      setNotes(all);
      setActive(all[0] ?? null);
    })();
  }, []);

  /* === Charger le brouillon et les images === */
  useEffect(() => {
    queueMicrotask(() => setDraft(active ? { ...active } : null));

    let cancelled = false;
    (async () => {
      if (!active?.id) {
        setImages([]);
        return;
      }
    const imgs = await storage.listAllImages();
    if (!cancelled) setImages(imgs);
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  /* === Autosave différée (brouillon → DB) === */
  useEffect(() => {
    if (!draft) return;
    const t = setTimeout(async () => {
      await storage.update(draft.id, {
        title: draft.title,
        content: draft.content,
      });
      const all = await storage.list();
      setNotes(all);
    }, 600);
    return () => clearTimeout(t);
  }, [draft]);

  /* === Recherche === */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      (n.title + ' ' + n.content).toLowerCase().includes(q),
    );
  }, [notes, search]);

  /* === CRUD Notes === */
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

  /* === Images === */
  const handleAddImage = async (file: File) => {
    if (!active?.id) return;
    await storage.addImage(active.id, file);
    const imgs = await storage.listImages(active.id);
    setImages(imgs);
  };

  const handleRemoveImage = async (id: number) => {
    await storage.removeImage(id);
    if (active?.id) {
      const imgs = await storage.listImages(active.id);
      setImages(imgs);
    }
  };

  /* === Export / Import === */
  const handleExport = async () => {
    const blob = new Blob([await storage.export()], {
      type: 'application/json',
    });
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

  /* === Map d'URL d'images pour le rendu Markdown === */
  const imageURLMap = useMemo(() => {
    const entries = images
      .filter((img) => img.id != null)
      .map((img) => [String(img.id), URL.createObjectURL(img.data)] as const);
    return new Map(entries);
  }, [images]);

  useEffect(() => {
    return () => {
      imageURLMap.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [imageURLMap]);

  /* === Rendu Markdown avec images stylées === */
  const markdownComponents = {
  img: (props: any) => {
    const raw = props.src;
    const src = typeof raw === 'string' ? raw.trim() : '';
    if (!src) return null;

    const align = props.align ?? '';            // center | left | right
    const floatDir = props.float ?? '';         // left | right

    const style: React.CSSProperties = {
      ...(typeof props.style === 'object' ? props.style : {}),
      width: props.width || 'auto',
      height: props.height || 'auto',
      borderRadius: props['border-radius'] || '8px',
      maxWidth: '100%',
      // no default centering anymore
    };

    // Align: use block + margins only when needed
    if (align === 'center') {
      style.display = 'block';
      style.marginLeft = 'auto';
      style.marginRight = 'auto';
    } else if (align === 'right') {
      style.display = 'block';
      style.marginLeft = 'auto';
      style.marginRight = '0';
    } else if (align === 'left') {
      style.display = 'block';
      style.marginLeft = '0';
      style.marginRight = 'auto';
    }

    // Float if requested
    if (floatDir === 'left' || floatDir === 'right') {
      (style as any).float = floatDir; // or style.cssFloat = floatDir
      // give a little breathing room around floated images
      style.margin = style.margin ?? '0.5em';
    }

    const imgSrc = src.startsWith('image:')
      ? imageURLMap.get(src.slice('image:'.length)) ?? ''
      : src;

    return <img {...props} src={imgSrc} alt={props.alt ?? ''} style={style} />;
  },
};




  return (
    <main className="flex min-h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* === Bouton mobile === */}
<div className="md:hidden fixed top-3 right-3 z-20">
  <button
    onClick={() => setMenuOpen(!menuOpen)}
    className="p-2 rounded bg-gray-800 hover:bg-gray-700"
  >
    {/* Icône burger simple */}
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

{/* === Liste des notes === */}
<aside
  className={`
    fixed md:static inset-y-0 left-0 z-10
    w-72 bg-gray-900 border-r border-gray-800 p-3 space-y-2
    transform transition-transform duration-300
    ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `}
>
  <button
    onClick={createNote}
    className="w-full py-2 bg-blue-600 rounded hover:bg-blue-500"
  >
    + Nouvelle note
  </button>

  <div className="flex gap-2">
    <button
      onClick={handleExport}
      className="flex-1 py-1 bg-gray-800 rounded"
    >
      ⤓ Export
    </button>
    <label className="flex-1 py-1 bg-gray-800 rounded text-center cursor-pointer">
      ⤒ Import
      <input
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
      />
    </label>
  </div>

  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Rechercher..."
    className="w-full px-2 py-1 bg-gray-800 rounded"
  />

  <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
    {filtered.map((n) => (
      <div
        key={n.id}
        onClick={() => {
          setActive(n);
          setMenuOpen(false); // referme le menu après clic
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
    ))}
  </div>
</aside>

      {/* === Éditeur === */}
      <section className="flex-1 p-6 mx-auto w-full max-w-none">
        {!draft ? (
          <div className="text-gray-500">Aucune note sélectionnée</div>
        ) : (
          <>
            <input
              value={draft.title}
              onChange={(e) =>
                setDraft((d) => d && { ...d, title: e.target.value })
              }
              placeholder="Titre..."
              className="w-full text-2xl bg-transparent border-b border-gray-700 focus:outline-none mb-3"
            />

            {/* === Images === */}
            <div className="mt-4">
              <label className="bg-gray-800 px-3 py-1 rounded cursor-pointer">
                📷 Ajouter une image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleAddImage(e.target.files[0])
                  }
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-3">
                {images.map((img) => {
                  const blobUrl = URL.createObjectURL(img.data);
                  return (
                    <div
                      key={img.id}
                      className="relative border border-gray-700 rounded p-1 flex flex-col items-center"
                    >
                      <img
                        src={blobUrl}
                        alt={img.name}
                        className="h-24 w-24 object-cover rounded"
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() =>
                            setDraft((d) =>
                              d && {
                                ...d,
                                content:
                                  (d.content || '') +
                                  `\n\n![${img.name}](image:${img.id}){width=200px height=200px align=center}\n`,
                              },
                            )
                          }
                          className="text-xs bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-500"
                        >
                          ↳ insérer
                        </button>
                        <button
                          onClick={() => handleRemoveImage(img.id!)}
                          className="text-xs bg-red-600 px-2 py-0.5 rounded hover:bg-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- Pied de l’éditeur --- */}
            <div className="flex justify-between mt-3">
              <span className="text-xs text-gray-400">
                {new Date(draft.updatedAt).toLocaleTimeString()}
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

            {/* === Preview Markdown === */}
{/* === Zone d’édition + preview === */}
<div className="flex flex-col md:flex-row gap-4 mt-4">
  {/* === Éditeur === */}
  <div className="flex-1">
    {/* Onglets visibles uniquement sur mobile */}
    <div className="flex md:hidden justify-around mb-2 border-b border-gray-700">
      <button
        onClick={() => setActiveTab('edit')}
        className={`flex-1 py-2 ${
          activeTab === 'edit'
            ? 'border-b-2 border-blue-500 text-blue-400'
            : 'text-gray-400'
        }`}
      >
        ✍️ Édition
      </button>
      <button
        onClick={() => setActiveTab('preview')}
        className={`flex-1 py-2 ${
          activeTab === 'preview'
            ? 'border-b-2 border-blue-500 text-blue-400'
            : 'text-gray-400'
        }`}
      >
        👁️ Aperçu
      </button>
    </div>

    {/* Zone d'édition */}
    <div className={`${activeTab === 'edit' ? 'block' : 'hidden'} md:block`}>
      <textarea
        value={draft?.content ?? ''}
        onChange={(e) =>
          setDraft((d) => d && { ...d, content: e.target.value })
        }
        placeholder="Contenu (Markdown)..."
        rows={16}
        className="w-full p-2 bg-gray-800 rounded-lg focus:outline-none"
      />
    </div>
  </div>

  {/* === Preview Markdown === */}
  <div
    className={`${activeTab === 'preview' ? 'block' : 'hidden'} md:block flex-1 p-3 bg-gray-800 rounded border border-gray-700 markdown-preview overflow-auto`}
  >
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkAttributes]}
      rehypePlugins={[rehypeHighlight]}
      urlTransform={(src) => {
        const s = typeof src === 'string' ? src.trim() : '';
        if (!s) return '';
        if (s.startsWith('image:')) {
          const id = s.slice('image:'.length);
          return imageURLMap.get(id) ?? '';
        }
        return s;
      }}
      components={markdownComponents}
    >
      {draft?.content ?? ''}
    </ReactMarkdown>
  </div>
</div>

          </>
        )}
      </section>
    </main>
  );
}
