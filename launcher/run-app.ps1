# ==============================================================================
# SI-WARGA RT: Native Desktop Launcher (Fast Startup, Non-blocking Splash & Auto-Off)
# ==============================================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectDir = "D:\my_projects\aplikasi_rt"
$port = 3000
$appUrl = "http://127.0.0.1:$port"
$profileDir = "$projectDir\.app_profile"
$iconPath = "$projectDir\public\app-icon.ico"
$logoPath = "$projectDir\public\logo.png"

# ------------------------------------------------------------------------------
# 1. FUNGSI CEK KONEKSI TCP PORT NON-BLOCKING (Super Cepat & Ringan)
# ------------------------------------------------------------------------------
function Test-PortReady {
    param([int]$targetPort = 3000)
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $ar = $tcp.BeginConnect([System.Net.IPAddress]::Loopback, $targetPort, $null, $null)
        $ready = $ar.AsyncWaitHandle.WaitOne(100, $false)
        if ($ready -and $tcp.Connected) {
            $tcp.EndConnect($ar)
            return $true
        }
        return $false
    } catch {
        return $false
    } finally {
        $tcp.Close()
        $tcp.Dispose()
    }
}

# ------------------------------------------------------------------------------
# 2. DETEKSI BROWSER: Prioritas Google Chrome (Ringan & Cepat)
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
$browserName = "Google Chrome"

foreach ($p in $chromePaths) {
    if (Test-Path $p) {
        $browserExe = $p
        $browserName = "Google Chrome"
        break
    }
}

if (-not $browserExe) {
    foreach ($p in $bravePaths) {
        if (Test-Path $p) {
            $browserExe = $p
            $browserName = "Brave"
            break
        }
    }
}

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

# Fungsi Pembantu untuk Meluncurkan Browser
function Open-AppBrowser {
    $browserArgs = @(
        "--app=$appUrl",
        "--window-size=1366,850",
        "--user-data-dir=$profileDir",
        "--no-first-run",
        "--no-default-browser-check"
    )
    return (Start-Process -FilePath $browserExe -ArgumentList $browserArgs -PassThru)
}

# ------------------------------------------------------------------------------
# 3. JIKA SERVER SUDAH AKTIF: LANGSUNG BUKA BROWSER TANPA POPUP (0 DETIK DELAY!)
# ------------------------------------------------------------------------------
if (Test-PortReady -targetPort $port) {
    $browserProcess = Open-AppBrowser
    if ($browserProcess) {
        $browserProcess.WaitForExit()
    }
    exit 0
}

# ------------------------------------------------------------------------------
# 4. TAMPILKAN POP-UP LOADING YANG RAMAH (BISA DITIMPA, ADA TOMBOL TUTUP & DRAGGABLE)
# ------------------------------------------------------------------------------
$splash = New-Object System.Windows.Forms.Form
$splash.Text = "SI-WARGA RT - Memuat"
$splash.Size = New-Object System.Drawing.Size(420, 240)
$splash.StartPosition = "CenterScreen"
$splash.FormBorderStyle = "None"
$splash.BackColor = [System.Drawing.Color]::FromArgb(15, 23, 42) # Slate-900

# PENTING: TopMost = $false agar pop-up BISA ditimpa oleh jendela aplikasi lain!
$splash.TopMost = $false
$splash.ShowInTaskbar = $true

if (Test-Path $iconPath) {
    try {
        $splash.Icon = New-Object System.Drawing.Icon($iconPath)
    } catch {}
}

# Fitur Geser Jendela (Draggable)
$splash.Add_MouseDown({
    param($s, $e)
    if ($e.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        $splash.Capture = $false
        $msg = [System.Windows.Forms.Message]::Create($splash.Handle, 0xA1, [System.IntPtr]2, [System.IntPtr]0)
        $splash.DefWndProc([ref]$msg)
    }
})

# Bingkai Border Halus
$splash.Add_Paint({
    param($sender, $e)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(51, 65, 85), 1.5) # Slate-700
    $e.Graphics.DrawRectangle($pen, 0, 0, $sender.Width - 1, $sender.Height - 1)
})

# Tombol Batal/Tutup [✕] di pojok kanan atas
$closeBtn = New-Object System.Windows.Forms.Label
$closeBtn.Text = "✕"
$closeBtn.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$closeBtn.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184) # Slate-400
$closeBtn.Size = New-Object System.Drawing.Size(26, 26)
$closeBtn.Location = New-Object System.Drawing.Point(385, 8)
$closeBtn.TextAlign = "MiddleCenter"
$closeBtn.Cursor = [System.Windows.Forms.Cursors]::Hand
$closeBtn.Add_MouseEnter({ $closeBtn.ForeColor = [System.Drawing.Color]::FromArgb(239, 68, 68) }) # Red-500
$closeBtn.Add_MouseLeave({ $closeBtn.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184) })
$closeBtn.Add_Click({
    $script:isCancelled = $true
    $timer.Stop()
    $splash.Close()
})
$splash.Controls.Add($closeBtn)

