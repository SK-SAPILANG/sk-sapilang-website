$ErrorActionPreference = "Stop"
$files = Get-ChildItem -Path . -Recurse -Filter *.html -File | Where-Object { $_.FullName -notmatch '\\.git\\' }
foreach ($file in $files) {
  $text = Get-Content -LiteralPath $file.FullName -Raw
  if ($text -notmatch 'global-readability\.css') {
    if ($text -match '</head>') {
      $text = $text -replace '</head>', "<link rel=`"stylesheet`" href=`"$((Resolve-Path .).Path | Out-Null; 'global-readability.css')`">`r`n</head>"
      Set-Content -LiteralPath $file.FullName -Value $text -Encoding UTF8
      Write-Host "Updated: $($file.FullName)"
    }
  }
}
Write-Host "Done. Readability stylesheet linked to all HTML files."
