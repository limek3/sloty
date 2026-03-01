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
    const { data, error } = await db
      .from("services")
      .select("id, title, duration_min, price_rub")
      .eq("master_id", body.master_id)
      .eq("is_active", true)
      .order("title", { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, services: data ?? [] }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
