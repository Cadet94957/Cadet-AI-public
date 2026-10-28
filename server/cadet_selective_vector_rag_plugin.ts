// server/cadet_selective_vector_rag_plugin.ts

import express from "express";
import { storage } from "./storage";
import { retrieveContext } from "./lib/retrieval";
import { callLLM } from "./lib/openai";

/** -------------------------
 * Types
 * ------------------------*/

type ToolPlan = {
  useOrgGraph: boolean;
  useOnboardingConfig: boolean;
  useVectorSearch: boolean;
};

type SemanticSearchHit = {
  documentId: number;
  source: "admin-upload" | "system";
  score: number;
  chunkText: string;
  metadata?: Record<string, any>;
};

type SemanticSearchDocumentsResponse = { hits: SemanticSearchHit[] };

type OrgGraphContextResponse = {
  entities: any[];
  relationships: any[];
  notes?: string;
};

type OnboardingConfigContextResponse = {
  modules?: Record<string, boolean>;
  missionStatement?: string;
  benefitsDocumentId?: number | null;
  documents?: any[];
  notes?: string;
};

/** -------------------------
 * Tools
 * ------------------------*/

async function getOrgGraphContext(_userEmail: string, _question: string): Promise<OrgGraphContextResponse> {
  // TODO: query your org_entities/org_relationships store when implemented
  return { entities: [], relationships: [], notes: "Org graph tool not implemented yet." };
}

async function getOnboardingConfigContext(userEmail: string, _question: string): Promise<OnboardingConfigContextResponse> {
  try {
    const user = await storage.getUserByUsername(userEmail);
    if (!user) {
      return { notes: "User not found." };
    }
    
    if (!user.adminOnboardingData) {
      return { notes: "No admin onboarding data found." };
    }
    
    const data = user.adminOnboardingData as any;
    return {
      modules: data.modules,
      missionStatement: data.missionStatement,
      benefitsDocumentId: data.benefitsDocumentId,
      documents: data.documents,
    };
  } catch (error) {
    console.error("Error getting onboarding config context:", error);
    return { notes: "Error loading onboarding config." };
  }
}

async function semanticSearchDocuments(userEmail: string, question: string, topK = 8): Promise<SemanticSearchDocumentsResponse> {
  try {
    const user = await storage.getUserByUsername(userEmail);
    const { contexts, usedDocuments } = await retrieveContext(question, {
      userRole: user?.role,
      department: user?.department,
      limit: topK,
    });
    
    if (contexts.length === 0) {
      return { hits: [] };
    }
    
    const hits: SemanticSearchHit[] = contexts.map((chunk, idx) => {
      const doc = usedDocuments.find(d => d.id === chunk.documentId);
      return {
        documentId: chunk.documentId,
        source: "admin-upload" as const,
        score: 1 - (idx * 0.05),
        chunkText: chunk.text,
        metadata: {
          section: chunk.section,
          level: chunk.level,
          docTitle: doc?.title,
          category: doc?.category,
        },
      };
    });
    
    return { hits };
  } catch (error) {
    console.error("Error in semantic search:", error);
    return { hits: [] };
  }
}

/** -------------------------
 * Planner (Selective-Vector)
 * ------------------------*/
async function planToolsForQuestion(question: string): Promise<ToolPlan> {
  const prompt = `
You are a tool-selection agent for an onboarding assistant.

You have 3 tools:
1) ORG_GRAPH: Structured data about departments, teams, roles, and processes.
2) ONBOARDING_CONFIG: Settings for onboarding modules, mission, benefits docs.
3) VECTOR_SEARCH: Semantic search over uploaded documents (handbook, SOPs, etc.).

Rules:
- Prefer ORG_GRAPH + ONBOARDING_CONFIG whenever possible.
- Only use VECTOR_SEARCH when the user needs detailed textual evidence from docs
  (exact policy language, step-by-step SOP, specific SLA terms).

Return JSON ONLY:
{"useOrgGraph": boolean, "useOnboardingConfig": boolean, "useVectorSearch": boolean}

Question:
"${question}"
`;

  try {
    const raw = await callLLM(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const plan = JSON.parse(jsonMatch[0]);
      return {
        useOrgGraph: !!plan.useOrgGraph,
        useOnboardingConfig: !!plan.useOnboardingConfig,
        useVectorSearch: !!plan.useVectorSearch,
      };
    }
  } catch (error) {
    console.error("Error planning tools:", error);
  }
  
  return { useOrgGraph: true, useOnboardingConfig: true, useVectorSearch: false };
}

/** -------------------------
 * Synthesizer
 * ------------------------*/
