$desktop = [Environment]::GetFolderPath("Desktop")
$target = Join-Path $PSScriptRoot "..\start-yt-vid.bat"
$shortcut = Join-Path $desktop "yt-vid.lnk"
$shell = New-Object -ComObject WScript.Shell
$link = $shell.CreateShortcut($shortcut)
$link.TargetPath = (Resolve-Path $target)
$link.WorkingDirectory = (Resolve-Path (Join-Path $PSScriptRoot ".."))
$link.Save()
