# 🧩 AppMat – Continuous Integration (CI) Overview

This document explains the structure, flow, and usage of the **Playwright Parity Matrix CI** workflow for the AppMat project.

---

## 🚀 Workflow Summary

### File
`.github/workflows/playwright-parity-matrix.yml`

### Triggers
- `push` to `main`
- `pull_request` to `main`
- `workflow_dispatch` (manual trigger)

### Jobs Overview
| Job Name | Purpose | Matrix |
|-----------|----------|--------|
| **build-and-test** | Exports Playwright PNG screenshots and builds the visual gallery. | OS × Node.js |
| **parity** | Runs browser-specific parity tests and posts PR comment summary. | Browsers |

---

## 🧭 CI Flow Diagram

```mermaid
flowchart TD
  A([🟢 Trigger]) -->|push / PR / manual| B[🏗️ build-and-test]
  B --> C[🧪 parity]
  C --> D[[📦 Output]]

  subgraph build-and-test
    B1[Checkout repo] --> B2[Setup Node + pnpm] --> B3[Install deps] --> B4[Export PNG] --> B5[Generate gallery.html] --> B6[Upload artifacts]
  end

  subgraph parity
    C1[Checkout repo] --> C2[Setup Node v22] --> C3[Install deps] --> C4[Run Playwright tests (chromium, firefox, webkit)] --> C5[Comment on PR (gallery + preview)]
  end

  subgraph Output
    D1[Artifacts: PNG + gallery.html]
    D2[PR comment: thumbnails + link]
  end
  D1 --> D2
