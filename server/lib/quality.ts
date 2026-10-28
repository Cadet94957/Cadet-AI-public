import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export type QualityGrade = "clean" | "decent" | "garbage";

export interface QualityReport {
  grade: QualityGrade;
  textRatio: number;
  ocrArtifacts: number;
  formattingJank: number;
  notes?: string[];
}

export async function scoreDocument(buffer: Buffer, mime: string): Promise<QualityReport> {
  const notes: string[] = [];
  let text = "";
  try {
    if (mime.includes("pdf")) {
      const res = await pdfParse(buffer);
      text = (res.text || "").trim();
    } else {
      text = buffer.toString("utf8");
    }
  } catch {
    return { grade: "garbage", textRatio: 0, ocrArtifacts: 100, formattingJank: 100, notes: ["parse_failed"] };
  }

  const fileSize = buffer.length || 1;
  const textRatio = Math.min(text.length / fileSize, 5);
  const ocrArtifacts = (text.match(/�/g)?.length || 0) + (text.match(/[^ -~]/g)?.length || 0);
  const lines = text.split(/\r?\n/);
  const shortLines = lines.filter(l => l.trim().length > 0 && l.trim().length < 20).length;
  const formattingJank = Math.floor((shortLines / Math.max(lines.length, 1)) * 100);

  let grade: QualityGrade = "clean";
  if (textRatio < 0.05 || ocrArtifacts > 200 || formattingJank > 60) grade = "garbage";
  else if (textRatio < 0.15 || ocrArtifacts > 20 || formattingJank > 35) grade = "decent";

  if (grade !== "clean") notes.push("needs_cleanup");
  return { grade, textRatio, ocrArtifacts, formattingJank, notes };
}
