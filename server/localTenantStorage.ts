import { db } from "./db";
import { tasks, tickets, buddyAssignments, helpCenterEvents, users } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";
import type { ExtendedStorage } from "./extendedStorage";

/**
 * ExtendedStorage implementation backed by the local Postgres database.
 * Used as the default (single-tenant) storage so the Help Center agent,
 * its actions (tasks, tickets, buddies) and analytics work out of the box
 * without a per-tenant Supabase project.
 */
export function createLocalTenantStorage(): ExtendedStorage {
  return {
    tasks: {
      async create(input) {
        const [row] = await db
          .insert(tasks)
          .values({
            orgId: input.orgId,
            title: input.title,
            description: input.description ?? null,
            assignedToEmail: input.assignedToEmail,
            createdByEmail: input.createdByEmail,
            dueAt: input.dueAt ? new Date(input.dueAt) : null,
            source: input.source ?? "help_center",
            tags: input.tags ?? [],
            metadata: input.metadata ?? {},
          })
          .returning();
        return row;
      },

      async listByAssignee(orgId, email) {
        return await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.orgId, orgId), eq(tasks.assignedToEmail, email)))
          .orderBy(desc(tasks.createdAt));
      },
    },

    tickets: {
      async create(input) {
        const [row] = await db
          .insert(tickets)
          .values({
            orgId: input.orgId,
            createdByEmail: input.createdByEmail,
            title: input.title,
            description: input.description,
            status: input.status,
            metadata: input.metadata ?? {},
          })
          .returning();
        return row;
      },
    },

    buddies: {
      async assign(input) {
        const [row] = await db
          .insert(buddyAssignments)
          .values({
            orgId: input.orgId,
            employeeEmail: input.employeeEmail,
            buddyEmail: input.buddyEmail,
            assignedByEmail: input.assignedByEmail,
          })
          .returning();
        return row;
      },
    },

    orgMembers: {
      async upsertMany(_orgId, rows) {
        // Local mode maps org members onto the users table; only updates
        // known users since local users require more fields than a CSV row.
        let upserted = 0;
        for (const r of rows) {
          const [existing] = await db.select().from(users).where(eq(users.username, r.email));
          if (existing) {
            await db
              .update(users)
              .set({
                displayName: r.displayName ?? existing.displayName,
                role: r.role ?? existing.role,
                department: r.department ?? existing.department,
                jobTitle: r.title ?? existing.jobTitle,
              })
              .where(eq(users.id, existing.id));
            upserted++;
          }
        }
        return { upserted };
      },

      async list(_orgId) {
        const all = await db.select().from(users);
        return all.map(({ password, ...u }) => u);
      },
    },

    feedback: {
      async create(input) {
        // Local mode records feedback as a help center event for analytics.
        const [row] = await db
          .insert(helpCenterEvents)
          .values({
            orgId: input.orgId,
            userEmail: input.userEmail,
            eventType: "feedback",
            payload: {
              type: input.type,
              rating: input.rating ?? null,
              freeText: input.freeText ?? null,
              ...(input.metadata ?? {}),
            },
          })
          .returning();
        return row;
      },

      async list(orgId) {
        return await db
          .select()
          .from(helpCenterEvents)
          .where(and(eq(helpCenterEvents.orgId, orgId), eq(helpCenterEvents.eventType, "feedback")))
          .orderBy(desc(helpCenterEvents.createdAt));
      },
    },

    helpCenterEvents: {
      async log(input) {
        try {
          const [row] = await db
            .insert(helpCenterEvents)
            .values({
              orgId: input.orgId,
              userEmail: input.userEmail,
              eventType: input.eventType,
              payload: input.payload ?? {},
            })
            .returning();
          return row;
        } catch (error) {
          // Analytics logging must never block answering a question.
          console.warn("helpCenterEvents.log failed (non-blocking):", error);
          return null;
        }
      },
    },

    links: {
      async resolve(_orgId: string, key: string) {
        const defaults: Record<string, string> = {
          repository: "/repository",
          benefits: "/onboarding-step6",
          "org-chart": "/onboarding-step7",
          assistant: "/chatbot",
        };
        return defaults[key] ? { url: defaults[key], label: key } : null;
      },
    },
  };
}
