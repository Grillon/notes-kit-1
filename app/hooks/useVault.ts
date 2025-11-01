'use client';
import { useEffect, useMemo, useState } from 'react';
import { storage } from '../lib/storage';
import type { Note } from '../types';
import { extractTags } from '../lib/markdown-utils';

/**
 * Hook principal de gestion des notes (vault)
 * - Charge les notes depuis IndexedDB
 * - Gère la note active et son brouillon
 * - Assure l’autosave différée
 * - Fournit la recherche et le filtrage
 */
export function useVault() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [draft, setDraft] = useState<Note | null>(null);
  const [search, setSearch] = useState('');

  /* === Chargement initial === */
  useEffect(() => {
    (async () => {
      const all = await storage.list();
      setNotes(all);
      const first = all[0] ?? null;
      setActive(first);
      setDraft(first ? { ...first } : null);
    })();
  }, []);

  /* === Synchronisation du brouillon quand on change de note === */
  useEffect(() => {
    setDraft(active ? { ...active } : null);
  }, [active]);

  /* === Autosave différée (brouillon → DB) === */
  useEffect(() => {
    if (!draft) return;
    const t = setTimeout(async () => {
      const tags = extractTags(draft.content);
      await storage.update(draft.id, {
        title: draft.title,
        content: draft.content,
        tags,
      });
      const all = await storage.list();
      setNotes(all);
    }, 600);
    return () => clearTimeout(t);
  }, [draft]);

  /* === Filtrage par recherche === */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? notes.filter((n) =>
          (n.title + ' ' + n.content).toLowerCase().includes(q)
        )
      : notes;
  }, [notes, search]);

  return {
    notes,
    setNotes,
    active,
    setActive,
    draft,
    setDraft,
    search,
    setSearch,
    filtered,
  };
}
