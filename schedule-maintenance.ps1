# schedule-maintenance.ps1
$TaskName = "AppMat Orchestrator Weekly Run"
$ScriptPath = Join-Path (Get-Location) "auto-fix-orchestrator.ps1"
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 9am
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`""
Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName $TaskName -Description "Weekly auto-maintenance run for AppMat" -RunLevel Highest
Write-Host "✅ Scheduled task '$TaskName' registered."
