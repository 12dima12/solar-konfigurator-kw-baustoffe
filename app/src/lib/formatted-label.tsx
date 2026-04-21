import { Fragment, type ReactNode } from "react";

/**
 * Renders a label string that may contain <small> and <br> inline markup
 * from the catalog. Safer than dangerouslySetInnerHTML: unknown tags and
 * their attributes are escaped as plain text, only the whitelisted tags
 * are turned into React elements.
 *
 * The catalog is a statically-bundled asset so the XSS surface is zero,
 * but keeping the renderer restrictive avoids surprises if a future
 * data-source injects content.
 */
const TAG_RE = /<\s*(\/?)(small|br)\b[^>]*>/gi;

export function renderFormattedLabel(raw: string): ReactNode {
  if (!raw) return raw;
  if (!/[<>]/.test(raw)) return raw;

  const nodes: ReactNode[] = [];
  const stack: { tag: "small"; children: ReactNode[] }[] = [];
  let cursor = 0;
  let key = 0;

  const push = (node: ReactNode) => {
    if (stack.length > 0) stack[stack.length - 1].children.push(node);
    else nodes.push(node);
  };

  let m: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(raw)) !== null) {
    if (m.index > cursor) push(raw.slice(cursor, m.index));
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();

    if (tag === "br" && !closing) {
      push(<br key={`br-${key++}`} />);
    } else if (tag === "small") {
      if (closing) {
        const top = stack.pop();
        if (top) {
          push(
            <small key={`s-${key++}`} className="text-muted-foreground">
              {top.children}
            </small>,
          );
        }
      } else {
        stack.push({ tag: "small", children: [] });
      }
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < raw.length) push(raw.slice(cursor));

  // Unclosed <small>: flatten remaining stack as plain text to avoid losing content.
  while (stack.length > 0) {
    const top = stack.pop()!;
    nodes.push(...top.children);
  }

  return <Fragment>{nodes}</Fragment>;
}
