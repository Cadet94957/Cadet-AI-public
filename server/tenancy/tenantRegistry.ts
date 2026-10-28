import crypto from "crypto";

/**
 * Single-tenant Supabase per customer:
 * - Each orgId maps to ONE Supabase project (url + service role key).
 * - Customers never see Supabase. Cadet backend holds credentials.
 *
 * IMPORTANT:
 * - In production, store service role keys ENCRYPTED at rest.
 * - This file provides a minimal "registry" abstraction you can later back with Postgres.
 */

export type TenantSupabaseConfig = {
  orgId: string; // UUID string
  supabaseUrl: string;
  supabaseServiceRoleKey: string; // server-only secret
  planTier?: "pilot" | "growth" | "enterprise";
  status?: "active" | "suspended";
};

/**
 * Simple in-memory registry (MVP).
 * Replace with a real DB table in your "control plane" DB later.
 */
export class TenantRegistry {
  private tenants = new Map<string, TenantSupabaseConfig>();

  /**
   * Optional: load a JSON map from env for fast bootstrapping.
   * Format:
   * TENANT_SUPABASE_JSON='[
   *   {"orgId":"...","supabaseUrl":"...","supabaseServiceRoleKey":"...","planTier":"pilot"}
   * ]'
   */
  loadFromEnv() {
    const raw = process.env.TENANT_SUPABASE_JSON;
    if (!raw) return;

    try {
      const arr = JSON.parse(raw) as TenantSupabaseConfig[];
      for (const t of arr) {
        if (!t?.orgId || !t.supabaseUrl || !t.supabaseServiceRoleKey) continue;
        this.tenants.set(t.orgId, { ...t, status: t.status ?? "active" });
      }
    } catch {
      // ignore bad env
    }
  }

  upsertTenant(cfg: TenantSupabaseConfig) {
    this.tenants.set(cfg.orgId, { ...cfg, status: cfg.status ?? "active" });
  }

  getTenant(orgId: string): TenantSupabaseConfig | null {
    const t = this.tenants.get(orgId);
    if (!t) return null;
    if (t.status === "suspended") return null;
    return t;
  }
}

/**
 * OPTIONAL encryption helpers (recommended if you persist keys in a DB).
 * Use AES-256-GCM with a master key in env (CADET_MASTER_KEY).
 */
export function encryptSecret(plaintext: string, masterKey: string): string {
  const key = crypto.createHash("sha256").update(masterKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(ciphertextB64: string, masterKey: string): string {
  const buf = Buffer.from(ciphertextB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const key = crypto.createHash("sha256").update(masterKey).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}
