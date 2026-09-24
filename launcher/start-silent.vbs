Set WshShell = CreateObject("WScript.Shell")
strCommand = "powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File ""D:\my_projects\aplikasi_rt\launcher\run-app.ps1"""
WshShell.Run strCommand, 0, False
