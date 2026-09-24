# ==============================================================================
# SI-WARGA RT: Native Desktop Launcher (Fast Startup, Loading Popup & Auto-Off)
# ==============================================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectDir = "D:\my_projects\aplikasi_rt"
$port = 3000
$appUrl = "http://localhost:$port"
$profileDir = "$projectDir\.app_profile"

# ------------------------------------------------------------------------------
# 1. TAMPILKAN POP-UP LOADING (SPLASH SCREEN) SECARA INSTAN (< 0.1 DETIK)
# ------------------------------------------------------------------------------
$splash = New-Object System.Windows.Forms.Form
$splash.Text = "SI-WARGA RT"
$splash.Size = New-Object System.Drawing.Size(430, 250)
$splash.StartPosition = "CenterScreen"
$splash.FormBorderStyle = "None"
$splash.BackColor = [System.Drawing.Color]::FromArgb(15, 23, 42) # Slate-900
$splash.TopMost = $true

# Bingkai Border Lembut
$splash.Add_Paint({
    param($sender, $e)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(51, 65, 85), 1.5) # Slate-700
    $e.Graphics.DrawRectangle($pen, 0, 0, $sender.Width - 1, $sender.Height - 1)
})

# Logo Aplikasi
$logoBox = New-Object System.Windows.Forms.PictureBox
$logoBox.Size = New-Object System.Drawing.Size(60, 60)
$logoBox.Location = New-Object System.Drawing.Point(185, 22)
$logoBox.SizeMode = "Zoom"
$logoPath = "$projectDir\public\logo.png"
if (Test-Path $logoPath) {
    try {
        $logoBox.Image = [System.Drawing.Image]::FromFile($logoPath)
    } catch {}
}
$splash.Controls.Add($logoBox)

# Judul Aplikasi
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "SI-WARGA RT"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::White
$titleLabel.TextAlign = "MiddleCenter"
$titleLabel.Size = New-Object System.Drawing.Size(410, 28)
$titleLabel.Location = New-Object System.Drawing.Point(10, 88)
$splash.Controls.Add($titleLabel)

# Status Teks Dinamis
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Menghubungkan ke sistem kependudukan..."
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184) # Slate-400
$statusLabel.TextAlign = "MiddleCenter"
$statusLabel.Size = New-Object System.Drawing.Size(410, 22)
$statusLabel.Location = New-Object System.Drawing.Point(10, 120)
$splash.Controls.Add($statusLabel)

# Progress Bar Berjalan
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Style = "Marquee"
$progressBar.MarqueeAnimationSpeed = 20
$progressBar.Size = New-Object System.Drawing.Size(330, 6)
$progressBar.Location = New-Object System.Drawing.Point(50, 155)
$splash.Controls.Add($progressBar)

# Catatan Subtitle
$noteLabel = New-Object System.Windows.Forms.Label
$noteLabel.Text = "Aplikasi akan otomatis terbuka sebentar lagi..."
$noteLabel.Font = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Italic)
$noteLabel.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139) # Slate-500
$noteLabel.TextAlign = "MiddleCenter"
$noteLabel.Size = New-Object System.Drawing.Size(410, 20)
$noteLabel.Location = New-Object System.Drawing.Point(10, 185)
$splash.Controls.Add($noteLabel)

# ------------------------------------------------------------------------------
# 2. DETEKSI BROWSER: Prioritaskan Google Chrome & Brave (Lebih Ringan & Cepat)
# ------------------------------------------------------------------------------
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
)
$bravePaths = @(
    "${env:ProgramFiles}\BraveSoftware\Brave-Browser\Application\brave.exe",
    "${env:ProgramFiles(x86)}\BraveSoftware\Brave-Browser\Application\brave.exe",
    "${env:LOCALAPPDATA}\BraveSoftware\Brave-Browser\Application\brave.exe"
)
$edgePaths = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
    "${env:LOCALAPPDATA}\Microsoft\Edge\Application\msedge.exe"
)

