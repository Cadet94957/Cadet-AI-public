export interface DetectedTable { section?: string; csv: string[][]; summary: string; }

export function detectTables(text: string, section?: string): DetectedTable[] {
  const lines = text.split(/\r?\n/);
  const tables: DetectedTable[] = [];
  let current: string[][] = [];

  function flush() {
    if (current.length >= 2) {
      const headers = current[0]?.join(" | ") ?? "";
      tables.push({ section, csv: current, summary: `Table(${current.length - 1} rows): ${headers}`.slice(0, 200) });
    }
    current = [];
  }

  for (const line of lines) {
    const cells = line.split(/\t| {2,}/).map(c => c.trim()).filter(Boolean);
    if (cells.length >= 2 && cells.join("").length >= 4) current.push(cells);
    else flush();
  }
  flush();
  return tables;
}
