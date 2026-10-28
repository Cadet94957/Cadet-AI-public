import { hierarchicalChunk, Chunk } from "./chunker";
import { embed, cosine } from "./embeddings";
import { extractMetadata, DocMetadata } from "./metadata";
import { detectTables } from "./tables";
import { storage } from "../storage";
import type { Document } from "@shared/schema";

export interface StoredChunk {
  id?: number;
  documentId: number;
  level: "document" | "section" | "paragraph" | "sentence";
  order: number;
  text: string;
  section?: string;
  embedding?: number[];
  department?: string;
  region?: string;
  docType?: string;
  effectiveDateISO?: string;
  complianceTags?: string[];
}

export interface RetrieveOptions {
  userRole?: string;
  department?: string;
  region?: string;
  precision?: boolean;
  limit?: number;
}

const PRECISION_KEYWORDS = /\b(exact|specific|table|row|cell|figure|dosage|number|value)\b/i;
export const inferPrecisionFromQuery = (q: string) => PRECISION_KEYWORDS.test(q);

export async function ingestDocument(doc: Document, rawText: string) {
  const chunks: Chunk[] = hierarchicalChunk(rawText);
  const meta: DocMetadata = extractMetadata(doc.title, rawText);
  const stored: StoredChunk[] = chunks.map(c => ({ documentId: doc.id!, ...c, ...meta }));

  const toEmbedIdx: number[] = [];
  const embedInputs: string[] = [];
  stored.forEach((c, i) => { if (c.level === "paragraph" || c.level === "sentence") { toEmbedIdx.push(i); embedInputs.push(c.text); }});
  const vectors = await embed(embedInputs);
  toEmbedIdx.forEach((i, j) => (stored[i].embedding = vectors[j]));
  await storage.bulkUpsertChunks(stored);
  const tables = detectTables(rawText);
  if (tables.length) await storage.bulkUpsertTables(tables.map(t => ({ documentId: doc.id!, ...t })));
  await storage.updateDocument(doc.id!, { metadata: meta as any });
  return { chunks: stored, tables };
}

// Chunks scoring below this cosine similarity are treated as irrelevant so the
// assistant can honestly say it doesn't know instead of answering from noise.
const MIN_RELEVANCE_SCORE = 0.15;

export interface ScoredChunk extends StoredChunk {
  id?: number;
  score: number;
}

export async function retrieveContext(query: string, options: RetrieveOptions = {}) {
  const { userRole, department, region, precision = inferPrecisionFromQuery(query), limit = 12 } = options;
  const allChunks = await storage.listChunks();
  // Chunks without department/region metadata are company-wide: never exclude
  // them, only exclude chunks explicitly tagged for a *different* audience.
  const candidates = allChunks.filter(c =>
    (!department || !c.department || c.department === department) &&
    (!region || !c.region || c.region === region)
  );

  if (candidates.length === 0) {
    return { contexts: [] as ScoredChunk[], usedDocuments: [] as Document[] };
  }

  const kw = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const kwHit = candidates.filter(c => kw.some(k => c.text.toLowerCase().includes(k)));
  const pool = kwHit.length >= 50 ? kwHit : candidates;
  const qVec = (await embed([query]))[0];

  const scored: ScoredChunk[] = pool
    .filter(c => c.embedding && (precision ? (c.level === "sentence" || c.level === "paragraph") : true))
    .map(c => ({ ...(c as StoredChunk), embedding: c.embedding as any, score: cosine(qVec, (c.embedding as any) as number[]) }))
    .filter(c => c.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const docIds = Array.from(new Set(scored.map(s => s.documentId)));
  const usedDocuments = await storage.getDocumentsByIds(docIds);
  return { contexts: scored, usedDocuments };
}
