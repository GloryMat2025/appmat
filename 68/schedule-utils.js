// schedule-utils.js
// Utility for business hours, open/closed, slots, and exceptions

export async function loadSchedule(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load schedule config");
  return await res.json();
}

export function isOpenNow(cfg, now = new Date()) {
  /* eslint-disable no-unused-vars */
  const { hours, blackouts = [], exceptions = {}, tz } = cfg;
  const d = new Date(now);
  const yyyyMmDd = d.toISOString().slice(0, 10);
  if (blackouts.includes(yyyyMmDd)) return { open: false };
  const ex = exceptions[yyyyMmDd];
  const wd = String(d.getDay());
  const dayHours = (ex && ex[wd]) || (hours && hours[wd]) || [];
  for (const r of dayHours) {
    const start = parseTime(r.start, d);
    const end = parseTime(r.end, d);
    if (d >= start && d < end) return { open: true, start, end };
  }
  return { open: false };
}

export function nextChange(cfg, now = new Date()) {
  const { hours, blackouts = [], exceptions = {}, tz } = cfg;
  let d = new Date(now);
  for (let i = 0; i < 8; i++) {
    const yyyyMmDd = d.toISOString().slice(0, 10);
    if (blackouts.includes(yyyyMmDd)) {
      d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); continue;
    }
    const ex = exceptions[yyyyMmDd];
    const wd = String(d.getDay());
    const dayHours = (ex && ex[wd]) || (hours && hours[wd]) || [];
    for (const r of dayHours) {
      const start = parseTime(r.start, d);
      const end = parseTime(r.end, d);
      if (now < start) return { type: "open", at: start };
      if (now < end) return { type: "close", at: end };
    }
    d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0);
  }
  return null;
}

export function todaySlots(cfg, now = new Date()) {
  const { slotMinutes = 15, hours, blackouts = [], exceptions = {} } = cfg;
  const d = new Date(now);
  const yyyyMmDd = d.toISOString().slice(0, 10);
  if (blackouts.includes(yyyyMmDd)) return [];
  const ex = exceptions[yyyyMmDd];
  const wd = String(d.getDay());
  const dayHours = (ex && ex[wd]) || (hours && hours[wd]) || [];
  const slots = [];
  for (const r of dayHours) {
    let t = parseTime(r.start, d);
    const end = parseTime(r.end, d);
    while (t < end) {
      slots.push(new Date(t));
      t = new Date(t.getTime() + slotMinutes * 60000);
    }
  }
  return slots;
}

export function weekOverview(cfg, ref = new Date()) {
  const { hours, blackouts = [], exceptions = {} } = cfg;
  const days = [];
  let d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const yyyyMmDd = d.toISOString().slice(0, 10);
    let open = false, windows = [];
    if (!blackouts.includes(yyyyMmDd)) {
      const ex = exceptions[yyyyMmDd];
      const wd = String(d.getDay());
      const dayHours = (ex && ex[wd]) || (hours && hours[wd]) || [];
      for (const r of dayHours) {
        windows.push({ start: r.start, end: r.end });
        open = true;
      }
    }
    days.push({ date: new Date(d), open, windows });
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function parseTime(hhmm, refDate) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(refDate);
  d.setHours(h, m, 0, 0);
  return d;
}
