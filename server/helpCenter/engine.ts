import type {
  HelpCenterAskRequest,
  HelpCenterAskResponse,
  HelpCenterSuggestedAction,
} from "../../shared/schema";

/** Returned from retrieval */
export type RetrievedChunk = {
  docId: string;
  title: string;
  snippet: string;
  url?: string | null;
  score?: number | null;
};

export interface RetrievalAdapter {
  retrieve(orgId: string, userEmail: string, query: string): Promise<RetrievedChunk[]>;
}

export interface LlmAdapter {
  complete(input: {
    orgId: string;
    userEmail: string;
    actionMode: "auto" | "approval";
    includePlan: boolean;

    system: string;
    user: string;
    contextChunks: RetrievedChunk[];
  }): Promise<{
    answer: string;
    plan?: string | null;
    suggestedActions: HelpCenterSuggestedAction[];
    needsEscalation: boolean;
  }>;
}

function buildSystemPrompt() {
  // IMPORTANT: plan is a *safe* summary only — not chain-of-thought.
  return `You are Cadet Help Center, an internal assistant for employees and managers.

Goals:
- Answer questions using the provided context first (RAG).
- Cite sources implicitly by grounding in context; the app will show citations separately.
- Be concise and procedural: give steps, links, owners, and next actions.

Tool / action policy:
- You can propose or execute actions using tools (create_task, open_link, file_ticket, assign_buddy, schedule_checkin).
- If actionMode is "approval": propose actions but do not assume they executed.
- If actionMode is "auto": execute actions when clearly requested/appropriate.

Planning transparency:
- Provide a short "plan" string (max ~5 bullets) describing your approach at a high level.
- Do NOT reveal private chain-of-thought; keep it as a user-friendly summary.

Output requirements:
- You will ultimately return JSON with keys:
  - answer: string
  - plan: string | null
  - needsEscalation: boolean
(Any actions are handled via tools and will be surfaced by the app.)`;
}

/**
 * Generate an answer, citations and actions for a help center question.
 */
export async function answerHelpCenterQuestion(
  req: HelpCenterAskRequest,
  deps: { retrieval: RetrievalAdapter; llm: LlmAdapter },
): Promise<HelpCenterAskResponse> {
  const includePlan = Boolean(req.debug?.includePlan);
  const actionMode = req.actionMode ?? "approval";

  const chunks = await deps.retrieval.retrieve(req.orgId, req.userEmail, req.question);

  // Tell the model where the user is in the app so answers can reference the
  // current onboarding step or screen.
  const userContent = req.page
    ? `${req.question}\n\n(The user is currently on: ${req.page})`
    : req.question;

  const llmOut = await deps.llm.complete({
    orgId: req.orgId,
    userEmail: req.userEmail,
    actionMode,
    includePlan,
    system: buildSystemPrompt(),
    user: userContent,
    contextChunks: chunks,
  });

  return {
    answer: llmOut.answer,
    plan: includePlan ? llmOut.plan ?? null : null,
    citations: chunks.slice(0, 6),
    suggestedActions: llmOut.suggestedActions ?? [],
    needsEscalation: llmOut.needsEscalation ?? false,
  };
}
