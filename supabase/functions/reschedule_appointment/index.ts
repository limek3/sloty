import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { telegramSendMessage, verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

type Body = { appointment_id: string; new_start_at: string };

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60_000);
}

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const initData = req.headers.get("x-telegram-init-data") ?? "";
    const auth = await verifyTelegramInitDataOrThrow(initData);

    const body = (await req.json()) as Body;
    if (!body?.appointment_id) throw new Error("appointment_id required");
    if (!body?.new_start_at) throw new Error("new_start_at required");

    const db = dbAdmin();

    const { data: appt, error: aErr } = await db
      .from("appointments")
      .select("id, master_id, service_id, client_tg_user_id, status, start_at, master:masters(tg_user_id, display_name), service:services(title, duration_min)")
      .eq("id", body.appointment_id)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!appt) throw new Error("Not found");
    if (appt.status === "canceled") throw new Error("Already canceled");

    const isClient = appt.client_tg_user_id === auth.tgUser.id;
    const { data: masterRow } = await db.from("masters").select("tg_user_id").eq("id", appt.master_id).maybeSingle();
    const isMaster = masterRow?.tg_user_id === auth.tgUser.id;
    if (!isClient && !isMaster) throw new Error("Forbidden");

    const ns = new Date(body.new_start_at);
    if (Number.isNaN(ns.getTime())) throw new Error("Invalid new_start_at");
    if (ns.getTime() < Date.now() - 60_000) throw new Error("new_start_at is in the past");

    const ne = addMinutes(ns, appt.service.duration_min);

    const { error: uErr } = await db
      .from("appointments")
      .update({ start_at: ns.toISOString(), end_at: ne.toISOString() })
      .eq("id", appt.id);

    if (uErr) {
      const msg = String((uErr as any).message ?? uErr);
      if (msg.toLowerCase().includes("overlap") || msg.toLowerCase().includes("exclude")) {
        return new Response(JSON.stringify({ ok: false, error: "slot_taken" }), {
          status: 409,
          headers: { ...corsHeaders, "content-type": "application/json" }
        });
      }
      throw uErr;
    }

    const whenOld = new Date(appt.start_at).toISOString().replace("T", " ").slice(0, 16) + " UTC";
    const whenNew = ns.toISOString().replace("T", " ").slice(0, 16) + " UTC";

    await Promise.allSettled([
      telegramSendMessage(appt.master.tg_user_id, `Перенос записи 🔁\nУслуга: ${appt.service.title}\nБыло: ${whenOld}\nСтало: ${whenNew}`),
      telegramSendMessage(appt.client_tg_user_id, `Запись перенесена 🔁\nМастер: ${appt.master.display_name}\nБыло: ${whenOld}\nСтало: ${whenNew}`)
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
