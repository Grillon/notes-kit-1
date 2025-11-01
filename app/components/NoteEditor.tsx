'use client';
import React, { useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { extractTags, renderMarkdown } from '../lib/markdown-utils';
import type { Note, ImageData } from '../types';
import { storage } from '../lib/storage';
import { remarkAttributes } from '../lib/remarkAttributes';
import NoteToolbar from './NoteToolbar';

type Props = {
  active: Note | null;
  draft: Note | null;
  setDraft: React.Dispatch<React.SetStateAction<Note | null>>;
  deleteNote: () => void;
  preview: boolean;
  setPreview: (b: boolean) => void;
  activeTab: 'edit' | 'preview';
  setActiveTab: (v: 'edit' | 'preview') => void;
  search: string;
  setSearch: (s: string) => void;
  images: ImageData[];
  setImages: (imgs: ImageData[]) => void;
};

export default function NoteEditor({
  active,
  draft,
  setDraft,
  deleteNote,
  preview,
  setPreview,
  activeTab,
  setActiveTab,
  search,
  setSearch,
  images,
  setImages,
}: Props) {
  // Charger images liées
  useEffect(() => {
    (async () => {
      if (active?.id) {
        const imgs = await storage.listImages(active.id);
        setImages(imgs);
      } else {
        setImages([]);
      }
    })();
  }, [active, setImages]);

  // Map d'URL pour affichage local
  const imageURLMap = useMemo(() => {
    const entries = images
      .filter((img) => img.id != null)
      .map((img) => [String(img.id), URL.createObjectURL(img.data)] as const);
    return new Map(entries);
  }, [images]);
  useEffect(() => () => imageURLMap.forEach((u) => URL.revokeObjectURL(u)), [imageURLMap]);

  // Ajout / suppression images
  const handleAddImage = async (file: File) => {
    if (!active?.id) return;
    await storage.addImage(active.id, file);
    const imgs = await storage.listImages(active.id);
    setImages(imgs);
  };
  const handleRemoveImage = async (id: number) => {
    await storage.removeImage(id);
    if (active?.id) setImages(await storage.listImages(active.id));
  };

  if (!draft)
    return <div className="text-gray-500">Aucune note sélectionnée</div>;

  return (
    <>

      {/* === Titre === */}
      <input
        value={draft.title}
        onChange={(e) =>
          setDraft((d) => d && { ...d, title: e.target.value })
        }
        placeholder="Titre..."
        className="w-full text-2xl bg-transparent border-b border-gray-700 focus:outline-none mb-3"
      />
<NoteToolbar
  images={images}
  onAddImage={handleAddImage}
  onInsertText={(snippet) =>
    setDraft((d) => d && { ...d, content: (d.content || '') + '\n' + snippet })
  }
/>


      {/* --- Pied --- */}
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

      {/* === Zone d’édition / preview === */}
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        {/* Édition */}
        <div className="flex-1">
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

          <div className={`${activeTab === 'edit' ? 'block' : 'hidden'} md:block`}>
            <textarea
              value={draft.content}
              onChange={(e) =>
                setDraft((d) => d && { ...d, content: e.target.value })
              }
              placeholder="Contenu (Markdown)..."
              rows={16}
              className="w-full p-2 bg-gray-800 rounded-lg focus:outline-none"
            />
            {draft && extractTags(draft.content).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {extractTags(draft.content).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearch('#' + tag)}
                    className="px-2 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700 text-blue-400 border border-gray-700"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div
          className={`${activeTab === 'preview' ? 'block' : 'hidden'} md:block flex-1 p-3 bg-gray-800 rounded border border-gray-700 markdown-preview overflow-auto`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkAttributes]}
            rehypePlugins={[rehypeHighlight]}
            urlTransform={(src) => {
  const s = typeof src === 'string' ? src.trim() : '';
  if (!s) return null; // <== changement ici
  if (s.startsWith('image:')) {
    const id = s.slice('image:'.length);
    const resolved = imageURLMap.get(id);
    return resolved || null; // <== et ici aussi
  }
  return s;
}}

          >
            {renderMarkdown(draft.content)}
          </ReactMarkdown>
          <div className="mt-4 flex flex-wrap gap-2">
            {extractTags(draft.content).map((tag) => (
              <button
                key={tag}
                onClick={() => setSearch('#' + tag)}
                className="px-2 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700 text-blue-400 border border-gray-700"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
