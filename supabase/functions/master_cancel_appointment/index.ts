import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { telegramSendMessage, verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

type Body = { appointment_id: string; reason?: string };

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const initData = req.headers.get("x-telegram-init-data") ?? "";
    const auth = await verifyTelegramInitDataOrThrow(initData);
    const body = (await req.json()) as Body;

    if (!body?.appointment_id) throw new Error("appointment_id required");

    const db = dbAdmin();
    const { data: master, error: mErr } = await db.from("masters").select("id, tg_user_id, display_name").eq("tg_user_id", auth.tgUser.id).maybeSingle();
    if (mErr) throw mErr;
    if (!master) throw new Error("not_master");

    const { data: appt, error: aErr } = await db
      .from("appointments")
      .select("id, status, start_at, client_tg_user_id, service:services(title)")
      .eq("id", body.appointment_id)
      .eq("master_id", master.id)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!appt) throw new Error("Not found");

    if (appt.status !== "canceled") {
      const { error: uErr } = await db
        .from("appointments")
        .update({ status: "canceled", cancel_reason: body.reason ?? "Отменено мастером" })
        .eq("id", appt.id);
      if (uErr) throw uErr;

      const when = new Date(appt.start_at).toISOString().replace("T", " ").slice(0, 16) + " UTC";
      await Promise.allSettled([
        telegramSendMessage(appt.client_tg_user_id, `Запись отменена мастером ❌\nМастер: ${master.display_name}\nУслуга: ${appt.service.title}\nВремя: ${when}`),
        telegramSendMessage(master.tg_user_id, `Вы отменили запись ❌\nУслуга: ${appt.service.title}\nВремя: ${when}`)
      ]);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    const status = msg === "not_master" ? 403 : 400;
    return new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