$browserExe = $null
$browserName = "Browser"

# Prioritas 1: Google Chrome (Ringan & Cepat di Windows)
foreach ($p in $chromePaths) {
    if (Test-Path $p) {
        $browserExe = $p
        $browserName = "Google Chrome"
        break
    }
}

# Prioritas 2: Brave Browser
if (-not $browserExe) {
    foreach ($p in $bravePaths) {
        if (Test-Path $p) {
            $browserExe = $p
            $browserName = "Brave"
            break
        }
    }
}

# Prioritas 3: Microsoft Edge
if (-not $browserExe) {
    foreach ($p in $edgePaths) {
        if (Test-Path $p) {
            $browserExe = $p
            $browserName = "Microsoft Edge"
            break
        }
    }
}

if (-not $browserExe) {
    $browserExe = "chrome.exe"
}

# ------------------------------------------------------------------------------
# 3. FUNGSI CEK SERVER READY & PRE-WARM HALAMAN
# ------------------------------------------------------------------------------
function Test-ServerReady {
    try {
        $req = [System.Net.WebRequest]::Create("http://localhost:$port/api/system-info")
        $req.Timeout = 1000
        $res = $req.GetResponse()
        $res.Close()
        return $true
    } catch {
        return $false
    }
}

# ------------------------------------------------------------------------------
# 4. LOGIKA BACKGROUND TIMER UNTUK BOOT SERVER & BUKA BROWSER
# ------------------------------------------------------------------------------
$serverStarted = $false
$browserProcess = $null
$stepCount = 0

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 400

$timer.Add_Tick({
    $stepCount++

    # Langkah 1: Cek apakah server sudah aktif
    $isReady = Test-ServerReady

    if (-not $isReady -and -not $serverStarted) {
        $statusLabel.Text = "Menyalakan server aplikasi..."
        $statusLabel.Refresh()

        # Nyalakan server Next.js di latar belakang
        Start-Process -FilePath "cmd.exe" `
            -ArgumentList "/c npm run dev" `
            -WorkingDirectory $projectDir `
            -WindowStyle Hidden

        $serverStarted = $true
        return
    }

    if (-not $isReady) {
        $statusLabel.Text = "Menyiapkan server & basis data ($stepCount)..."
        $statusLabel.Refresh()
        return
    }

    # Langkah 2: Server sudah aktif! Pre-warm dan buka browser
    $timer.Stop()
    $statusLabel.Text = "Membuka aplikasi di $browserName..."
    $statusLabel.Refresh()

    # Pre-warm halaman utama agar saat jendela terbuka langsung tampil tanpa loading
    try {
        $wc = New-Object System.Net.WebClient
        $null = $wc.DownloadString("http://localhost:$port")
        $wc.Dispose()
    } catch {}

    # Buka di mode App Window Mandiri
    $browserArgs = @(
        "--app=$appUrl",
        "--window-size=1366,850",
        "--user-data-dir=$profileDir"
    )

    $script:browserProcess = Start-Process -FilePath $browserExe -ArgumentList $browserArgs -PassThru

    # Tutup Pop-Up Splash Screen
    $splash.Close()
})

# Jalankan Timer dan Tampilkan Pop-Up Loading
$timer.Start()
$splash.ShowDialog() | Out-Null
$splash.Dispose()

# ------------------------------------------------------------------------------
# 5. FITUR OTOMATIS MATI: Tunggu sampai jendela aplikasi ditutup oleh user
# ------------------------------------------------------------------------------
if ($browserProcess) {
    # Menunggu pengguna mengklik tanda [X] silang pada jendela aplikasi
    $browserProcess.WaitForExit()
}

# ------------------------------------------------------------------------------
# 6. JENDELA DITUTUP -> HENTIKAN SERVER & BEBASKAN RAM SECARA TUNTAS
# ------------------------------------------------------------------------------
try {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns.OwningProcess | Sort-Object -Unique
        foreach ($pidToKill in $pids) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
} catch {}
