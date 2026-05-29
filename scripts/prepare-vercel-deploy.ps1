$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$deploy = Join-Path $root "_deploy_clean"

if (Test-Path $deploy) {
  $resolvedDeploy = Resolve-Path $deploy
  if (-not $resolvedDeploy.Path.StartsWith($root.Path)) {
    throw "Deploy path is outside the workspace: $($resolvedDeploy.Path)"
  }
  Remove-Item -LiteralPath $resolvedDeploy.Path -Recurse -Force
}

New-Item -ItemType Directory -Path $deploy | Out-Null

foreach ($dir in @("app", "lib", "public", "supabase")) {
  Copy-Item -LiteralPath (Join-Path $root $dir) -Destination (Join-Path $deploy $dir) -Recurse -Force
}

New-Item -ItemType Directory -Path (Join-Path $deploy "assets\js") -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root "assets\js\data.js") -Destination (Join-Path $deploy "assets\js\data.js") -Force

foreach ($file in @("package.json", "package-lock.json", "next.config.ts", "tsconfig.json", "next-env.d.ts", ".env.example", ".vercelignore")) {
  Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $deploy $file) -Force
}

New-Item -ItemType Directory -Path (Join-Path $deploy ".vercel") -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root ".vercel\project.json") -Destination (Join-Path $deploy ".vercel\project.json") -Force

Add-Content -LiteralPath (Join-Path $deploy ".vercelignore") -Value "`n_deploy_clean/`nBase_Excel/`nbase_excel/`n*.xlsx"

Write-Output "Prepared clean Vercel deploy folder:"
Write-Output $deploy
