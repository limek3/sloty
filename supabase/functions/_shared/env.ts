export function mustEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const ENV = {
  SUPABASE_URL: mustEnv("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  TELEGRAM_BOT_TOKEN: mustEnv("TELEGRAM_BOT_TOKEN"),
  REMINDERS_SECRET: Deno.env.get("REMINDERS_SECRET") ?? null
};
