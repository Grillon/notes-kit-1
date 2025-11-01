// app/components/NoteToolbar.tsx
'use client';
import { useState } from 'react';
import type { ImageData } from '../types';

interface NoteToolbarProps {
  images: ImageData[];
  onAddImage: (file: File) => void;
  onInsertText: (snippet: string) => void;
}

export default function NoteToolbar({ images, onAddImage, onInsertText }: NoteToolbarProps) {
  const [tab, setTab] = useState<'markdown' | 'images' | 'files'>('markdown');

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg p-2 mb-3 sticky top-0 z-10 shadow-md h-52 flex flex-col">
      {/* Tabs */}
      <div className="flex gap-2 mb-2 border-b border-gray-700">
        {['markdown', 'images', 'files'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-3 py-1 rounded-t ${
              tab === t ? 'bg-gray-900 text-blue-400' : 'text-gray-400 hover:text-blue-300'
            }`}
          >
            {t === 'markdown' ? '📝 Markdown' : t === 'images' ? '🖼️ Images' : '📎 Fichiers'}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="h-40 overflow-y-auto p-2 transition-all duration-300">
        {tab === 'markdown' && (
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'B', code: '**gras**' },
              { label: 'I', code: '*italique*' },
              { label: 'UL', code: '- item' },
              { label: 'OL', code: '1. item' },
              { label: 'Table', code: '| Col1 | Col2 |\n|------|------|\n| A | B |' },
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

        {tab === 'images' && (
          <div className="space-y-2">
            <label className="bg-gray-700 px-3 py-1 rounded cursor-pointer inline-block">
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
                  <div key={img.id} className="relative border border-gray-700 rounded p-1">
                    <img src={blobUrl} className="h-16 w-16 object-cover rounded" />
                    <button
                      onClick={() =>
                        onInsertText(`![${img.name}](image:${img.id}){width=200px align=center}`)
                      }
                      className="absolute bottom-0 left-0 right-0 text-xs bg-blue-600 hover:bg-blue-500"
                    >
                      ↳ insérer
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'files' && (
          <div className="text-gray-400 text-sm italic">
            📎 Gestion des fichiers à venir (PDF, audio, zip…)
          </div>
        )}
      </div>
    </div>
  );
}
