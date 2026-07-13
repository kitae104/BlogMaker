param(
    [int]$Port = 0,
    [switch]$NoBrowser,
    [switch]$StopExisting
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

function Write-Step {
    param([string]$Message)
    Write-Host "[BlogMaker] $Message"
}

function Get-EnvPort {
    $envFile = Join-Path $ProjectRoot ".env"

    if (-not (Test-Path $envFile)) {
        return 4173
    }

    $portLine = Get-Content $envFile |
        Where-Object { $_ -match "^\s*PORT\s*=" } |
        Select-Object -First 1

    if (-not $portLine) {
        return 4173
    }

    $value = ($portLine -replace "^\s*PORT\s*=\s*", "").Trim().Trim('"').Trim("'")
    $parsed = 0

    if ([int]::TryParse($value, [ref]$parsed) -and $parsed -gt 0) {
        return $parsed
    }

    return 4173
}

function Get-ProcessOnPort {
    param([int]$TargetPort)

    $connection = Get-NetTCPConnection -LocalPort $TargetPort -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if (-not $connection) {
        return $null
    }

    return Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue
}

function Test-IsBlogMakerNodeProcess {
    param($ProcessInfo)

    if (-not $ProcessInfo) {
        return $false
    }

    $commandLine = [string]$ProcessInfo.CommandLine

    return $ProcessInfo.Name -match "^node(\.exe)?$" -and
        $commandLine.ToLowerInvariant().Contains("server.js")
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue

if (-not $nodeCommand) {
    Write-Host "Node.js was not found. Install Node.js 18 or later, then run this script again." -ForegroundColor Red
    exit 1
}

$nodeVersionText = (& node -v).Trim()
$nodeMajor = [int]($nodeVersionText.TrimStart("v").Split(".")[0])

if ($nodeMajor -lt 18) {
    Write-Host "Node.js 18 or later is required. Current version: $nodeVersionText" -ForegroundColor Red
    exit 1
}

$resolvedPort = if ($Port -gt 0) { $Port } else { Get-EnvPort }
$env:PORT = [string]$resolvedPort
$url = "http://127.0.0.1:$resolvedPort/"

Write-Step "Project root: $ProjectRoot"
Write-Step "Node version: $nodeVersionText"
Write-Step "URL: $url"

if (-not (Test-Path (Join-Path $ProjectRoot ".env"))) {
    Write-Host "[BlogMaker] .env was not found. Local template and Ollama can still run, but OpenAI needs OPENAI_API_KEY." -ForegroundColor Yellow
    Write-Host "[BlogMaker] Copy .env.example to .env and set OPENAI_API_KEY when you want to use OpenAI." -ForegroundColor Yellow
}

$portProcess = Get-ProcessOnPort -TargetPort $resolvedPort

if ($portProcess) {
    if (Test-IsBlogMakerNodeProcess $portProcess) {
        if ($StopExisting) {
            Write-Step "Stopping existing BlogMaker server process: $($portProcess.ProcessId)"
            Stop-Process -Id $portProcess.ProcessId -Force
            Start-Sleep -Milliseconds 400
        } else {
            Write-Step "BlogMaker is already running at $url"
            if (-not $NoBrowser) {
                Start-Process $url
            }
            exit 0
        }
    } else {
        Write-Host "Port $resolvedPort is already used by another process." -ForegroundColor Red
        Write-Host "ProcessId: $($portProcess.ProcessId)"
        Write-Host "Name: $($portProcess.Name)"
        Write-Host "CommandLine: $($portProcess.CommandLine)"
        Write-Host "Run with a different port, for example: .\run.ps1 -Port 4174"
        exit 1
    }
}

if (-not $NoBrowser) {
    Start-Process $url
}

Write-Step "Starting BlogMaker server. Press Ctrl+C to stop."
node server.js
