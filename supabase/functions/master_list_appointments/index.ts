import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

type Body = { from?: string; to?: string };

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const initData = req.headers.get("x-telegram-init-data") ?? "";
    const auth = await verifyTelegramInitDataOrThrow(initData);

    const body = (await req.json().catch(() => ({}))) as Body;
    const from = body.from ? new Date(body.from) : new Date(Date.now() - 1 * 24 * 60 * 60_000);
    const to = body.to ? new Date(body.to) : new Date(Date.now() + 14 * 24 * 60 * 60_000);

    const db = dbAdmin();
    const { data: master, error: mErr } = await db.from("masters").select("id").eq("tg_user_id", auth.tgUser.id).maybeSingle();
    if (mErr) throw mErr;
    if (!master) throw new Error("not_master");

    const { data, error } = await db
      .from("appointments")
      .select("id, start_at, end_at, status, cancel_reason, client_tg_user_id, service:services(id, title, duration_min, price_rub)")
      .eq("master_id", master.id)
      .gte("start_at", from.toISOString())
      .lte("start_at", to.toISOString())
      .order("start_at", { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, appointments: data ?? [] }), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    const status = msg === "not_master" ? 403 : 400;
    return new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
