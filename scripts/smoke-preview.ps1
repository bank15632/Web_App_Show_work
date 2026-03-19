$ErrorActionPreference = "Stop"

$logDir = Join-Path $PSScriptRoot "..\.codex-artifacts"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logPath = Join-Path $logDir "preview.log"

if (Test-Path $logPath) {
  Remove-Item $logPath -Force
}

$job = Start-Job -ScriptBlock {
  param($workdir, $logFile)
  Set-Location $workdir
  npm run preview *> $logFile
} -ArgumentList (Resolve-Path (Join-Path $PSScriptRoot "..")), $logPath

$healthy = $false
$attempt = 0

while (-not $healthy -and $attempt -lt 24) {
  Start-Sleep -Seconds 10
  $attempt++

  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8787/todos" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
      $healthy = $true
    }
  } catch {
    if ($job.State -match "Failed|Completed|Stopped") {
      break
    }
  }
}

Stop-Job $job | Out-Null
Receive-Job $job -Keep | Out-Null
Remove-Job $job

if (Test-Path $logPath) {
  Get-Content $logPath
}

if (-not $healthy) {
  throw "Preview server did not report a healthy startup."
}
