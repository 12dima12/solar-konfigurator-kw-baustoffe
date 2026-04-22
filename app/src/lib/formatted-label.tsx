import { Fragment, type ReactNode } from "react";

/**
 * Renders a short HTML string from the SolaX catalog as safe React nodes.
 *
 * The catalog is a statically-bundled asset, so XSS is not a concern, but
 * we still avoid dangerouslySetInnerHTML: only the exact tags GBC emits
 * are recognised and mapped to React; anything else falls through as text.
 *
 * Supported tags (1:1 enumeration of what appears in catalog.json):
 *   <small class="text-gray-600">  → muted sub-text
 *   <br>                            → hard line break
 *   <span class="text-green-500">   → green inline span
 *   <span class="text-red-500">     → red inline span
 *   <i class="... fa-check ...">    → ✓ (green)
 *   <i class="... fa-xmark ...">    → ✗ (red)
 *   <ul>/<li>                       → bullet list
 *
 * Classnames on <i> for FontAwesome icons are ignored beyond the icon
 * family identifier (fa-check vs fa-xmark); we render a Unicode symbol
 * instead of pulling in FontAwesome. Color intent is preserved.
 */

interface Token {
  kind: "text" | "open" | "close" | "void";
  tag?: string;
  attrs?: string;
  text?: string;
}

function tokenize(raw: string): Token[] {
  const toks: Token[] = [];
  const TAG = /<(\/)?\s*(small|br|span|i|ul|li)(\s[^>]*)?\s*(\/?)>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG.exec(raw)) !== null) {
    if (m.index > last) toks.push({ kind: "text", text: raw.slice(last, m.index) });
    const [, closing, tag, attrs, selfClose] = m;
    const t = tag.toLowerCase();
    if (t === "br" || selfClose) toks.push({ kind: "void", tag: t });
    else if (closing) toks.push({ kind: "close", tag: t });
    else toks.push({ kind: "open", tag: t, attrs: attrs?.trim() || "" });
    last = m.index + m[0].length;
  }
  if (last < raw.length) toks.push({ kind: "text", text: raw.slice(last) });
  return toks;
}

function hasClass(attrs: string | undefined, cls: string): boolean {
  return !!attrs && new RegExp(`\\b${cls}\\b`).test(attrs);
}

export function renderFormattedLabel(raw: string | null | undefined): ReactNode {
  if (!raw) return raw ?? null;
  if (!/[<>]/.test(raw)) return raw;

  const toks = tokenize(raw);

  // Build a tree by walking the token list with a stack.
  interface Node { type: "element"; tag: string; attrs: string; children: (Node | string)[]; }
  const root: Node = { type: "element", tag: "__root__", attrs: "", children: [] };
  const stack: Node[] = [root];
  const top = () => stack[stack.length - 1];

  for (const tok of toks) {
    if (tok.kind === "text" && tok.text) top().children.push(tok.text);
    else if (tok.kind === "void") {
      if (tok.tag === "br") top().children.push({ type: "element", tag: "br", attrs: "", children: [] });
    }
    else if (tok.kind === "open") {
      const el: Node = { type: "element", tag: tok.tag!, attrs: tok.attrs || "", children: [] };
      top().children.push(el);
      stack.push(el);
    }
    else if (tok.kind === "close") {
      // Pop back to matching open tag; if unbalanced, keep what we have
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tok.tag) {
          stack.splice(i);
          break;
        }
      }
    }
  }

  let key = 0;
  const render = (nodes: (Node | string)[]): ReactNode => {
    const out: ReactNode[] = [];
    for (const n of nodes) {
      if (typeof n === "string") { out.push(n); continue; }
      const k = key++;
      switch (n.tag) {
        case "br":
          out.push(<br key={k} />);
          break;
        case "small":
          out.push(<small key={k} className="text-muted-foreground">{render(n.children)}</small>);
          break;
        case "span": {
          const cls = hasClass(n.attrs, "text-green-500") ? "text-emerald-600"
            : hasClass(n.attrs, "text-red-500") ? "text-red-600"
            : "";
          out.push(<span key={k} className={cls}>{render(n.children)}</span>);
          break;
        }
        case "i": {
          // FontAwesome icons mapped to Unicode; color comes from Tailwind class.
          const cls = hasClass(n.attrs, "text-green-500") || hasClass(n.attrs, "fa-check")
            ? "text-emerald-600"
            : hasClass(n.attrs, "text-red-500") || hasClass(n.attrs, "fa-xmark")
            ? "text-red-600"
            : "";
          const glyph = hasClass(n.attrs, "fa-check") ? "✓"
            : hasClass(n.attrs, "fa-xmark") ? "✗"
            : "•";
          out.push(<span key={k} className={`inline-block mx-0.5 ${cls}`} aria-hidden="true">{glyph}</span>);
          break;
        }
        case "ul":
          out.push(<ul key={k} className="list-disc list-inside mt-1 space-y-0.5">{render(n.children)}</ul>);
          break;
        case "li":
          out.push(<li key={k}>{render(n.children)}</li>);
          break;
        case "__root__":
        default:
          // Fallback: render children inline
          for (const c of render(n.children) as ReactNode[]) out.push(c);
      }
    }
    return out;
  };

  return <Fragment>{render(root.children)}</Fragment>;
}

/**
 * Strips the catalog's HTML tags without rendering them — returns a
 * plain-text version suitable for aria-label / alt / title attributes
 * where a ReactNode would just be coerced to "[object Object]".
 */
export function plainText(raw: string | null | undefined): string {
  if (!raw) return "";
  const withIcons = raw
    .replace(/<i\s+[^>]*fa-check[^>]*>\s*<\/i>/gi, "✓")
    .replace(/<i\s+[^>]*fa-xmark[^>]*>\s*<\/i>/gi, "✗")
    .replace(/<br\s*\/?>/gi, " ");
  return withIcons
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