async function synthesizeAnswer(opts: {
  question: string;
  role?: string;
  orgGraphCtx: OrgGraphContextResponse | null;
  onboardingCtx: OnboardingConfigContextResponse | null;
  vectorCtx: SemanticSearchDocumentsResponse | null;
}): Promise<string> {
  const { question, role, orgGraphCtx, onboardingCtx, vectorCtx } = opts;

  const orgGraphSummary = orgGraphCtx ? JSON.stringify(orgGraphCtx).slice(0, 4000) : "NONE";
  const onboardingSummary = onboardingCtx ? JSON.stringify(onboardingCtx).slice(0, 4000) : "NONE";

  const vectorSummary = vectorCtx && vectorCtx.hits.length > 0
    ? vectorCtx.hits
        .map((h, i) => `HIT ${i + 1} (score=${h.score} doc=${h.documentId} title=${h.metadata?.docTitle ?? "?"}):\n${h.chunkText.slice(0, 800)}`)
        .join("\n\n")
    : "NONE";

  const audience = role === "manager"
    ? `You are helping a MANAGER guide new employees through onboarding. Focus on management best practices, team integration, setting expectations, and supportive onboarding.`
    : `You are helping a NEW EMPLOYEE navigate their first days at the company. Be encouraging, welcoming, and practical.`;

  const prompt = `
You are Cadet, an onboarding assistant. ${audience}

User question:
"${question}"

ORG_GRAPH CONTEXT:
${orgGraphSummary}

ONBOARDING CONFIG CONTEXT:
${onboardingSummary}

DOCUMENT SNIPPETS (from VECTOR SEARCH):
${vectorSummary}

Instructions:
- Prefer ORG_GRAPH / ONBOARDING_CONFIG for structural questions (ownership, reporting, responsibilities).
- Only rely on DOCUMENT SNIPPETS when needed for exact policy/process detail.
- If all contexts are NONE or unhelpful, say so honestly and suggest asking a manager/HR or checking the document repository. Do not invent company-specific facts.
- If you are unsure, say what you know and what to confirm.

Answer concisely and helpfully.
`;

  const raw = await callLLM(prompt);
  return raw.trim();
}

/** -------------------------
 * Main Agent
 * ------------------------*/
async function answerOnboardingQuestion(userEmail: string | undefined, question: string, role?: string) {
  const plan = await planToolsForQuestion(question);

  const orgGraphCtx = plan.useOrgGraph ? await getOrgGraphContext(userEmail ?? "", question) : null;
  const onboardingCtx = plan.useOnboardingConfig && userEmail
    ? await getOnboardingConfigContext(userEmail, question)
    : null;
  let vectorCtx = plan.useVectorSearch ? await semanticSearchDocuments(userEmail ?? "", question, 8) : null;

  // Fallback: if the structured tools produced nothing usable, always try the
  // document index so the employee still gets a grounded answer.
  const structuredEmpty =
    (!orgGraphCtx || orgGraphCtx.entities.length === 0) &&
    (!onboardingCtx || (!onboardingCtx.modules && !onboardingCtx.missionStatement && !onboardingCtx.documents));
  if (!vectorCtx && structuredEmpty) {
    vectorCtx = await semanticSearchDocuments(userEmail ?? "", question, 8);
  }

  const answer = await synthesizeAnswer({ question, role, orgGraphCtx, onboardingCtx, vectorCtx });

  const citations = (vectorCtx?.hits ?? []).slice(0, 6).map(h => ({
    docId: h.documentId,
    title: h.metadata?.docTitle ?? `Document #${h.documentId}`,
    section: h.metadata?.section ?? null,
    snippet: h.chunkText.length > 240 ? h.chunkText.slice(0, 240) + "…" : h.chunkText,
  }));

  return {
    answer,
    citations,
    meta: {
      usedOrgGraph: !!orgGraphCtx,
      usedOnboardingConfig: !!onboardingCtx,
      usedVectorSearch: !!vectorCtx,
      plan,
    },
  };
}

/** -------------------------
 * Router export (mount this)
 * ------------------------*/
export function createCadetSelectiveVectorRagRouter() {
  const router = express.Router();

  // Unified onboarding chat endpoint. Accepts both the legacy shape
  // ({ message, role }) and the agent shape ({ question, userEmail }).
  router.post("/onboarding-chat", async (req, res) => {
    try {
      const userEmail = (req as any).user?.email || req.body.userEmail;
      const question = req.body.question || req.body.message;
      const role = req.body.role;

      if (!question || typeof question !== "string" || !question.trim()) {
        return res.status(400).json({ error: "message (or question) is required" });
      }

      const result = await answerOnboardingQuestion(userEmail, question.trim(), role);
      // `response` mirrors `answer` for older frontend consumers.
      return res.json({ response: result.answer, ...result });
    } catch (err: any) {
      console.error("Selective-Vector RAG error:", err);
      return res.status(500).json({ error: err?.message || "Failed to answer question" });
    }
  });

  return router;
}
