param(
  [int]$Port = 4020,
  [int]$StartTimeoutSec = 10
)

<#
  supabase/tools/push-relay/smoke-test.ps1

  Starts the local push-relay on the specified port, checks `/health`,
  posts a simulated `api/notify` payload and an `order-status` payload,
  then stops the server. Intended for local developer smoke checks.

  Usage:
    pwsh -File .\supabase\tools\push-relay\smoke-test.ps1 -Port 4020
#>

Set-StrictMode -Version Latest

$wd = Join-Path (Get-Location) 'supabase\tools\push-relay'
Write-Host "Working directory: $wd"

if (-not (Test-Path $wd)) {
  Write-Error "Push-relay directory not found: $wd"
  exit 2
}

Push-Location $wd
try {
  $cmd = "set PORT=$Port && node index.js"
  Write-Host "Starting relay with: cmd /c $cmd"
  $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $cmd -WorkingDirectory $wd -PassThru

  $started = $false
  $deadline = (Get-Date).AddSeconds($StartTimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $res = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
      if ($res -and $res.ok) { $started = $true; break }
    } catch { Start-Sleep -Seconds 1 }
  }

  if (-not $started) {
    Write-Error "Relay did not become ready within $StartTimeoutSec seconds. See relay.log for details."
    if (Test-Path "$wd\relay.log") { Get-Content "$wd\relay.log" -Tail 200 }
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    exit 3
  }

  Write-Host "Relay is up on port $Port"

  # Health
  try {
    $health = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method Get -ErrorAction Stop
    Write-Host "HEALTH:" (ConvertTo-Json $health -Compress)
  } catch {
    Write-Error "Health check failed: $_"
  }

  # Simulated notify
  $notifyBody = @{
    subscription = @{ endpoint = 'https://example.com/fake-sub'; keys = @{ p256dh = 'BAbCdEfGhIjKlMnOpQrStUvWxY'; auth = 'abcd1234' } }
    message = @{ title = 'Smoke Test'; body = 'Simulated notify' }
  } | ConvertTo-Json -Depth 5

  try {
    $notifyRes = Invoke-RestMethod -Uri "http://localhost:$Port/api/notify" -Method Post -ContentType 'application/json' -Body $notifyBody -ErrorAction Stop
    Write-Host "NOTIFY:" (ConvertTo-Json $notifyRes -Compress)
  } catch {
    Write-Error "Notify request failed: $_"
  }

  # Order status
  $orderBody = @{ order_id = 555; status = 'processing' } | ConvertTo-Json
  try {
    $orderRes = Invoke-RestMethod -Uri "http://localhost:$Port/order-status" -Method Post -ContentType 'application/json' -Body $orderBody -ErrorAction Stop
    Write-Host "ORDER-STATUS:" (ConvertTo-Json $orderRes -Compress)
  } catch {
    Write-Error "Order-status request failed: $_"
  }

} finally {
  # Stop the process we started
  if ($proc -and $proc.Id) {
    Write-Host "Stopping relay (pid $($proc.Id))"
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  }
  Pop-Location
}

Write-Host "Smoke test finished."
Param(
  [int]$Port = 4020,
  [int]$WaitSeconds = 1
)

Set-StrictMode -Version Latest

Write-Host "Smoke test: starting push-relay on port $Port (logs -> relay.smoketest.log)"

# Ensure working directory is the push-relay directory
Push-Location -Path $PSScriptRoot

try {
  $env:PORT = $Port

  # Start node process and capture PID
  $proc = Start-Process -FilePath node -ArgumentList 'index.js' -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden
  if (-not $proc) { throw "Failed to start node process" }
  Write-Host "Started node (PID=$($proc.Id)), waiting $WaitSeconds seconds for startup..."
  Start-Sleep -Seconds $WaitSeconds

  $results = @{}

  # Health check
  try {
    $health = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method Get -ErrorAction Stop
    $results.health = $health
    Write-Host "HEALTH: OK -> $(ConvertTo-Json $health -Compress)"
  } catch {
    $results.health = @{ error = $_.Exception.Message }
    Write-Host "HEALTH: FAIL -> $($_.Exception.Message)"
  }

  # Simulated notify (no secrets required) - non-destructive
  $notifyBody = @{ subscription = @{ endpoint = 'https://example.com/fake-sub'; keys = @{ p256dh = 'BAbCdEfGhIjKlMnOpQrStUvWxY'; auth = 'abcd1234' } }; message = @{ title = 'Smoke Test'; body = 'Simulated notify' } } | ConvertTo-Json -Compress
  try {
    $notify = Invoke-RestMethod -Uri "http://localhost:$Port/api/notify" -Method Post -ContentType 'application/json' -Body $notifyBody -ErrorAction Stop
    $results.notify = $notify
    Write-Host "NOTIFY: OK -> $(ConvertTo-Json $notify -Compress)"
  } catch {
    $results.notify = @{ error = $_.Exception.Message }
    Write-Host "NOTIFY: FAIL -> $($_.Exception.Message)"
  }

  # Order-status endpoint
  $orderBody = @{ order_id = 555; status = 'processing' } | ConvertTo-Json -Compress
  try {
    $order = Invoke-RestMethod -Uri "http://localhost:$Port/order-status" -Method Post -ContentType 'application/json' -Body $orderBody -ErrorAction Stop
    $results.order = $order
    Write-Host "ORDER-STATUS: OK -> $(ConvertTo-Json $order -Compress)"
  } catch {
    $results.order = @{ error = $_.Exception.Message }
    Write-Host "ORDER-STATUS: FAIL -> $($_.Exception.Message)"
  }

  # Persist human-readable log for review
  $results | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $PSScriptRoot 'relay.smoketest.log') -Encoding utf8

} finally {
  # Stop the process we started (if running)
  try {
    if ($proc -and -not $proc.HasExited) {
      Write-Host "Stopping node (PID=$($proc.Id))..."
      Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {
    Write-Host "Failed to stop process: $($_.Exception.Message)"
  }
  Pop-Location
}

Write-Host "Smoke test finished. Log: supabase/tools/push-relay/relay.smoketest.log"
