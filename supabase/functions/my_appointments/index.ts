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
    const from = body.from ? new Date(body.from) : new Date(Date.now() - 7 * 24 * 60 * 60_000);
    const to = body.to ? new Date(body.to) : new Date(Date.now() + 30 * 24 * 60 * 60_000);

    const db = dbAdmin();
    const { data, error } = await db
      .from("appointments")
      .select("id, start_at, end_at, status, cancel_reason, master:masters(id, display_name), service:services(id, title, duration_min, price_rub)")
      .eq("client_tg_user_id", auth.tgUser.id)
      .gte("start_at", from.toISOString())
      .lte("start_at", to.toISOString())
      .order("start_at", { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, appointments: data ?? [] }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
