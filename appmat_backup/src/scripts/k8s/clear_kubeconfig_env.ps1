[CmdletBinding()]
param(
  [switch]$PersistUser,
  [switch]$PersistMachine,
  [switch]$All
)

function Broadcast-EnvChange {
  try {
    $sig = '[DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, int Msg, IntPtr wParam, string lParam, int fuFlags, int uTimeout, out IntPtr lpdwResult);'
    Add-Type -MemberDefinition $sig -Name 'Win32' -Namespace 'PInvoke' -ErrorAction SilentlyContinue | Out-Null
    # HWND_BROADCAST=0xFFFF, WM_SETTINGCHANGE=0x1A, SMTO_ABORTIFHUNG=0x2
    [void][PInvoke.Win32]::SendMessageTimeout([IntPtr]0xffff, 0x1A, [IntPtr]0, 'Environment', 2, 5000, [ref]([IntPtr]::Zero))
    Write-Host "Broadcasted environment change (WM_SETTINGCHANGE: Environment)."
  } catch {
    Write-Verbose "Broadcast failed: $_"
  }
}

if ($All) { $PersistUser = $true; $PersistMachine = $true }

try {
  Remove-Item Env:KUBECONFIG -ErrorAction SilentlyContinue
  Write-Host "Cleared KUBECONFIG for current PowerShell session."
} catch {}

$broadcastNeeded = $false

if ($PersistUser) {
  [Environment]::SetEnvironmentVariable("KUBECONFIG", $null, "User")
  Write-Host "Removed user-level KUBECONFIG."
  $broadcastNeeded = $true
}

if ($PersistMachine) {
  $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
  if (-not $isAdmin) {
    Write-Error "Admin rights required for machine-level removal. Re-run this script as Administrator (Run as admin)."
    exit 1
  }
  [Environment]::SetEnvironmentVariable("KUBECONFIG", $null, "Machine")
  Write-Host "Removed machine-level KUBECONFIG."
  $broadcastNeeded = $true
}

if ($broadcastNeeded) { Broadcast-EnvChange }

Write-Host "Done. Open new terminals for the change to take effect everywhere."
