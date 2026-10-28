import express from "express";
import { CsvOrgImportRowSchema } from "../../shared/schema";

export function createAdminRouter() {
  const router = express.Router();

  router.post("/admin/templates/seed", async (req, res) => {
    if (!req.cadet?.storage) return res.status(400).json({ error: "Tenant not resolved (missing orgId)" });
    res.json({ ok: true });
  });

  router.post("/admin/org/import-csv", async (req, res) => {
    if (!req.cadet?.storage) return res.status(400).json({ error: "Tenant not resolved (missing orgId)" });

    const orgId = String(req.body?.orgId ?? "");
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const parsedRows = rows.map((r: any) => CsvOrgImportRowSchema.parse(r));

    const result = await req.cadet.storage.orgMembers.upsertMany(orgId, parsedRows);
    res.json({ ok: true, ...result });
  });

  router.get("/admin/org/:orgId/members", async (req, res) => {
    if (!req.cadet?.storage) return res.status(400).json({ error: "Tenant not resolved (missing orgId)" });

    const orgId = String(req.params.orgId);
    const members = await req.cadet.storage.orgMembers.list(orgId);
    res.json({ ok: true, members });
  });

  router.post("/admin/feedback", async (req, res) => {
    if (!req.cadet?.storage) return res.status(400).json({ error: "Tenant not resolved (missing orgId)" });

    const { orgId, userEmail, type, rating, freeText, metadata } = req.body ?? {};
    const created = await req.cadet.storage.feedback.create({
      orgId,
      userEmail,
      type,
      rating: rating ?? null,
      freeText: freeText ?? null,
      metadata: metadata ?? {},
    });
    res.json({ ok: true, feedback: created });
  });

  router.get("/admin/feedback/:orgId", async (req, res) => {
    if (!req.cadet?.storage) return res.status(400).json({ error: "Tenant not resolved (missing orgId)" });

    const orgId = String(req.params.orgId);
    const feedback = await req.cadet.storage.feedback.list(orgId);
    res.json({ ok: true, feedback });
  });

  return router;
}
