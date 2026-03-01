import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { tgDisplayName, telegramSendMessage, verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

type Body = { master_id: string; service_id: string; start_at: string; client_phone?: string };

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
    if (!body?.master_id) throw new Error("master_id required");
    if (!body?.service_id) throw new Error("service_id required");
    if (!body?.start_at) throw new Error("start_at required");

    const db = dbAdmin();

    const { data: master, error: mErr } = await db
      .from("masters")
      .select("id, tg_user_id, display_name, is_active")
      .eq("id", body.master_id)
      .maybeSingle();
    if (mErr) throw mErr;
    if (!master || !master.is_active) throw new Error("Master not found");

    const { data: service, error: sErr } = await db
      .from("services")
      .select("id, title, duration_min, price_rub, master_id, is_active")
      .eq("id", body.service_id)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!service || !service.is_active || service.master_id !== master.id) throw new Error("Service not found");

    const startAt = new Date(body.start_at);
    if (Number.isNaN(startAt.getTime())) throw new Error("Invalid start_at");
    if (startAt.getTime() < Date.now() - 60_000) throw new Error("start_at is in the past");
    const endAt = addMinutes(startAt, service.duration_min);

    const clientTgId = auth.tgUser.id;
    const clientName = tgDisplayName(auth.tgUser);

    const { data: clientUpsert, error: cErr } = await db
      .from("clients")
      .upsert({ tg_user_id: clientTgId, display_name: clientName, phone: body.client_phone ?? null }, { onConflict: "tg_user_id" })
      .select("id")
      .single();
    if (cErr) throw cErr;

    const { data: appt, error: aErr } = await db
      .from("appointments")
      .insert({
        master_id: master.id,
        service_id: service.id,
        client_id: clientUpsert.id,
        client_tg_user_id: clientTgId,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: "confirmed"
      })
      .select("id, start_at, end_at, status")
      .single();

    if (aErr) {
      const msg = String((aErr as any).message ?? aErr);
      if (msg.toLowerCase().includes("overlap") || msg.toLowerCase().includes("exclude")) {
        return new Response(JSON.stringify({ ok: false, error: "slot_taken" }), {
          status: 409,
          headers: { ...corsHeaders, "content-type": "application/json" }
        });
      }
      throw aErr;
    }

    const when = new Date(appt.start_at).toISOString().replace("T", " ").slice(0, 16) + " UTC";

    await Promise.allSettled([
      telegramSendMessage(master.tg_user_id, `Новая запись ✅\nКлиент: ${clientName}\nУслуга: ${service.title}\nВремя: ${when}\nID: ${appt.id}`),
      telegramSendMessage(clientTgId, `Запись подтверждена ✅\nМастер: ${master.display_name}\nУслуга: ${service.title}\nВремя: ${when}`)
    ]);

    return new Response(JSON.stringify({ ok: true, appointment: appt }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
