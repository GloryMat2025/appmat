# ================================
#   APPMAT 2025 FULL PROJECT SETUP
#   By ChatGPT
# ================================

Write-Host "🚀 Creating AppMat Project Structure..."

$root = "appmat"
New-Item -ItemType Directory -Path $root -Force | Out-Null

# === Helper function to create files
function Write-File {
    param(
        [string]$Path,
        [string]$Content
    )
    $folder = Split-Path $Path
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
    $Content | Out-File -FilePath $Path -Encoding UTF8 -Force
}

# ========================
# ROOT FILES
# ========================
Write-File "$root\README.md" @"
# 🍽️ AppMat — Mobile Ordering Platform (2025 Edition)

AppMat is a modern food ordering system with:
- Supabase backend
- Push notification relay
- Claude Sonnet 4.5 AI model fallback
- Kubernetes CI/CD rollout
- Enterprise documentation
"@

Write-File "$root\package.json" '{"name":"appmat","version":"1.0.0"}'
Write-File "$root\tsconfig.json" '{ "compilerOptions": { "target": "ES2020" } }'
Write-File "$root\vite.config.js" 'export default {};'

# ========================
# SRC / SERVICES / MODEL
# ========================
Write-File "$root\src\services\model\callModel.ts" @"
import axios from "axios";

export async function callModel(model: string, input: string) {
  const res = await axios.post(
    process.env.MODEL_API_URL!,
    { model, input },
    {
      headers: {
        Authorization: `Bearer ${process.env.MODEL_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );
  return res.data;
}
"@

Write-File "$root\src\services\model\fallback.ts" @"
import { callModel } from './callModel';

const PRIMARY = "claude-sonnet-4.5";
const SECONDARY = "claude-sonnet-3.7";
const TERTIARY = "gpt-4.1-mini";

export async function runModel(input: string) {
  try {
    return await callModel(PRIMARY, input);
  } catch {
    try {
      return await callModel(SECONDARY, input);
    } catch {
      return await callModel(TERTIARY, input);
    }
  }
}
"@

Write-File "$root\src\services\model\index.ts" 'export { runModel } from "./fallback";'

# ========================
# SRC / SERVICES / SUPABASE
# ========================
Write-File "$root\src\services\supabase\client.ts" @"
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
"@

Write-File "$root\src\services\supabase\orders.ts" @"
import { supabase } from './client';

export async function getOrders(userId: string) {
  return supabase.from("orders").select("*").eq("user_id", userId);
}
"@

Write-File "$root\src\services\supabase\users.ts" 'import { supabase } from "./client";'

# ========================
# PUSH SERVICE
# ========================
Write-File "$root\src\services\push\registerDevice.ts" "export async function registerDeviceToken() {}"
Write-File "$root\src\services\push\listener.ts" "export function initPushListener() {}"
Write-File "$root\src\services\push\notify.ts" "export async function notify() {}"
Write-File "$root\src\services\push\subscribe.ts" "export async function subscribeToOrder() {}"

# ========================
# UTILS
# ========================
Write-File "$root\src\services\utils\currency.ts" 'export function formatMYR(x){ return "RM "+x.toFixed(2); }'
Write-File "$root\src\services\utils\time.ts" 'export function formatTimestamp(t){ return new Date(t).toLocaleString("ms-MY"); }'
Write-File "$root\src\services\utils\formatter.ts" 'export const cap = s => s[0].toUpperCase()+s.slice(1);'

# ========================
# SCRIPTS
# ========================
Write-File "$root\scripts\model-tests\test-sonnet.sh" "#!/bin/bash"
Write-File "$root\scripts\model-tests\postman_claude_test.json" "{}"
Write-File "$root\scripts\model-tests\README.md" "Model Test Tools"

Write-File "$root\scripts\k8s\apply_patch.sh" "#!/bin/bash"
Write-File "$root\scripts\k8s\rollback.sh" "#!/bin/bash"
Write-File "$root\scripts\k8s\verify_rollout.sh" "#!/bin/bash"

Write-File "$root\scripts\smoke\smoke_test.sh" "#!/bin/bash curl -s \$1"
Write-File "$root\scripts\smoke\healthcheck.sh" "#!/bin/bash curl -s \$1/health"

Write-File "$root\scripts\utils\color.sh" "export GREEN=1"
Write-File "$root\scripts\utils\format_json.sh" "#!/bin/bash jq . \$1"
Write-File "$root\scripts\utils\diag.sh" "#!/bin/bash kubectl get pods -A"

# ========================
# DOCS
# ========================
Write-File "$root\docs\api\orders.md" "# Orders API"
Write-File "$root\docs\api\payments.md" "# Payments API"
Write-File "$root\docs\feature-flags\claude-sonnet-4.5.md" "# Feature Flag"
Write-File "$root\docs\architecture\high-level.md" "# High Level Architecture"

Write-Host "✅ AppMat 2025 folder successfully created!"
