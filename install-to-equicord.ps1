param(
    [Parameter(Mandatory = $true)]
    [string] $EquicordPath
)

$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$pluginSource = Join-Path $projectRoot "src\userplugins\aiAssistant"
$equicordRoot = (Resolve-Path -LiteralPath $EquicordPath).Path
$packageJson = Join-Path $equicordRoot "package.json"
$targetRoot = Join-Path $equicordRoot "src\userplugins"
$pluginTarget = Join-Path $targetRoot "aiAssistant"

if (-not (Test-Path -LiteralPath $pluginSource)) {
    throw "Plugin source was not found: $pluginSource"
}

if (-not (Test-Path -LiteralPath $packageJson)) {
    throw "This does not look like an Equicord source folder because package.json was not found: $equicordRoot"
}

New-Item -ItemType Directory -Force -Path $pluginTarget | Out-Null
Get-ChildItem -LiteralPath $pluginSource | Copy-Item -Destination $pluginTarget -Recurse -Force

Write-Host "Installed aiAssistant to:"
Write-Host $pluginTarget
Write-Host ""
Write-Host "Now build Equicord from its source folder:"
Write-Host "  cd `"$equicordRoot`""
Write-Host "  corepack pnpm install"
Write-Host "  corepack pnpm build"
