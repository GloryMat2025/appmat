// src/widgets/HeatmapWidget.js
export function HeatmapWidget(rootEl, salesByHour) {
  rootEl.innerHTML = '';
  rootEl.style.display = 'grid';
  rootEl.style.gridTemplateColumns = 'repeat(4, 50px)';
  rootEl.style.gridGap = '5px';

  for (let hour = 0; hour < 24; hour++) {
    const count = salesByHour[hour] || 0;
    const colorIntensity = Math.min(255, count * 20);
    const color = `rgb(255, ${255 - colorIntensity}, ${255 - colorIntensity})`;

    const cell = document.createElement('div');
    cell.style.width = '50px';
    cell.style.height = '50px';
    cell.style.backgroundColor = color;
    cell.title = `Hour ${hour}: ${count} sales`;
    cell.style.display = 'flex';
    cell.style.alignItems = 'center';
    cell.style.justifyContent = 'center';
    cell.style.borderRadius = '8px';
    cell.style.fontWeight = 'bold';

    cell.innerHTML = `<span style="font-size:12px;">${hour}</span>`;
    rootEl.appendChild(cell);
  }
}
