// src/utils/eta.js
// Live ETA countdown, drift-safe, with quick adjust and store sync

export function startEtaTimer({ getEtaMinutes, setEtaMinutes, onTick, interval = 1000 } = {}) {
  let timer = null;
  let lastEta = getEtaMinutes();
  let etaTarget = lastEta > 0 ? Date.now() + lastEta * 60000 : null;

  function tick() {
    if (!etaTarget) return;
    const now = Date.now();
    let minsLeft = Math.max(0, Math.round((etaTarget - now) / 60000));
    if (minsLeft !== lastEta) {
      setEtaMinutes(minsLeft);
      lastEta = minsLeft;
    }
    if (typeof onTick === "function") onTick(minsLeft);
    if (minsLeft <= 0) stop();
  }

  function start() {
    stop();
    lastEta = getEtaMinutes();
    etaTarget = lastEta > 0 ? Date.now() + lastEta * 60000 : null;
    if (etaTarget) timer = setInterval(tick, interval);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function adjust(delta) {
    if (!etaTarget) return;
    etaTarget += delta * 60000;
    const mins = Math.max(0, Math.round((etaTarget - Date.now()) / 60000));
    setEtaMinutes(mins);
    lastEta = mins;
    if (typeof onTick === "function") onTick(mins);
  }

  function setExact(mins) {
    etaTarget = Date.now() + mins * 60000;
    setEtaMinutes(mins);
    lastEta = mins;
    if (typeof onTick === "function") onTick(mins);
  }

  return { start, stop, adjust, setExact };
}

// Helper for formatting ETA as mm:ss or "Arrived"
export function formatEta(mins) {
  if (mins <= 0) return "Arrived";
  const m = Math.floor(mins);
  const s = Math.round((mins - m) * 60);
  return `${m}m${s > 0 ? ` ${s}s` : ""}`;
}
