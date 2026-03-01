import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

type Body = { display_name?: string; city?: string | null; bio?: string | null; timezone?: string };

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const initData = req.headers.get("x-telegram-init-data") ?? "";
    const auth = await verifyTelegramInitDataOrThrow(initData);
    const body = (await req.json().catch(() => ({}))) as Body;

    const db = dbAdmin();
    const { data: master, error: mErr } = await db.from("masters").select("id").eq("tg_user_id", auth.tgUser.id).maybeSingle();
    if (mErr) throw mErr;
    if (!master) throw new Error("not_master");

    const patch: Record<string, any> = {};
    if (typeof body.display_name === "string" && body.display_name.trim()) patch.display_name = body.display_name.trim();
    if (body.city !== undefined) patch.city = body.city;
    if (body.bio !== undefined) patch.bio = body.bio;
    if (typeof body.timezone === "string" && body.timezone.trim()) patch.timezone = body.timezone.trim();

    const { data, error } = await db.from("masters").update(patch).eq("id", master.id).select("id, display_name, city, bio, timezone, is_active").single();
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, master: data }), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    const status = msg === "not_master" ? 403 : 400;
    return new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
