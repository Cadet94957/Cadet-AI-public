import {
  HelpCenterActionRequestSchema,
  type HelpCenterActionRequest,
} from "../../shared/schema";

/**
 * Storage interface for executing help center actions.
 * Methods must be implemented by the extended storage layer.
 */
export interface HelpCenterActionStorage {
  tasks: {
    create(task: any): Promise<any>;
  };
  tickets: {
    create(t: {
      orgId: string;
      createdByEmail: string;
      title: string;
      description: string;
      status: "open" | "closed";
      metadata?: Record<string, any>;
    }): Promise<any>;
  };
  buddies: {
    assign(a: {
      orgId: string;
      employeeEmail: string;
      buddyEmail: string;
      assignedByEmail: string;
    }): Promise<any>;
  };
  links?: {
    resolve?(orgId: string, key: string): Promise<{ url: string; label?: string } | null>;
  };
}

/**
 * Executes one approved action. Keep it deterministic and auditable.
 */
export async function executeHelpCenterAction(
  storage: HelpCenterActionStorage,
  rawReq: HelpCenterActionRequest,
): Promise<any> {
  const req = HelpCenterActionRequestSchema.parse(rawReq);

  switch (req.actionType) {
    case "create_task": {
      const task = {
        orgId: req.orgId,
        title: String(req.actionPayload?.title ?? "Task"),
        description: req.actionPayload?.description ?? null,
        assignedToEmail: String(req.actionPayload?.assignedToEmail ?? req.userEmail),
        createdByEmail: req.userEmail,
        dueAt: req.actionPayload?.dueAt ?? null,
        source: "help_center",
        metadata: req.actionPayload?.metadata ?? {},
      };
      const created = await storage.tasks.create(task);
      return { ok: true, kind: "task_created", task: created };
    }

    case "open_link": {
      const urlFromPayload = req.actionPayload?.url ? String(req.actionPayload.url) : null;

      if (urlFromPayload) return { ok: true, kind: "link", url: urlFromPayload };

      const key = req.actionPayload?.key ? String(req.actionPayload.key) : null;
      if (!key || !storage.links?.resolve) {
        return { ok: false, error: "Missing url/key or link resolver not configured." };
      }
      const resolved = await storage.links.resolve(req.orgId, key);
      if (!resolved) return { ok: false, error: `No link found for key: ${key}` };

      return { ok: true, kind: "link", url: resolved.url, label: resolved.label ?? null };
    }

    case "file_ticket": {
      const ticket = {
        orgId: req.orgId,
        createdByEmail: req.userEmail,
        title: String(req.actionPayload?.title ?? "Help Center request"),
        description: String(req.actionPayload?.description ?? ""),
        status: "open" as const,
        metadata: {
          source: "help_center",
          ...(req.actionPayload?.metadata ?? {}),
        },
      };
      const created = await storage.tickets.create(ticket);
      return { ok: true, kind: "ticket_created", ticket: created };
    }

    case "assign_buddy": {
      const employeeEmail = String(req.actionPayload?.employeeEmail ?? req.userEmail);
      const buddyEmail = String(req.actionPayload?.buddyEmail ?? "");
      if (!buddyEmail) return { ok: false, error: "buddyEmail is required." };

      const created = await storage.buddies.assign({
        orgId: req.orgId,
        employeeEmail,
        buddyEmail,
        assignedByEmail: req.userEmail,
      });
      return { ok: true, kind: "buddy_assigned", assignment: created };
    }

    case "schedule_checkin": {
      const employeeEmail = String(req.actionPayload?.employeeEmail ?? req.userEmail);
      const title = `Schedule check-in with ${employeeEmail}`;
      const task = {
        orgId: req.orgId,
        title,
        description: req.actionPayload?.description ?? null,
        assignedToEmail: String(req.actionPayload?.assignedToEmail ?? req.userEmail),
        createdByEmail: req.userEmail,
        dueAt: req.actionPayload?.dueAt ?? null,
        source: "help_center",
        tags: ["checkin"],
      };
      const created = await storage.tasks.create(task);
      return { ok: true, kind: "checkin_task_created", task: created };
    }

    default:
      return { ok: false, error: "Unknown actionType" };
  }
}
