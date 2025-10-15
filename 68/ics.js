export function downloadICS({ title, startISO, endISO, description = "", location = "", uid }) {
  const esc = s => String(s || "").replace(/([\n,;])/g, m => ({ "\n":"\\n", ",":"\\,", ";":"\\;" }[m]));
  const dt = iso => iso ? iso.replace(/[-:]/g, "").replace(/\.\d+Z$/,"Z") : "";
  const now = dt(new Date().toISOString());
  const uidStr = uid || (`uid-${now}@myapp`);
  const body =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MyApp//Orders//EN
BEGIN:VEVENT
UID:${uidStr}
DTSTAMP:${now}
DTSTART:${dt(startISO)}
DTEND:${dt(endISO)}
SUMMARY:${esc(title)}
DESCRIPTION:${esc(description)}
LOCATION:${esc(location)}
END:VEVENT
END:VCALENDAR`;
  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "order.ics"; a.click();
  URL.revokeObjectURL(url);
}
