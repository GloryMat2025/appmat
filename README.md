
# appmat scaffold (HTML + CSS + JS)
Lightweight structure for static/PWA builds. Tailwind can be added later; current CSS is minimal utility-like.

## Structure
- `index.html` launcher
- `pages/` Home, Menu, Rewards, Cart, Checkout, Account
- `components/` header/footer + modals (delivery, pickup, product-detail)
- `assets/` css/js/img
- `data/` sample JSON (products, outlets)

## Dev tips
Serve with any static server (VS Code Live Server, `npx http-server`). Component injection expects absolute paths (`/components/...`). If your server serves from subpath, change links to relative `components/...` or use a base tag.
