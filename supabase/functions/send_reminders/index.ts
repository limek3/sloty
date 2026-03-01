import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { ENV } from "../_shared/env.ts";
import { telegramSendMessage } from "../_shared/telegram.ts";

type Body = { secret?: string };

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    if (ENV.REMINDERS_SECRET && body.secret !== ENV.REMINDERS_SECRET) throw new Error("Forbidden");

    const db = dbAdmin();

    const targets = [
      { label: "через 2 часа", from: new Date(Date.now() + 110 * 60_000), to: new Date(Date.now() + 130 * 60_000) },
      { label: "через 24 часа", from: new Date(Date.now() + 23 * 60 * 60_000), to: new Date(Date.now() + 25 * 60 * 60_000) }
    ];

    let sent = 0;

    for (const t of targets) {
      const { data, error } = await db
        .from("appointments")
        .select("id, start_at, client_tg_user_id, master:masters(tg_user_id, display_name), service:services(title)")
        .in("status", ["pending", "confirmed"])
        .gte("start_at", t.from.toISOString())
        .lt("start_at", t.to.toISOString());

      if (error) throw error;

      for (const a of data ?? []) {
        const when = new Date(a.start_at).toISOString().replace("T", " ").slice(0, 16) + " UTC";
        await Promise.allSettled([
          telegramSendMessage(a.client_tg_user_id, `Напоминание ⏰\nЗапись ${t.label}\nМастер: ${a.master.display_name}\nУслуга: ${a.service.title}\nВремя: ${when}`),
          telegramSendMessage(a.master.tg_user_id, `Напоминание ⏰\nЗапись клиента ${t.label}\nУслуга: ${a.service.title}\nВремя: ${when}`)
        ]);
        sent += 2;
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
