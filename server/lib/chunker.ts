export type ChunkLevel = "document" | "section" | "paragraph" | "sentence";
export interface Chunk { level: ChunkLevel; order: number; text: string; section?: string; }

const SECTION_RE = /^(#+|\d+\.\s+|[A-Z][A-Z0-9 ]{3,})\s*$/;
const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z0-9])/;

export function hierarchicalChunk(text: string): Chunk[] {
  const lines = text.split(/\r?\n/);
  const chunks: Chunk[] = [];
  let currentSection = "Intro";
  let paraBuf: string[] = [];
  let order = 0;

  function flushParagraph() {
    const p = paraBuf.join(" ").trim();
    if (!p) return;
    chunks.push({ level: "paragraph", order: order++, text: p, section: currentSection });
    p.split(SENTENCE_SPLIT).forEach(s => {
      const st = s.trim();
      if (st) chunks.push({ level: "sentence", order: order++, text: st, section: currentSection });
    });
    paraBuf = [];
  }

  chunks.push({ level: "document", order: order++, text: text.slice(0, 1200) });
  lines.forEach(line => {
    const t = line.trim();
    if (SECTION_RE.test(t) && t.length < 140) {
      flushParagraph();
      currentSection = t.replace(/^#+\s*/, "");
      chunks.push({ level: "section", order: order++, text: currentSection, section: currentSection });
    } else if (t.length === 0) {
      flushParagraph();
    } else {
      paraBuf.push(t);
    }
  });
  flushParagraph();
  return chunks;
}
