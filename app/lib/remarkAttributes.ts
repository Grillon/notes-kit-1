import { visit } from 'unist-util-visit';
import type { Parent } from 'unist'
import type { Literal } from 'mdast';

/**
 * Gère les attributs d'image :
 *  - ![alt](src){width=200px height=100px align=center float=right}
 */
export function remarkAttributes() {
  return (tree: any) => {
      visit(tree, (node: any, index?: number, parent?: Parent) => {

      if (!parent || !Array.isArray(parent.children)) return;

      if (node.type === 'image') {
        let attrsString: string | null = null;

        // Cas 1: attributs dans le title
        if (typeof node.title === 'string') {
          const m = node.title.match(/\{([^}]+)\}/);
          if (m) {
            attrsString = m[1];
            const cleaned = node.title.replace(m[0], '').trim();
            node.title = cleaned.length ? cleaned : null;
          }
        }

        // Cas 2: attributs juste après l'image
        if (!attrsString && typeof index === 'number') {

          const next = parent.children[index + 1] as Literal;

          if (next && next.type === 'text' && typeof next.value === 'string') {
            const m2 = next.value.match(/^\{([^}]+)\}\s*/);
            if (m2) {
              attrsString = m2[1];
              next.value = next.value.slice(m2[0].length);
              if (next.value.length === 0) {
                parent.children.splice(index + 1, 1);
              }
            }
          }
        }

        if (!attrsString) return;

        const { hProps, alt } = parseAttributes(attrsString);

        if (typeof alt === 'string' && alt.length) {
          node.alt = alt;
        }

        if (Object.keys(hProps).length) {
          node.data = node.data || {};
          node.data.hProperties = {
            ...(node.data.hProperties || {}),
            ...hProps,
          };
        }
      }
    });
  };
}

function parseAttributes(raw: string): { hProps: Record<string, string>; alt?: string } {
  const pairs = raw
    .split(/\s+/)
    .map((a) => a.split('='))
    .filter(([k, v]) => k && v);

  const hProps: Record<string, string> = {};
  let alt: string | undefined;

  for (const [k, vRaw] of pairs) {
    const key = k.trim().toLowerCase();
    const val = vRaw.replace(/^[\'"]|[\'"]$/g, '').trim();

    if (!key || !val) continue;

    if (key === 'alt') {
      alt = val;
      continue;
    }

    if (key === 'width' || key === 'height') {
      if (/^\d+(px|%|rem|em|vh|vw)?$/.test(val)) {
        hProps[key] = val.endsWith('px') || /%|rem|em|vh|vw$/.test(val)
          ? val
          : `${val}px`;
      }
      continue;
    }

    // === Positionnement ===
    if (key === 'align') {
      if (['left', 'center', 'right'].includes(val)) {
        const style =
          val === 'center'
            ? 'display:block;margin-left:auto;margin-right:auto;'
            : val === 'right' ? `display:block;margin-left:auto;` : `display:block;margin-right:auto;`;
        hProps.style = (hProps.style || '') + style;
      }
      continue;
    }

    if (key === 'float') {
      if (['left', 'right'].includes(val)) {
        const style = `float:${val};margin-${val === 'left' ? 'right' : 'left'}:1em;`;
        hProps.style = (hProps.style || '') + style;
      }
      continue;
    }

    // Autres attributs génériques
    if (/^[a-z][a-z0-9_-]*$/i.test(key)) {
      hProps[key] = val;
    }
  }

  return { hProps, alt };
}
