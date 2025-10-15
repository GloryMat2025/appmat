// src/widgets/TaxSummaryWidget.js
export function TaxSummaryWidget(rootEl, outlets) {
  rootEl.innerHTML = '<h3>Tax Summary</h3>';
  outlets.forEach(outlet => {
    const taxAmount = outlet.sales * outlet.taxRate;
    const div = document.createElement('div');
    div.innerHTML = `
      <h4>${outlet.name}</h4>
      <p>Sales: $${outlet.sales}</p>
      <p>Tax/VAT (${(outlet.taxRate * 100).toFixed(2)}%): $${taxAmount.toFixed(2)}</p>
    `;
    rootEl.appendChild(div);
  });
}
