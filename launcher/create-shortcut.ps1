$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopPath "SI-WARGA RT.lnk"
$targetScript = "D:\my_projects\aplikasi_rt\launcher\start-silent.vbs"
$iconPath = "D:\my_projects\aplikasi_rt\public\app-icon.ico"
$workingDir = "D:\my_projects\aplikasi_rt"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$targetScript`""
$Shortcut.WorkingDirectory = $workingDir
$Shortcut.IconLocation = "$iconPath,0"
$Shortcut.Description = "Sistem Informasi Kependudukan RT 003 / RW 003 Istimewa (Otomatis Nyala & Mati)"
$Shortcut.Save()

Write-Host "Shortcut created successfully at: $shortcutPath"
Write-Host "Exists:" (Test-Path $shortcutPath)
