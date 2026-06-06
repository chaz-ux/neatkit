param(
    [int]$Port = 8000,
    [string]$Root = $PSScriptRoot,
    [string]$CloudflaredPath,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Get-PythonCommand {
    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        return @{ FilePath = $py.Source; Arguments = @('-3') }
    }

    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        return @{ FilePath = $python.Source; Arguments = @() }
    }

    throw 'Python 3 was not found in PATH. Install Python or the py launcher first.'
}

function Get-CloudflaredPath {
    param([string]$ExplicitPath)

    if ($ExplicitPath) {
        if (Test-Path $ExplicitPath) {
            return (Resolve-Path $ExplicitPath).Path
        }

        throw "Cloudflared was not found at the specified path: $ExplicitPath"
    }

    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    foreach ($path in @(
        'C:\Program Files\cloudflared\cloudflared.exe',
        'C:\Program Files (x86)\cloudflared\cloudflared.exe',
        "$env:LOCALAPPDATA\Programs\cloudflared\cloudflared.exe"
    )) {
        if (Test-Path $path) {
            return (Resolve-Path $path).Path
        }
    }

    throw 'Cloudflared was not found. Install it with Chocolatey, winget, or the official download.'
}

function Test-PortListening {
    param([int]$LocalPort)

    try {
        return [bool](Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction Stop)
    }
    catch {
        return $false
    }
}

function Start-DetachedProcess {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$OutputFile,
        [string]$ErrorFile
    )

    New-Item -ItemType File -Force -Path $OutputFile, $ErrorFile | Out-Null
    return Start-Process -FilePath $FilePath -ArgumentList $Arguments -RedirectStandardOutput $OutputFile -RedirectStandardError $ErrorFile -WindowStyle Hidden -PassThru
}

function Get-TunnelUrlFromLog {
    param(
        [string]$LogFile,
        [int]$TimeoutSeconds = 45
    )

    $pattern = 'https://[A-Za-z0-9.-]+\.trycloudflare\.com'
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        if (Test-Path $LogFile) {
            $content = Get-Content -Path $LogFile -ErrorAction SilentlyContinue
            foreach ($line in $content) {
                if ($line -match $pattern) {
                    return $Matches[0]
                }
            }
        }

        Start-Sleep -Seconds 1
    }

    return $null
}

$python = Get-PythonCommand
$cloudflaredExe = Get-CloudflaredPath -ExplicitPath $CloudflaredPath

$serverLog = Join-Path $Root 'python-server.log'
$serverErr = Join-Path $Root 'python-server.err.log'
$tunnelLog = Join-Path $Root 'cloudflared.log'
$tunnelErr = Join-Path $Root 'cloudflared.err.log'
$serverPidFile = Join-Path $Root 'python-server.pid'
$tunnelPidFile = Join-Path $Root 'cloudflared.pid'

$serverArgs = @() + $python.Arguments + @('-m', 'http.server', "$Port", '--bind', '127.0.0.1', '--directory', $Root)
$tunnelArgs = @('tunnel', '--url', "http://localhost:$Port")

if ($DryRun) {
    Write-Host "Python file: $($python.FilePath)"
    Write-Host "Python args : $($serverArgs -join ' ')"
    Write-Host "Cloudflared : $cloudflaredExe"
    Write-Host "Tunnel args  : $($tunnelArgs -join ' ')"
    Write-Host "Port $Port listening: $(Test-PortListening -LocalPort $Port)"
    exit 0
}

if (-not (Test-PortListening -LocalPort $Port)) {
    $serverProcess = Start-DetachedProcess -FilePath $python.FilePath -Arguments $serverArgs -OutputFile $serverLog -ErrorFile $serverErr
    Set-Content -Path $serverPidFile -Value $serverProcess.Id
    Start-Sleep -Seconds 2
}
else {
    Write-Host "Port $Port is already listening."
}

$tunnelProcess = Start-DetachedProcess -FilePath $cloudflaredExe -Arguments $tunnelArgs -OutputFile $tunnelLog -ErrorFile $tunnelErr
Set-Content -Path $tunnelPidFile -Value $tunnelProcess.Id

$url = Get-TunnelUrlFromLog -LogFile $tunnelLog

if ($url) {
    Write-Host "Public URL: $url"
    Write-Host "Local URL : http://localhost:$Port"
    Write-Host "PIDs      : server=$(Get-Content $serverPidFile -ErrorAction SilentlyContinue), cloudflared=$($tunnelProcess.Id)"
}
else {
    Write-Host 'Cloudflared started, but the public URL was not captured yet.'
    Write-Host "Check logs: $tunnelLog and $tunnelErr"
}
