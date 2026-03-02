function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsDate(dtIso: string) {
  const d = new Date(dtIso);
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

export function downloadIcs(args: {
  title: string;
  description?: string;
  startIso: string;
  endIso: string;
}) {
  const uid = `${Math.random().toString(16).slice(2)}@sloty`;
  const dtStamp = toIcsDate(new Date().toISOString());
  const dtStart = toIcsDate(args.startIso);
  const dtEnd = toIcsDate(args.endIso);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sloty//Booking//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${args.title}`,
    args.description ? `DESCRIPTION:${args.description.replace(/\n/g, "\\n")}` : "",
    "END:VEVENT",
    "END:VCALENDAR"
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sloty-booking.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}