import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const initData = req.headers.get("x-telegram-init-data") ?? "";
    const auth = await verifyTelegramInitDataOrThrow(initData);

    const db = dbAdmin();
    const { data, error } = await db
      .from("masters")
      .select("id, tg_user_id, display_name, city, bio, timezone, is_active")
      .eq("tg_user_id", auth.tgUser.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return new Response(JSON.stringify({ ok: false, error: "not_master" }), { status: 403, headers: { ...corsHeaders, "content-type": "application/json" } });

    return new Response(JSON.stringify({ ok: true, master: data }), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
