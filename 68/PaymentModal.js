// PaymentModal.js — simple payment simulation modal
export function PaymentModal({ onConfirm }) {
  let modalEl = null;

  function open() {
    if (modalEl) return;
    modalEl = document.createElement("div");
    modalEl.style.position = "fixed";
    modalEl.style.inset = 0;
    modalEl.style.background = "rgba(0,0,0,0.3)";
    modalEl.style.display = "grid";
    modalEl.style.placeItems = "center";
    modalEl.style.zIndex = 1000;
    modalEl.innerHTML = `
      <div style="background:#fff; border-radius:16px; padding:24px 20px; min-width:260px; box-shadow:0 4px 32px #0002; display:grid; gap:16px">
        <h3 style="font-size:1.2em; font-weight:800; margin-bottom:8px">Select Payment Method</h3>
        <div style="display:grid; gap:10px; margin-bottom:8px">
          <label><input type="radio" name="paymethod" value="Cash" checked> Cash</label>
          <label><input type="radio" name="paymethod" value="FPX"> FPX (Online Banking)</label>
          <label><input type="radio" name="paymethod" value="Credit Card"> Credit Card</label>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end">
          <button id="btnCancelPay" class="btn">Cancel</button>
          <button id="btnConfirmPay" class="btn primary">Pay Now</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
    modalEl.querySelector("#btnCancelPay").onclick = close;
    modalEl.querySelector("#btnConfirmPay").onclick = () => {
      const method = modalEl.querySelector('input[name="paymethod"]:checked').value;
      close();
      onConfirm && onConfirm(method);
    };
  }

  function close() {
    if (modalEl) {
      modalEl.remove();
      modalEl = null;
    }
  }

  return { open, close };
}
