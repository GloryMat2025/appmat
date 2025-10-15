// src/widgets/InventoryWidget.js
export function InventoryWidget(rootEl, salesData, inventory) {
  // Clone inventory to avoid mutating the original object
  const inv = { ...inventory };

  // Calculate depletion
  salesData.forEach(sale => {
    for (const [ingredient, amount] of Object.entries(sale.ingredients)) {
      inv[ingredient] = (inv[ingredient] || 0) - amount * sale.quantity;
    }
  });

  // Render inventory
  rootEl.innerHTML = '<h3>Inventory Levels</h3>';
  for (const [ingredient, quantity] of Object.entries(inv)) {
    const div = document.createElement('div');
    div.innerHTML = `${ingredient}: ${quantity}`;
    rootEl.appendChild(div);
  }
}
