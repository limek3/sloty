import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

type Body = { id?: string; title: string; duration_min: number; price_rub: number; is_active?: boolean };

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const initData = req.headers.get("x-telegram-init-data") ?? "";
    const auth = await verifyTelegramInitDataOrThrow(initData);
    const body = (await req.json()) as Body;

    const title = String(body.title ?? "").trim();
    if (!title) throw new Error("title required");

    const duration = clamp(Number(body.duration_min), 10, 480);
    const price = Math.max(0, Math.floor(Number(body.price_rub)));

    const db = dbAdmin();
    const { data: master, error: mErr } = await db.from("masters").select("id").eq("tg_user_id", auth.tgUser.id).maybeSingle();
    if (mErr) throw mErr;
    if (!master) throw new Error("not_master");

    const row: Record<string, any> = {
      master_id: master.id,
      title,
      duration_min: duration,
      price_rub: price,
      is_active: body.is_active ?? true
    };
    if (body.id) row.id = body.id;

    const { data, error } = await db.from("services").upsert(row).select("id, title, duration_min, price_rub, is_active").single();
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, service: data }), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    const status = msg === "not_master" ? 403 : 400;
    return new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
