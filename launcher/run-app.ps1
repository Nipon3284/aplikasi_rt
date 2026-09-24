# ==============================================================================
# SI-WARGA RT: Desktop App Launcher (Otomatis Nyala & Otomatis Mati)
# ==============================================================================

$projectDir = "D:\my_projects\aplikasi_rt"
$port = 3000
$appUrl = "http://localhost:$port"
$profileDir = "$projectDir\.app_profile"

# 1. Fungsi Cek Apakah Server Next.js Sudah Siap
function Test-ServerReady {
    try {
        $req = [System.Net.WebRequest]::Create("http://localhost:$port/api/system-info")
        $req.Timeout = 1200
        $res = $req.GetResponse()
        $res.Close()
        return $true
    } catch {
        return $false
    }
}

# 2. Cek dan Jalankan Server Next.js jika Belum Aktif
$isReady = Test-ServerReady
if (-not $isReady) {
    # Jalankan server Next.js di latar belakang (Hidden)
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c npm run dev" `
        -WorkingDirectory $projectDir `
        -WindowStyle Hidden

    # Tunggu sampai server merespons (maksimal 40 detik)
    $attempts = 0
    while (-not (Test-ServerReady) -and $attempts -lt 40) {
        Start-Sleep -Milliseconds 800
        $attempts++
    }
}

# 3. Cari Browser (Microsoft Edge atau Google Chrome)
$browserExe = $null
$edgePaths = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
    "${env:LOCALAPPDATA}\Microsoft\Edge\Application\msedge.exe"
)
foreach ($p in $edgePaths) {
    if (Test-Path $p) {
        $browserExe = $p
        break
    }
}

if (-not $browserExe) {
    $chromePaths = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
    )
    foreach ($p in $chromePaths) {
        if (Test-Path $p) {
            $browserExe = $p
            break
        }
    }
}

# Fallback jika path tidak ditemukan di folder standar
if (-not $browserExe) {
    $browserExe = "msedge.exe"
}

# 4. Cari IP Lokal Wi-Fi untuk Notifikasi Akses HP
$localIp = "localhost"
try {
    $ipObj = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254*' 
    } | Select-Object -First 1
    if ($ipObj) {
        $localIp = $ipObj.IPAddress
    }
} catch {}

# 5. Tampilkan Notifikasi Sistem (Tray Balloon)
$notify = $null
try {
    Add-Type -AssemblyName System.Windows.Forms
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $iconPath = "$projectDir\public\app-icon.ico"
    if (Test-Path $iconPath) {
        $notify.Icon = New-Object System.Drawing.Icon($iconPath)
    } else {
        $notify.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($browserExe)
    }
    $notify.Visible = $true
    $notify.ShowBalloonTip(4000, "SI-WARGA RT Aktif", "Aplikasi siap digunakan.`nAkses dari HP: http://${localIp}:$port", [System.Windows.Forms.ToolTipIcon]::Info)
} catch {}

# 6. Jalankan Aplikasi dalam Mode App Window Mandiri
$browserArgs = @(
    "--app=$appUrl",
    "--window-size=1366,850",
    "--user-data-dir=$profileDir"
)

$browserProc = Start-Process -FilePath $browserExe -ArgumentList $browserArgs -PassThru

# 7. FITUR OTOMATIS MATI: Tunggu sampai jendela aplikasi ditutup oleh user
if ($browserProc) {
    $browserProc.WaitForExit()
}

# 8. Jendela Ditutup: Hentikan Server Next.js & Bersihkan Port 3000
try {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns.OwningProcess | Sort-Object -Unique
        foreach ($pidToKill in $pids) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
} catch {}

# 9. Hentikan Notifikasi Tray
if ($notify) {
    try {
        $notify.Visible = $false
        $notify.Dispose()
    } catch {}
}
