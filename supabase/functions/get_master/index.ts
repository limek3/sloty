import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

type Body = { master_id: string };

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const initData = req.headers.get("x-telegram-init-data") ?? "";
    await verifyTelegramInitDataOrThrow(initData);

    const body = (await req.json()) as Body;
    if (!body?.master_id) throw new Error("master_id required");

    const db = dbAdmin();
    const { data: master, error } = await db
      .from("masters")
      .select("id, display_name, city, bio, timezone, is_active")
      .eq("id", body.master_id)
      .maybeSingle();

    if (error) throw error;
    if (!master || !master.is_active) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ ok: true, master }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
