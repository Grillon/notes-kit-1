'use client';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { extractTags, renderMarkdown } from '../lib/markdown-utils';
import type { Note, ImageData } from '../types';
import type { FileData } from '../lib/storage';
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
  files: FileData[];
  setFiles: (f: FileData[]) => void;
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
  files,
  setFiles,
}: Props) {
  const [allFiles, setAllFiles] = useState<FileData[]>([]);
  const [allImages, setAllImages] = useState<ImageData[]>([]);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Charger images et fichiers liés
  useEffect(() => {
    (async () => {
      if (active?.id) {
        const imgs = await storage.listImages(active.id);
        const fls = await storage.listFiles(active.id);
        setAllFiles(await storage.listAllFiles());
        setAllImages(await storage.listAllImages());
        setImages(imgs);
        setFiles(fls);
      } else {
        setImages([]);
        setFiles([]);
      }
    })();
  }, [active, setImages, setFiles]);

  // Maps locales d’URL
  const imageURLMap = useMemo(() => {
    const entries = images
      .filter((img) => img.id != null)
      .map((img) => [String(img.id), URL.createObjectURL(img.data)] as const);
    return new Map(entries);
  }, [images]);
  useEffect(() => () => imageURLMap.forEach((u) => URL.revokeObjectURL(u)), [imageURLMap]);

  const fileURLMap = useMemo(() => {
    const entries = files
      .filter((f) => f.id != null)
      .map((f) => [String(f.id), URL.createObjectURL(f.data)] as const);
    return new Map(entries);
  }, [files]);
  useEffect(() => () => fileURLMap.forEach((u) => URL.revokeObjectURL(u)), [fileURLMap]);
  useEffect(() => {
  return () => allFiles.forEach((f) => URL.revokeObjectURL(URL.createObjectURL(f.data)));
}, [allFiles]);


  // === Insertion au curseur ===
  const insertAtCursor = (snippet: string) => {
    if (!textAreaRef.current) return;
    const textarea = textAreaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const newValue = value.slice(0, start) + snippet + value.slice(end);
    setDraft((d) => d && { ...d, content: newValue });
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
    });
  };

  // === Gestion images ===
  const handleAddImage = async (file: File) => {
    if (!active?.id) return;
    await storage.addImage(active.id, file);
    setImages(await storage.listImages(active.id));
    setAllImages(await storage.listAllImages());
  };
  const handleRemoveImage = async (id: number) => {
    await storage.removeImage(id);
    if (active?.id) setImages(await storage.listImages(active.id));
    setAllImages(await storage.listAllImages());
  };

  // === Gestion fichiers ===
  const handleAddFile = async (file: File) => {
    if (!active?.id) return;
    await storage.addFile(active.id, file);
    setFiles(await storage.listFiles(active.id));
    setAllFiles(await storage.listAllFiles());
  };
  const handleRemoveFile = async (id: number) => {
    await storage.removeFile(id);
    if (active?.id) setFiles(await storage.listFiles(active.id));
    setAllFiles(await storage.listAllFiles());
  };

  if (!draft) return <div className="text-gray-500">Aucune note sélectionnée</div>;

  return (
    <>
      {/* === Titre === */}
      <input
        value={draft.title}
        onChange={(e) => setDraft((d) => d && { ...d, title: e.target.value })}
        placeholder="Titre..."
        className="w-full text-2xl bg-transparent border-b border-gray-700 focus:outline-none mb-3"
      />

      {/* === Toolbar === */}
      <NoteToolbar
        images={images}
        files={files}
        allImages={allImages}
        allFiles={allFiles}
        onAddImage={handleAddImage}
        onAddFile={handleAddFile}
        onInsertText={insertAtCursor} // insertion au curseur
        onRemoveImage={handleRemoveImage}
        onRemoveFile={handleRemoveFile}
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
              ref={textAreaRef}
              value={draft.content}
              onChange={(e) => setDraft((d) => d && { ...d, content: e.target.value })}
              placeholder="Contenu (Markdown)..."
              rows={16}
              className="w-full p-2 bg-gray-800 rounded-lg focus:outline-none"
            />
            {extractTags(draft.content).length > 0 && (
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
          className={`${
            activeTab === 'preview' ? 'block' : 'hidden'
          } md:block flex-1 p-3 bg-gray-800 rounded border border-gray-700 markdown-preview overflow-auto`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkAttributes]}
            rehypePlugins={[rehypeHighlight]}
            urlTransform={(src) => {
  const s = typeof src === 'string' ? src.trim() : '';
  if (!s) return null;

  if (s.startsWith('image:')) {
    const id = s.slice('image:'.length);
    return imageURLMap.get(id) || null;
  }

  if (s.startsWith('file:')) {
    const id = s.slice('file:'.length);
    // ✅ essaie d'abord dans le mémo actif
    let resolved = fileURLMap.get(id);
    if (!resolved) {
      // ✅ sinon essaie dans tous les fichiers connus
      const found = allFiles.find((f) => String(f.id) === id);
      if (found) resolved = URL.createObjectURL(found.data);
    }
    return resolved || null;
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
