$source = "C:\Users\admn\Documents\git\youtube-shorts-factory\music"
$target = Join-Path $PSScriptRoot "..\music"

if (!(Test-Path $source)) {
  throw "Source music folder not found: $source"
}

New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -Path (Join-Path $source "*") -Destination $target -Recurse -Force
Write-Host "Music synced to $target"
