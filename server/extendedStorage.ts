import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ExtendedStorage is the interface used by all routers.
 * In single-tenant Supabase mode, a new storage instance is created PER REQUEST
 * with that tenant's Supabase client.
 */

export type ExtendedStorage = {
  tasks: {
    create(input: {
      orgId: string;
      title: string;
      description?: string | null;
      assignedToEmail: string;
      createdByEmail: string;
      dueAt?: string | null;
      source?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    }): Promise<any>;
    listByAssignee(orgId: string, email: string): Promise<any[]>;
  };

  tickets: {
    create(input: {
      orgId: string;
      createdByEmail: string;
      title: string;
      description: string;
      status: "open" | "closed";
      metadata?: Record<string, any>;
    }): Promise<any>;
  };

  buddies: {
    assign(input: {
      orgId: string;
      employeeEmail: string;
      buddyEmail: string;
      assignedByEmail: string;
    }): Promise<any>;
  };

  orgMembers: {
    upsertMany(orgId: string, rows: Array<any>): Promise<{ upserted: number }>;
    list(orgId: string): Promise<any[]>;
  };

  feedback: {
    create(input: {
      orgId: string;
      userEmail: string;
      type: string;
      rating?: number | null;
      freeText?: string | null;
      metadata?: Record<string, any>;
    }): Promise<any>;
    list(orgId: string): Promise<any[]>;
  };

  helpCenterEvents: {
    log(input: {
      orgId: string;
      userEmail: string;
      eventType: string;
      payload?: Record<string, any>;
    }): Promise<any>;
  };

  links?: {
    resolve?(orgId: string, key: string): Promise<{ url: string; label?: string } | null>;
  };
};

function nowIso() {
  return new Date().toISOString();
}

/**
 * Create an ExtendedStorage instance bound to a tenant's Supabase project.
 * All table names below should exist in EACH tenant project.
 */
export function createExtendedStorage(opts: { supabase: SupabaseClient }): ExtendedStorage {
  const supabase = opts.supabase;

  return {
    tasks: {
      async create(input) {
        const row = {
          id: randomUUID(),
          org_id: input.orgId,
          title: input.title,
          description: input.description ?? null,
          status: "todo",
          assigned_to_email: input.assignedToEmail,
          created_by_email: input.createdByEmail,
          due_at: input.dueAt ?? null,
          source: input.source ?? "help_center",
          tags: input.tags ?? [],
          metadata: input.metadata ?? {},
          created_at: nowIso(),
          updated_at: nowIso(),
        };

        const { data, error } = await supabase.from("tasks").insert(row).select("*").single();
        if (error) throw new Error(`Supabase tasks.create failed: ${error.message}`);
        return data;
      },

      async listByAssignee(orgId, email) {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("org_id", orgId)
          .eq("assigned_to_email", email)
          .order("created_at", { ascending: false });

        if (error) throw new Error(`Supabase tasks.listByAssignee failed: ${error.message}`);
        return data ?? [];
      },
    },

    tickets: {
      async create(input) {
        const row = {
          id: randomUUID(),
          org_id: input.orgId,
          created_by_email: input.createdByEmail,
          title: input.title,
          description: input.description,
          status: input.status,
          metadata: input.metadata ?? {},
          created_at: nowIso(),
        };
        const { data, error } = await supabase.from("tickets").insert(row).select("*").single();
        if (error) throw new Error(`Supabase tickets.create failed: ${error.message}`);
        return data;
      },
    },

    buddies: {
      async assign(input) {
        const row = {
          id: randomUUID(),
          org_id: input.orgId,
          employee_email: input.employeeEmail,
          buddy_email: input.buddyEmail,
          assigned_by_email: input.assignedByEmail,
          created_at: nowIso(),
        };
        const { data, error } = await supabase.from("buddy_assignments").insert(row).select("*").single();
        if (error) throw new Error(`Supabase buddies.assign failed: ${error.message}`);
        return data;
      },
    },

    orgMembers: {
      async upsertMany(orgId, rows) {
        const payload = rows.map((r: any) => ({
          org_id: orgId,
          email: r.email,
          display_name: r.displayName,
          role: r.role,
          department: r.department ?? null,
          title: r.title ?? null,
          manager_email: r.managerEmail ?? null,
          start_date: r.startDate ?? null,
          updated_at: nowIso(),
        }));

        const { error } = await supabase.from("org_members").upsert(payload, { onConflict: "org_id,email" });
        if (error) throw new Error(`Supabase orgMembers.upsertMany failed: ${error.message}`);
        return { upserted: payload.length };
      },

      async list(orgId) {
        const { data, error } = await supabase.from("org_members").select("*").eq("org_id", orgId);
        if (error) throw new Error(`Supabase orgMembers.list failed: ${error.message}`);
        return data ?? [];
      },
    },

    feedback: {
      async create(input) {
        const row = {
          id: randomUUID(),
          org_id: input.orgId,
          user_email: input.userEmail,
          type: input.type,
          rating: input.rating ?? null,
          free_text: input.freeText ?? null,
          metadata: input.metadata ?? {},
          created_at: nowIso(),
        };
        const { data, error } = await supabase.from("feedback_responses").insert(row).select("*").single();
        if (error) throw new Error(`Supabase feedback.create failed: ${error.message}`);
        return data;
      },

      async list(orgId) {
        const { data, error } = await supabase
          .from("feedback_responses")
          .select("*")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false });

        if (error) throw new Error(`Supabase feedback.list failed: ${error.message}`);
        return data ?? [];
      },
    },

    helpCenterEvents: {
      async log(input) {
        const row = {
          id: randomUUID(),
          org_id: input.orgId,
          user_email: input.userEmail,
          event_type: input.eventType,
          payload: input.payload ?? {},
          created_at: nowIso(),
        };
        const { data, error } = await supabase.from("help_center_events").insert(row).select("*").single();
        if (error) throw new Error(`Supabase helpCenterEvents.log failed: ${error.message}`);
        return data;
      },
    },

    links: {
      async resolve(_orgId: string, key: string) {
        const defaults: Record<string, string> = {
          expenses: "https://example.com/expenses",
          benefits: "https://example.com/benefits",
        };
        return defaults[key] ? { url: defaults[key], label: key } : null;
      },
    },
  };
}