# Support Tombol ESC untuk batal
$splash.KeyPreview = $true
$splash.Add_KeyDown({
    param($s, $e)
    if ($e.KeyCode -eq [System.Windows.Forms.Keys]::Escape) {
        $script:isCancelled = $true
        $timer.Stop()
        $splash.Close()
    }
})

# Logo Aplikasi
$logoBox = New-Object System.Windows.Forms.PictureBox
$logoBox.Size = New-Object System.Drawing.Size(56, 56)
$logoBox.Location = New-Object System.Drawing.Point(182, 22)
$logoBox.SizeMode = "Zoom"
if (Test-Path $logoPath) {
    try {
        $logoBox.Image = [System.Drawing.Image]::FromFile($logoPath)
    } catch {}
}
$splash.Controls.Add($logoBox)

# Judul Aplikasi
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "SI-WARGA RT"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::White
$titleLabel.TextAlign = "MiddleCenter"
$titleLabel.Size = New-Object System.Drawing.Size(400, 26)
$titleLabel.Location = New-Object System.Drawing.Point(10, 84)
$splash.Controls.Add($titleLabel)

# Status Teks
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Menyalakan server kependudukan..."
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(148, 163, 184) # Slate-400
$statusLabel.TextAlign = "MiddleCenter"
$statusLabel.Size = New-Object System.Drawing.Size(400, 20)
$statusLabel.Location = New-Object System.Drawing.Point(10, 115)
$splash.Controls.Add($statusLabel)

# Progress Bar Bergerak
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Style = "Marquee"
$progressBar.MarqueeAnimationSpeed = 25
$progressBar.Size = New-Object System.Drawing.Size(320, 5)
$progressBar.Location = New-Object System.Drawing.Point(50, 148)
$splash.Controls.Add($progressBar)

# Catatan Petunjuk
$noteLabel = New-Object System.Windows.Forms.Label
$noteLabel.Text = "Membuka di Google Chrome (tekan ESC untuk batal)"
$noteLabel.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$noteLabel.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139) # Slate-500
$noteLabel.TextAlign = "MiddleCenter"
$noteLabel.Size = New-Object System.Drawing.Size(400, 18)
$noteLabel.Location = New-Object System.Drawing.Point(10, 178)
$splash.Controls.Add($noteLabel)

# ------------------------------------------------------------------------------
# 5. NYALAKAN SERVER SECARA ASINKRON & MONITOR KONEKSI
# ------------------------------------------------------------------------------
$serverStarted = $false
$script:isCancelled = $false
$script:browserProcess = $null
$elapsedQuarterSeconds = 0
$maxWaitTicks = 50 # Maksimal tunggu ~12.5 detik (failsafe)

# Mulai jalankan server Next.js di background
$serverProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev" `
    -WorkingDirectory $projectDir `
    -WindowStyle Hidden `
    -PassThru

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 250 # Cek setiap 250ms

$timer.Add_Tick({
    $elapsedQuarterSeconds++

    if ($script:isCancelled) {
        $timer.Stop()
        $splash.Close()
        return
    }

    # Cek apakah port 3000 sudah siap merespons TCP
    $isReady = Test-PortReady -targetPort $port

    if ($isReady -or ($elapsedQuarterSeconds -ge $maxWaitTicks)) {
        # Server siap atau sudah mencapai batas failsafe: BUKA BROWSER SEGERA!
        $timer.Stop()
        $statusLabel.Text = "Membuka aplikasi..."
        $statusLabel.Refresh()

        $script:browserProcess = Open-AppBrowser
        $splash.Close()
        return
    }

    # Update info status berkala
    if ($elapsedQuarterSeconds -eq 8) {
        $statusLabel.Text = "Menyiapkan modul database & API..."
    } elseif ($elapsedQuarterSeconds -eq 16) {
        $statusLabel.Text = "Hampir siap, menghubungkan ke browser..."
    }
})

$timer.Start()
$splash.ShowDialog() | Out-Null
$splash.Dispose()

# Jika pengguna membatalkan (klik X / ESC), matikan server yang baru dinyalakan
if ($script:isCancelled) {
    if ($serverProcess -and -not $serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    }
    exit 0
}

# ------------------------------------------------------------------------------
# 6. FITUR OTOMATIS MATI: Tunggu sampai jendela Google Chrome ditutup user
# ------------------------------------------------------------------------------
if ($script:browserProcess) {
    $script:browserProcess.WaitForExit()
}

# ------------------------------------------------------------------------------
# 7. JENDELA APLIKASI DITUTUP -> HENTIKAN SERVER & BEBASKAN RAM SECARA TUNTAS
# ------------------------------------------------------------------------------
try {
    # 1. Hentikan proses yang memegang port 3000
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns.OwningProcess | Sort-Object -Unique
        foreach ($pidToKill in $pids) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
} catch {}

# 2. Hentikan child process cmd yang kita buat
if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

# 3. Pastikan tidak ada proses node.exe aplikasi_rt yang tertinggal (Zombie Prevention)
try {
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like "*aplikasi_rt*" } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
} catch {}
