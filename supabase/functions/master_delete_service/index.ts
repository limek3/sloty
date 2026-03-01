import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

type Body = { id: string };

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const initData = req.headers.get("x-telegram-init-data") ?? "";
    const auth = await verifyTelegramInitDataOrThrow(initData);
    const body = (await req.json()) as Body;
    if (!body?.id) throw new Error("id required");

    const db = dbAdmin();
    const { data: master, error: mErr } = await db.from("masters").select("id").eq("tg_user_id", auth.tgUser.id).maybeSingle();
    if (mErr) throw mErr;
    if (!master) throw new Error("not_master");

    const { error } = await db.from("services").update({ is_active: false }).eq("id", body.id).eq("master_id", master.id);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    const status = msg === "not_master" ? 403 : 400;
    return new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
