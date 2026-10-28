import express from "express";

export function createManagerRouter() {
  const router = express.Router();

  router.get("/manager/:orgId/metrics", async (req, res) => {
    if (!req.cadet?.storage) return res.status(400).json({ error: "Tenant not resolved (missing orgId)" });

    const orgId = String(req.params.orgId);
    const managerEmail = String(req.query.managerEmail ?? "");
    if (!managerEmail) return res.status(400).json({ error: "managerEmail required" });

    const tasks = await req.cadet.storage.tasks.listByAssignee(orgId, managerEmail);
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === "done").length;
    const overdue = tasks.filter((t: any) => t.due_at && new Date(t.due_at).getTime() < Date.now() && t.status !== "done").length;

    res.json({
      ok: true,
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: overdue,
      completionRate: total ? completed / total : 0,
    });
  });

  router.post("/manager/:orgId/buddy", async (req, res) => {
    if (!req.cadet?.storage) return res.status(400).json({ error: "Tenant not resolved (missing orgId)" });

    const orgId = String(req.params.orgId);
    const { employeeEmail, buddyEmail, assignedByEmail } = req.body ?? {};
    if (!employeeEmail || !buddyEmail || !assignedByEmail) {
      return res.status(400).json({ error: "employeeEmail, buddyEmail, assignedByEmail required" });
    }

    const assignment = await req.cadet.storage.buddies.assign({
      orgId,
      employeeEmail,
      buddyEmail,
      assignedByEmail,
    });

    res.json({ ok: true, assignment });
  });

  return router;
}
