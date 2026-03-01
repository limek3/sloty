import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

type Interval = { weekday: number; start_time: string; end_time: string };
type Body = { intervals: Interval[] };

function validTime(t: string): boolean {
  return /^\d\d:\d\d(:\d\d)?$/.test(t);
}

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const initData = req.headers.get("x-telegram-init-data") ?? "";
    const auth = await verifyTelegramInitDataOrThrow(initData);
    const body = (await req.json()) as Body;

    const intervals = Array.isArray(body?.intervals) ? body.intervals : [];
    for (const i of intervals) {
      if (typeof i.weekday !== "number" || i.weekday < 0 || i.weekday > 6) throw new Error("Invalid weekday");
      if (!validTime(i.start_time) || !validTime(i.end_time)) throw new Error("Invalid time");
      if (i.start_time >= i.end_time) throw new Error("start_time must be < end_time");
    }

    const db = dbAdmin();
    const { data: master, error: mErr } = await db.from("masters").select("id").eq("tg_user_id", auth.tgUser.id).maybeSingle();
    if (mErr) throw mErr;
    if (!master) throw new Error("not_master");

    const { error: delErr } = await db.from("working_hours").delete().eq("master_id", master.id);
    if (delErr) throw delErr;

    if (intervals.length) {
      const rows = intervals.map((i) => ({ master_id: master.id, weekday: i.weekday, start_time: i.start_time, end_time: i.end_time }));
      const { error: insErr } = await db.from("working_hours").insert(rows);
      if (insErr) throw insErr;
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    const status = msg === "not_master" ? 403 : 400;
    return new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
