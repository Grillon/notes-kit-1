'use client';
import { useState } from 'react';
import type { ImageData } from '../types';
import type { FileData } from '../lib/storage';

interface NoteToolbarProps {
  images: ImageData[];
  files: FileData[];
  onAddImage: (file: File) => void;
  onAddFile: (file: File) => void;
  onInsertText: (snippet: string) => void;
  onRemoveImage: (id: number) => void;
  onRemoveFile: (id: number) => void;
}

export default function NoteToolbar({
  images,
  files,
  onAddImage,
  onAddFile,
  onInsertText,
  onRemoveImage,
  onRemoveFile,
}: NoteToolbarProps) {
  const [tab, setTab] = useState<'markdown' | 'images' | 'files'>('markdown');

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg p-2 mb-3 sticky top-0 z-10 shadow-md h-52 flex flex-col">
      {/* === Onglets === */}
      <div className="flex gap-2 mb-2 border-b border-gray-700">
        {['markdown', 'images', 'files'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-3 py-1 rounded-t text-sm font-medium ${
              tab === t ? 'bg-gray-900 text-blue-400' : 'text-gray-400 hover:text-blue-300'
            }`}
          >
            {t === 'markdown'
              ? '📝 Markdown'
              : t === 'images'
              ? '🖼️ Images'
              : '📎 Fichiers'}
          </button>
        ))}
      </div>

      {/* === Contenu des onglets === */}
      <div className="h-full overflow-y-auto p-2">
        {/* Onglet Markdown */}
        {tab === 'markdown' && (
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'B', code: '**texte gras**' },
              { label: 'I', code: '*italique*' },
              { label: 'UL', code: '- élément' },
              { label: 'OL', code: '1. élément' },
              {
                label: 'Table',
                code: '| Col1 | Col2 |\n|------|------|\n| A | B |',
              },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => onInsertText(btn.code)}
                className="px-2 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Onglet Images */}
        {tab === 'images' && (
          <div className="space-y-2">
            <label className="bg-gray-700 px-3 py-1 rounded cursor-pointer inline-block hover:bg-gray-600">
              📷 Ajouter une image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onAddImage(e.target.files[0])}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              {images.map((img) => {
                const blobUrl = URL.createObjectURL(img.data);
                return (
                  <div
                    key={img.id}
                    className="relative border border-gray-700 rounded p-1 flex flex-col items-center bg-gray-900"
                  >
                    <img
                      src={blobUrl}
                      alt={img.name}
                      className="h-16 w-16 object-cover rounded"
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        title="Insérer dans la note"
                        onClick={() =>
                          onInsertText(
                            `![${img.name}](image:${img.id}){width=200px align=center}`
                          )
                        }
                        className="text-xs bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-500"
                      >
                        ↳
                      </button>
                      <a
                        title="Télécharger"
                        href={blobUrl}
                        download={img.name || `image-${img.id}`}
                        className="text-xs bg-green-600 px-2 py-0.5 rounded hover:bg-green-500"
                      >
                        ⤓
                      </a>
                      <button
                        title="Supprimer"
                        onClick={() => onRemoveImage(img.id!)}
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
        )}

        {/* Onglet Fichiers */}
        {tab === 'files' && (
          <div className="space-y-2">
            <label className="bg-gray-700 px-3 py-1 rounded cursor-pointer inline-block hover:bg-gray-600">
              📎 Ajouter un fichier
              <input
                type="file"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && onAddFile(e.target.files[0])
                }
              />
            </label>

            <div className="flex flex-wrap gap-3">
              {files.map((f) => {
                const blobUrl = URL.createObjectURL(f.data);
                return (
                  <div
                    key={f.id}
                    className="relative border border-gray-700 rounded p-2 flex flex-col items-center bg-gray-900"
                  >
                    <div className="truncate max-w-[100px] text-xs text-gray-300">
                      {f.name}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <button
                        title="Insérer dans la note"
                        onClick={() =>
                          onInsertText(`[${f.name}](file:${f.id})`)
                        }
                        className="text-xs bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-500"
                      >
                        ↳
                      </button>
                      <a
                        title="Télécharger"
                        href={blobUrl}
                        download={f.name || `file-${f.id}`}
                        className="text-xs bg-green-600 px-2 py-0.5 rounded hover:bg-green-500"
                      >
                        ⤓
                      </a>
                      <button
                        title="Supprimer"
                        onClick={() => onRemoveFile(f.id!)}
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
        )}
      </div>
    </div>
  );
}
