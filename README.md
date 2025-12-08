# Decentralized Power Billing Frontend

Multi-page prototype dashboard showcasing the “Decentralized Power Billing System Using IoT and Ethereum Blockchain” concept.

## Features

- Real-time telemetry stream with synthetic IoT data
- Line chart summarizing recent power usage
- Billing ledger populated with tariff calculations
- Peer energy marketplace offers and compliance overview
- Dynamic tariff simulator with settlement timeline and alerts
- Dedicated pages for Overview, Real-Time, Market, Insights, Billing, Login, Account, Profile, and Checkout
- `billing.html` with filters, exports, and invoice preview
- `login.html` / `account.html` with social buttons and modern auth UI
- `profile.html` and `support.html` for account management and help center
- Connect Wallet button with MetaMask detection

## Getting Started

1. Open `index.html` in the project root (it redirects to `frontend/index.html`, whose nav links open the Overview, Real-Time, Market, Insights, Billing, Profile, Checkout, Login, and Account pages).
2. For live edits, use a simple dev server such as:
   - `npx serve frontend`
   - `python -m http.server --directory frontend`

## Customization Ideas

- Wire telemetry to actual MQTT/WebSocket feeds.
- Replace synthetic billing entries with smart-contract calls.
- Extend the “View Smart Contract” CTA to link to a block explorer.

