export function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const ENV = {
  TELEGRAM_BOT_TOKEN: mustEnv("TELEGRAM_BOT_TOKEN"),
  SUPABASE_URL: mustEnv("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  WEBAPP_URL: mustEnv("WEBAPP_URL"),
  BOT_USERNAME: mustEnv("BOT_USERNAME")
};

export function deepLinkForMaster(masterId: string): string {
  return `https://t.me/${ENV.BOT_USERNAME}?start=master_${masterId}`;
}

export function webAppUrl(path: string): string {
  const base = ENV.WEBAPP_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
