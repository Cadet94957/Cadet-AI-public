import type { Request, Response, NextFunction } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { TenantRegistry } from "./tenantRegistry";
import { createExtendedStorage, type ExtendedStorage } from "../extendedStorage";
import { createLocalTenantStorage } from "../localTenantStorage";

/**
 * Resolve orgId from request.
 * We support:
 * - req.body.orgId
 * - req.query.orgId
 * - req.params.orgId
 */
function resolveOrgId(req: Request): string | null {
  const bodyOrg = (req.body && (req.body.orgId as string)) || null;
  const queryOrg = (req.query && (req.query.orgId as string)) || null;
  const paramOrg = (req.params && (req.params.orgId as string)) || null;
  return bodyOrg || queryOrg || paramOrg;
}

// Shared local (single-tenant) storage used when an orgId has no Supabase
// project registered. Keeps the Help Center agent fully functional against
// the app's own Postgres database.
const localStorage = createLocalTenantStorage();

export function createTenantMiddleware(registry: TenantRegistry) {
  return async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
    const orgId = resolveOrgId(req);

    // Allow non-tenant routes to proceed (health checks, public pages, etc.)
    if (!orgId) {
      req.cadet = { orgId: null, supabase: null, storage: null };
      return next();
    }

    const tenant = registry.getTenant(orgId);
    if (!tenant) {
      // Single-tenant fallback: serve the request from local storage.
      req.cadet = {
        orgId,
        supabase: null,
        storage: localStorage,
        tenant: { planTier: "pilot" },
      };
      return next();
    }

    const supabase: SupabaseClient = createClient(tenant.supabaseUrl, tenant.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const storage: ExtendedStorage = createExtendedStorage({ supabase });

    req.cadet = {
      orgId,
      supabase,
      storage,
      tenant: {
        planTier: tenant.planTier ?? "pilot",
      },
    };

    return next();
  };
}
