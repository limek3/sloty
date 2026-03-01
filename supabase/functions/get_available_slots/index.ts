import { corsHeaders, corsPreflight } from "../_shared/cors.ts";
import { dbAdmin } from "../_shared/db.ts";
import { verifyTelegramInitDataOrThrow } from "../_shared/telegram.ts";

type Body = {
  master_id: string;
  service_id: string;
  from_date: string; // YYYY-MM-DD
  days: number; // 1..14
  step_min?: number;
  buffer_min?: number;
};

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60_000);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseYmdToUtcMidnight(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

function fmtYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

Deno.serve(async (req) => {
  const pre = corsPreflight(req);
  if (pre) return pre;

  try {
    const initData = req.headers.get("x-telegram-init-data") ?? "";
    await verifyTelegramInitDataOrThrow(initData);

    const body = (await req.json()) as Body;
    const days = clamp(body.days ?? 7, 1, 14);
    const stepMin = clamp(body.step_min ?? 15, 5, 60);
    const bufferMin = clamp(body.buffer_min ?? 0, 0, 60);

    if (!body?.master_id) throw new Error("master_id required");
    if (!body?.service_id) throw new Error("service_id required");
    if (!body?.from_date) throw new Error("from_date required");

    const db = dbAdmin();

    const { data: service, error: serviceErr } = await db
      .from("services")
      .select("id, duration_min, master_id, is_active")
      .eq("id", body.service_id)
      .maybeSingle();

    if (serviceErr) throw serviceErr;
    if (!service || !service.is_active || service.master_id !== body.master_id) {
      return new Response(JSON.stringify({ ok: false, error: "service_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    const fromUtc = parseYmdToUtcMidnight(body.from_date);
    const toUtc = addMinutes(fromUtc, days * 24 * 60);

    const { data: wh, error: whErr } = await db
      .from("working_hours")
      .select("weekday, start_time, end_time")
      .eq("master_id", body.master_id);

    if (whErr) throw whErr;

    const { data: appts, error: apptErr } = await db
      .from("appointments")
      .select("start_at, end_at, status")
      .eq("master_id", body.master_id)
      .gte("start_at", fromUtc.toISOString())
      .lt("start_at", toUtc.toISOString())
      .in("status", ["pending", "confirmed"]);

    if (apptErr) throw apptErr;

    const { data: timeOff, error: toErr } = await db
      .from("time_off")
      .select("start_at, end_at")
      .eq("master_id", body.master_id)
      .lte("start_at", toUtc.toISOString())
      .gte("end_at", fromUtc.toISOString());

    if (toErr) throw toErr;

    const durationMin = service.duration_min + bufferMin;

    const whByWeekday = new Map<number, { start: string; end: string }[]>();
    for (const row of wh ?? []) {
      const list = whByWeekday.get(row.weekday) ?? [];
      list.push({ start: row.start_time, end: row.end_time });
      whByWeekday.set(row.weekday, list);
    }

    const busyRanges = (appts ?? []).map((a) => ({ start: new Date(a.start_at), end: new Date(a.end_at) }));
    const offRanges = (timeOff ?? []).map((t) => ({ start: new Date(t.start_at), end: new Date(t.end_at) }));

    function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
      return aStart < bEnd && bStart < aEnd;
    }

    const out: Record<string, string[]> = {};

    for (let i = 0; i < days; i++) {
      const dayStart = addMinutes(fromUtc, i * 24 * 60);
      const weekday = (dayStart.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
      const ymd = fmtYmd(dayStart);

      const intervals = whByWeekday.get(weekday) ?? [];
      const slots: string[] = [];

      for (const interval of intervals) {
        const [sh, sm] = interval.start.split(":").map(Number);
        const [eh, em] = interval.end.split(":").map(Number);

        const start = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate(), sh, sm, 0));
        const end = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate(), eh, em, 0));

        for (let t = new Date(start); addMinutes(t, durationMin) <= end; t = addMinutes(t, stepMin)) {
          const candStart = t;
          const candEnd = addMinutes(t, durationMin);

          const isBusy = busyRanges.some((b) => overlaps(candStart, candEnd, b.start, b.end));
          const isOff = offRanges.some((o) => overlaps(candStart, candEnd, o.start, o.end));
          if (isBusy || isOff) continue;

          slots.push(candStart.toISOString());
        }
      }

      out[ymd] = slots;
    }

    return new Response(JSON.stringify({ ok: true, slots: out }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
