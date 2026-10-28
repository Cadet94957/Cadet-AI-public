export interface DocMetadata {
  department?: string;
  region?: string;
  docType?: string;
  effectiveDateISO?: string;
  complianceTags?: string[];
}

type Dict = Record<string, string>;

const DOC_TYPE_HINTS: Dict = { benefits: "benefits", "employee handbook": "handbook", policy: "policy", safety: "safety", onboarding: "onboarding" };
const DEPT_HINTS: Dict = { hr: "HR", "human resources": "HR", engineering: "Engineering", sales: "Sales", finance: "Finance", product: "Product", it: "IT" };
const REGION_HINTS: Dict = { usa: "US", us: "US", eu: "EU", europe: "EU", apac: "APAC" };

export function extractMetadata(title: string, body: string): DocMetadata {
  const text = `${title}\n${body}`.toLowerCase();
  const pick = (dict: Dict) => Object.keys(dict).find(k => text.includes(k)) ? dict[Object.keys(dict).find(k => text.includes(k)) as string] : undefined;
  const docType = pick(DOC_TYPE_HINTS);
  const department = pick(DEPT_HINTS);
  const region = pick(REGION_HINTS);
  const dateMatch = text.match(/\b(20\d{2})[-\/.](0?[1-9]|1[0-2])[-\/.](0?[1-9]|[12]\d|3[01])\b/);
  const effectiveDateISO = dateMatch ? new Date(dateMatch[0]).toISOString().slice(0, 10) : undefined;
  const complianceTags: string[] = [];
  if (text.includes("iso 3691-4")) complianceTags.push("ISO3691-4");
  if (text.includes("sox")) complianceTags.push("SOX");
  return { department, region, docType, effectiveDateISO, complianceTags: complianceTags.length ? complianceTags : undefined };
}
