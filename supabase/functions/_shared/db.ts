import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { ENV } from "./env.ts";

export function dbAdmin() {
  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
}
