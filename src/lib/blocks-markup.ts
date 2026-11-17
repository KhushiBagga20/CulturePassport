import type { TextBlock } from "./types";

/**
 * A small, editor-friendly markup for narrative chapters.
 *
 *   A paragraph ends with claim references in double brackets. [[kol-gi-area, kol-gi-dates]]
 *
 *   > Note: On names and ownership | The note's text. [[kol-gi-dates]]
 *
 *   " A pull quote. — Attribution
 *
 *   ![media-id]
 *
 * Blocks are separated by blank lines.
 */
export function blocksToMarkup(blocks: TextBlock[]): string {
  return blocks
    .map((b) => {
      const refs = (ids?: string[]) => (ids?.length ? ` [[${ids.join(", ")}]]` : "");
      switch (b.type) {
        case "p":
          return `${b.text}${refs(b.claims)}`;
        case "note":
          return `> Note: ${b.title} | ${b.text}${refs(b.claims)}`;
        case "pull":
          return `" ${b.text}${b.attribution ? ` — ${b.attribution}` : ""}`;
        case "figure":
          return `![${b.media}]`;
      }
    })
    .join("\n\n");
}

export function markupToBlocks(src: string): TextBlock[] {
  return src
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): TextBlock => {
      const fig = chunk.match(/^!\[([\w-]+)\]$/);
      if (fig) return { type: "figure", media: fig[1] };
      const refMatch = chunk.match(/\s*\[\[([^\]]*)\]\]\s*$/);
      const claims = refMatch
        ? refMatch[1]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
      const body = refMatch ? chunk.slice(0, refMatch.index).trim() : chunk;
      if (body.startsWith("> Note:")) {
        const [title, ...rest] = body.slice(7).split("|");
        return { type: "note", title: title.trim(), text: rest.join("|").trim().replace(/\s+/g, " "), ...(claims ? { claims } : {}) };
      }
      if (body.startsWith('"')) {
        const [text, attribution] = body.slice(1).split(/\s+—\s+/);
        return { type: "pull", text: text.trim(), ...(attribution ? { attribution: attribution.trim() } : {}) };
      }
      return { type: "p", text: body.replace(/\s+/g, " "), ...(claims ? { claims } : {}) };
    });
}
