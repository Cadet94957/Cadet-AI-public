import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExtendedStorage } from "../extendedStorage";

declare global {
  namespace Express {
    interface Request {
      cadet?: {
        orgId: string | null;
        supabase: SupabaseClient | null;
        storage: ExtendedStorage | null;
        tenant?: {
          planTier?: "pilot" | "growth" | "enterprise";
        };
      };
    }
  }
}

export {};
