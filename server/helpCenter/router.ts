import express from "express";
import {
  HelpCenterAskRequestSchema,
  HelpCenterActionRequestSchema,
} from "../../shared/schema";
import { answerHelpCenterQuestion, type RetrievalAdapter, type LlmAdapter } from "./engine";
import { executeHelpCenterAction } from "./actions";

export function createHelpCenterRouter(deps: {
  retrieval: RetrievalAdapter;
  llm: LlmAdapter;
}) {
  const router = express.Router();

  router.post("/help-center/ask", async (req, res) => {
    try {
      if (!req.cadet?.storage) return res.status(400).json({ error: "Tenant not resolved (missing orgId)" });

      const parsed = HelpCenterAskRequestSchema.parse(req.body);

      // Optional event logging
      await req.cadet.storage.helpCenterEvents.log({
        orgId: parsed.orgId,
        userEmail: parsed.userEmail,
        eventType: "question_asked",
        payload: { page: parsed.page ?? null },
      });

      const out = await answerHelpCenterQuestion(parsed, {
        retrieval: deps.retrieval,
        llm: deps.llm,
      });

      await req.cadet.storage.helpCenterEvents.log({
        orgId: parsed.orgId,
        userEmail: parsed.userEmail,
        eventType: "answer_shown",
        payload: { suggestedActions: out.suggestedActions?.length ?? 0 },
      });

      res.json(out);
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Bad request" });
    }
  });

  router.post("/help-center/action", async (req, res) => {
    try {
      if (!req.cadet?.storage) return res.status(400).json({ error: "Tenant not resolved (missing orgId)" });

      const parsed = HelpCenterActionRequestSchema.parse(req.body);

      const out = await executeHelpCenterAction(req.cadet.storage as any, parsed);

      await req.cadet.storage.helpCenterEvents.log({
        orgId: parsed.orgId,
        userEmail: parsed.userEmail,
        eventType: "action_executed",
        payload: { actionType: parsed.actionType, ok: Boolean(out?.ok) },
      });

      res.json(out);
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Bad request" });
    }
  });

  return router;
}
