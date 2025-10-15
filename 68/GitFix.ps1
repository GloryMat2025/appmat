param(
  [switch]$GenerateSshKey
)

$ErrorActionPreference = "Stop"
$log = Join-Path -Path $PSScriptRoot -ChildPath "git-doctor.log"
function Log($m){ $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"); "$ts  $m" | Tee-Object -FilePath $log -Append }

Log "=== Git Doctor start ==="
Log "Host: $env:COMPUTERNAME, User: $env:USERNAME, OS: $([Environment]::OSVersion.VersionString)"

# 0) Ensure TLS 1.2+
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
  Log "TLS set to Tls12/Tls13"
} catch { Log "TLS set failed: $($_.Exception.Message)" }

# 1) Check Git presence
function Get-GitVersion {
  try {
    $v = (& git --version) 2>$null
    if ($LASTEXITCODE -eq 0 -and $v) { return $v.Trim() }
  } catch {}
  return $null
}
$gitVersion = Get-GitVersion
if (-not $gitVersion) {
  Log "Git not found. Attempting install via winget..."
  try {
    $wingetOK = (Get-Command winget -ErrorAction SilentlyContinue) -ne $null
    if ($wingetOK) {
      Log "Installing Git (winget Git.Git)"
      & winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements --silent
    } else {
      Log "winget not available; trying Chocolatey (requires admin, choco installed)"
      if (Get-Command choco -ErrorAction SilentlyContinue) {
        & choco install git -y --no-progress
      } else {
        Log "Chocolatey not found. Please install Git for Windows manually from the official site."
        throw "Package manager not available."
      }
    }
  } catch {
    Log "Install failed: $($_.Exception.Message)"
  }
  $gitVersion = Get-GitVersion
}

if ($gitVersion) {
  Log "Git detected: $gitVersion"
} else {
  Log "Git still not detected after install attempt."
}

# 2) Ensure PATH has Git\cmd
$gitCmd = $null
try {
  $gitCmd = (Get-Command git -ErrorAction SilentlyContinue).Source
  if ($gitCmd) { Log "git.exe at $gitCmd" } else { Log "git.exe still not resolvable in PATH" }
} catch { Log "Get-Command git failed: $($_.Exception.Message)" }

# 3) CA cert bundle sanity
try {
  $sysCA = (git config --system http.sslcainfo) 2>$null
  $mingwCA = Join-Path -Path (Split-Path -Parent $gitCmd) -ChildPath "..\mingw64\ssl\certs\ca-bundle.crt"
  $mingwCA = (Resolve-Path $mingwCA -ErrorAction SilentlyContinue)
  if (-not [string]::IsNullOrEmpty($sysCA)) {
    Log "System http.sslcainfo: $sysCA"
  } elseif ($mingwCA) {
    Log "Setting system http.sslcainfo -> $mingwCA"
    git config --system http.sslcainfo "$mingwCA"
  } else {
    Log "Unable to resolve mingw64 CA bundle; skipping system CA fix"
  }
} catch { Log "CA bundle check failed: $($_.Exception.Message)" }

# 4) Proxy sanity
try {
  $gProxy = (git config --global --get http.proxy) 2>$null
  if ($gProxy) {
    Log "Global proxy detected: $gProxy"
    # If user set NO_PROXY we respect it; otherwise offer to clear for test clone
  } else {
    Log "No global http.proxy set"
  }
} catch { Log "Proxy check failed: $($_.Exception.Message)" }

# 5) DNS/Network smoke test
try {
  $t = Test-NetConnection github.com -Port 443
  Log "Test-NetConnection github.com:443 -> TcpTestSucceeded=$($t.TcpTestSucceeded) IP=$($t.RemoteAddress)"
} catch { Log "Test-NetConnection failed: $($_.Exception.Message)" }

# 6) HTTPS request smoke
try {
  $resp = Invoke-WebRequest https://github.com -Method Head -TimeoutSec 20
  Log "Invoke-WebRequest github.com -> StatusCode=$($resp.StatusCode)"
} catch { Log "Invoke-WebRequest error: $($_.Exception.Message)" }

# 7) Safe public clone test
$work = Join-Path $env:TEMP ("gitdoctor-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $work | Out-Null
Set-Location $work
Log "Work dir: $work"

$testRepo = "https://github.com/octocat/Hello-World.git"
try {
  Log "Attempting clone: $testRepo"
  git clone --depth=1 $testRepo 2>&1 | Tee-Object -FilePath $log -Append
  if ($LASTEXITCODE -eq 0) {
    Log "Clone OK"
  } else {
    Log "Clone exit code: $LASTEXITCODE"
  }
} catch { Log "Clone threw: $($_.Exception.Message)" }

# 8) Optional SSH key
if ($GenerateSshKey) {
  try {
    $sshDir = Join-Path $env:USERPROFILE ".ssh"
    if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Force -Path $sshDir | Out-Null }
    $keyPath = Join-Path $sshDir "id_ed25519"
    if (-not (Test-Path $keyPath)) {
      Log "Generating SSH key (ed25519)"
      ssh-keygen -t ed25519 -C "$($env:USERNAME)@$(hostname)" -f $keyPath -N ""
    } else {
      Log "SSH key already exists at $keyPath"
    }
    $pub = Get-Content ($keyPath + ".pub") -Raw
    Log "SSH public key:\n$pub"
    Write-Host "`n==== COPY THIS PUBLIC KEY TO YOUR GIT HOST (GitHub/GitLab) ====`n"
    Write-Host $pub
  } catch { Log "SSH keygen failed: $($_.Exception.Message)" }
}

# 9) Summarize
Write-Host "`n========= SUMMARY ========="
Write-Host "Git: $gitVersion"
Write-Host "git.exe: $gitCmd"
try {
  $currentProxy = (git config --global --get http.proxy) 2>$null
  if ($currentProxy) { Write-Host "Global proxy: $currentProxy" } else { Write-Host "Global proxy: (none)" }
} catch { }
Write-Host "Connectivity to github.com: see $log"
Write-Host "Clone test folder: $work"
Write-Host "Full log: $log"
Write-Host "===========================`n"

Log "=== Git Doctor end ==="