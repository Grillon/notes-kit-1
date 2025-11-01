// app/lib/markdown-utils.ts

/** Extrait les tags # ou #'tag composé' d’un texte */
export function extractTags(text: string): string[] {
  const regex = /#'([^']+)'|#(\w+)/g;
  const tags = new Set<string>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const tag = match[1] || match[2];
    if (tag) tags.add(tag.trim().toLowerCase());
  }
  return [...tags];
}

/** Transforme [[Titre]] → [Titre](note:titre) */
export function renderMarkdown(text: string): string {
  return text.replace(/\[\[(.+?)\]\]/g, (_, name) => {
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
    return `[${name}](note:${slug})`;
  });
}
