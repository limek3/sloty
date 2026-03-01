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
    const { data: appt, error: aErr } = await db
      .from("appointments")
      .select("id, client_tg_user_id, status, start_at, master:masters(tg_user_id, display_name), service:services(title)")
      .eq("id", body.appointment_id)
      .maybeSingle();

    if (aErr) throw aErr;
    if (!appt) throw new Error("Not found");
    if (appt.client_tg_user_id !== auth.tgUser.id) throw new Error("Forbidden");

    if (appt.status !== "canceled") {
      const { error: uErr } = await db
        .from("appointments")
        .update({ status: "canceled", cancel_reason: body.reason ?? "Отменено клиентом" })
        .eq("id", body.appointment_id);
      if (uErr) throw uErr;

      const when = new Date(appt.start_at).toISOString().replace("T", " ").slice(0, 16) + " UTC";
      await Promise.allSettled([
        telegramSendMessage(appt.master.tg_user_id, `Запись отменена ❌\nВремя: ${when}`),
        telegramSendMessage(appt.client_tg_user_id, `Вы отменили запись ❌\nМастер: ${appt.master.display_name}\nВремя: ${when}`)
      ]);
    }

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
