$apiRoutes = Get-ChildItem -Path "src/app/api" -Filter "route.ts" -Recurse

foreach ($route in $apiRoutes) {
    $content = [System.IO.File]::ReadAllText($route.FullName)
    
    # Skip if already has runtime config
    if ($content -match "export const runtime = 'nodejs'") {
        Write-Host "Skipping $($route.FullName) - already has runtime config"
        continue
    }
    
    # Find the first import statement
    $firstImport = $content -split "`n" | Where-Object { $_ -match "^import" } | Select-Object -First 1
    
    if ($firstImport) {
        $newContent = $content -replace [regex]::Escape($firstImport), "$firstImport`n`nexport const runtime = 'nodejs';`nexport const dynamic = 'force-dynamic';"
        [System.IO.File]::WriteAllText($route.FullName, $newContent)
        Write-Host "Added runtime config to $($route.FullName)"
    }
}

Write-Host "`nDone! Now run 'npm run build' to check for any remaining issues." 