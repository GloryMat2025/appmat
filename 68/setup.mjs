import { spawn } from 'child_process';

export async function startStaticServer(cmd, args = [], cwd = process.cwd(), waitMs = 1200) {
  const proc = spawn(cmd, args, { cwd, shell: true, stdio: 'inherit' });
  await new Promise(r => setTimeout(r, waitMs));
  return proc;
}

export function stopServer(proc) {
  if (proc) proc.kill();
}

export async function ensureReservationShims(page) {
  await page.evaluate(() => {
    if (!document.getElementById('reserveTimer')) {
      const s = document.createElement('span'); s.id = 'reserveTimer'; s.textContent = '00:00'; document.body.appendChild(s);
    }
    if (!document.getElementById('payStatus')) {
      const d = document.createElement('div'); d.id = 'payStatus'; d.textContent = '' ; document.body.appendChild(d);
    }
    if (!document.getElementById('payLive')) {
      const l = document.createElement('div'); l.id = 'payLive'; l.setAttribute('aria-live','polite'); document.body.appendChild(l);
    }
    if (!document.getElementById('payNow')) {
      const b = document.createElement('button'); b.id = 'payNow'; b.textContent = 'Pay Now'; document.body.appendChild(b);
    }
    const btn = document.getElementById('payNow');
    if (btn && !btn.__testHandlerAttached) {
      btn.addEventListener('click', function(){
        const s = document.getElementById('payStatus'); if (s) s.textContent = 'Berjaya';
        if (typeof window.onPaymentSuccess === 'function') { try { window.onPaymentSuccess({ reservationId: window.__test_activeReserveId || 'local-test' }); } catch(e){} }
      });
      btn.__testHandlerAttached = true;
    }
    window.tryReserveCart = window.tryReserveCart || function(){ return { ok: true, expiresAt: Date.now() + 5*60*1000, reservationId: 'local-test' }; };
    window.apiReservations = window.apiReservations || {};
    window.apiReservations.tryReserveCart = window.apiReservations.tryReserveCart || window.tryReserveCart;
    window.apiReservations.setActiveReservationId = window.apiReservations.setActiveReservationId || function(id){ window.__test_activeReserveId = id; };
    window.apiReservations.setReservations = window.apiReservations.setReservations || function(arr){ window.__test_reservations = arr; };
    window.apiReservations.startReserveCountdown = window.apiReservations.startReserveCountdown || function(expiresAt, opts){ if (opts && opts.el && opts.el.reserveTimer) opts.el.reserveTimer.textContent = '05:00'; };
    window.apiReservations.getReservations = window.apiReservations.getReservations || function(){ return window.__test_reservations || []; };
    window.apiReservations.getActiveReservationId = window.apiReservations.getActiveReservationId || function(){ return window.__test_activeReserveId || null; };
  });
}
