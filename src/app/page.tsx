'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ScanLine, 
  UserCheck, 
  History, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  Baby, 
  Activity,
  HeartCrack,
  Smartphone,
  Wifi,
  Copy,
  Check,
  X,
  QrCode,
  Lock
} from 'lucide-react';
import QRCode from 'qrcode';

export default function DashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileInfo, setMobileInfo] = useState<{ localIp: string; mobileUrl: string } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const fetchAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setIsAdmin(data.authenticated && data.user?.role === 'ADMIN');
    } catch {
      setIsAdmin(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('/api/system-info');
      const data = await res.json();
      if (data.success && data.localIp && data.localIp !== '127.0.0.1') {
        setMobileInfo({
          localIp: data.localIp,
          mobileUrl: data.mobileUrl,
        });

        try {
          const qr = await QRCode.toDataURL(data.mobileUrl, {
            width: 300,
            margin: 1.5,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          setQrCodeDataUrl(qr);
        } catch (err) {
          console.error('Failed to generate QR code', err);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAuth();
    fetchStats();
    fetchSystemInfo();
  }, []);

  const handleCopyMobileUrl = () => {
    if (!mobileInfo?.mobileUrl) return;
    navigator.clipboard.writeText(mobileInfo.mobileUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner Selamat Datang */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistem Informasi Kependudukan RT 003 / RW 003 &quot;Istimewa&quot;</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Digitalisasi &amp; Manajemen Data Warga RT
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Kelola data Kartu Keluarga, validasi hasil scan berkas fisik fotokopi, pantau mutasi warga (pindah &amp; kematian), serta cetak surat pengantar secara instan.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            {isAdmin ? (
              <>
                <Link
                  href="/scan"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Scan Fotokopi KK Baru</span>
                </Link>

                <Link
                  href="/warga"
                  className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Database Warga (Lengkap)</span>
                </Link>

                <Link
                  href="/surat"
                  className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Buat Surat Pengantar</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/publik"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Buka Data Warga (Publik)</span>
                </Link>

                <Link
                  href="/login"
                  className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Masuk Portal Pengurus RT</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Showcase: Logo RT & QR Code Akses HP (Berdampingan dengan Keterangan Lengkap) */}
        <div className="relative z-10 shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-center gap-3">
          
          {/* Card 1: Logo RT 3 RW 3 Istimewa */}
          <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-xl group hover:border-amber-400/50 transition w-32 sm:w-36 h-48">
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              <img 
                src="/logo.jpg" 
                alt="Logo RT 3 RW 3 Istimewa" 
                className="max-w-full max-h-full object-contain rounded-xl drop-shadow-md group-hover:scale-105 transition"
              />
            </div>
            <span className="mt-3 text-[10px] tracking-widest uppercase font-bold text-amber-300 text-center">
              RT 3 RW 3 ISTIMEWA
            </span>
          </div>

          {/* Card 2: QR Code Akses HP (Lengkap dengan Keterangan) */}
          {mobileInfo && (
            <div className="flex flex-col items-center justify-between bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-emerald-500/40 shadow-xl group hover:border-emerald-400 transition w-36 sm:w-40 h-48 text-center">
              {/* Header Badge */}
              <div className="flex items-center gap-1 text-emerald-300 text-[11px] font-bold">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Akses dari HP</span>
              </div>

              {/* QR Image with click to zoom */}
              <div 
                onClick={() => setIsQrModalOpen(true)}
                className="cursor-pointer bg-white p-1 rounded-xl shadow-md border border-slate-200 hover:scale-105 transition group/qr relative"
                title="Klik untuk memperbesar QR Code"
              >
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code Akses HP" 
                    className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center bg-slate-100 rounded-lg">
                    <span className="text-[10px] text-slate-400">Memuat...</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-950/60 rounded-xl opacity-0 group-hover/qr:opacity-100 transition flex items-center justify-center text-white text-[9px] font-bold">
                  Perbesar
                </div>
              </div>

              {/* Keterangan & Action */}
              <div className="w-full space-y-1">
                <p className="text-[9px] text-slate-300 font-medium">
                  Scan via Kamera HP
                </p>

                {/* Tombol Salin URL */}
                <button
                  type="button"
                  onClick={handleCopyMobileUrl}
                  className="w-full py-1 px-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-[9px] rounded-lg font-mono flex items-center justify-center gap-1 transition"
                  title="Klik untuk salin alamat URL"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="font-semibold text-emerald-300">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="truncate">{mobileInfo.localIp}:3000</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1 text-[8px] text-slate-400">
                  <Wifi className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span>1 Jaringan Wi-Fi</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Perbesar QR Code */}
      {isQrModalOpen && mobileInfo && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-white shadow-2xl relative space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Akses Cepat dari Ponsel</span>
              </div>
              <h3 className="text-lg font-bold text-white pt-1">
                Scan QR Code SI-WARGA RT
              </h3>
              <p className="text-xs text-slate-400">
                Buka aplikasi langsung dari browser smartphone Anda
              </p>
            </div>

            {/* QR Box */}
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center justify-center mx-auto w-56 h-56">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code Akses HP Besar" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">Memuat QR...</span>
              )}
            </div>

            {/* Petunjuk Langkah-langkah */}
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <span>Pastikan HP terhubung ke Wi-Fi yang sama dengan laptop.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <span>Buka kamera HP atau pemindai QR, lalu arahkan ke layar.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <span>Ketuk notifikasi / link yang muncul untuk membuka aplikasi.</span>
              </div>
            </div>

            {/* Action Salin URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400">Alamat URL:</span>
                <span className="font-mono text-emerald-300 font-semibold">{mobileInfo.mobileUrl}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyMobileUrl}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Alamat Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-950" />
                    <span>Salin Alamat URL HP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Peringatan Antrean Scan Menunggu Verifikasi (Khusus Admin) */}
      {isAdmin && stats?.totalPendingScan > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                Ada {stats.totalPendingScan} Berkas Scan KK Menunggu Verifikasi Manual Anda
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Dokumen hasil scan fotokopi perlu diperiksa kesesuaian NIK dan namanya sebelum masuk ke database resmi.
              </p>
            </div>
          </div>
          <Link
            href="/scan"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition shrink-0 flex items-center justify-center gap-2"
          >
            <span>Periksa Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Grid Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total KK */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Keluarga (KK)
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats?.totalKK || 0}
            </div>
            <div className="text-[11px] text-slate-400">
              {stats?.statusKK?.tetap || 0} Tetap &bull; {stats?.statusKK?.kontrak || 0} Kontrak
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Warga Aktif */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Warga Aktif
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1.5">
              <span>{stats?.totalWarga || 0}</span>
              <span className="text-xs font-normal text-slate-400">Jiwa</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {stats?.gender?.laki || 0} Laki-laki &bull; {stats?.gender?.perempuan || 0} Perempuan
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Catatan Kematian */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Catatan Kematian
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1.5">
              <span>{stats?.totalMeninggal || 0}</span>
              <span className="text-xs font-normal text-slate-400">Jiwa</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Tercatat di Buku Register Kematian
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
            <HeartCrack className="w-6 h-6" />
          </div>
        </div>

        {/* Warga Pindah Keluar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Warga Pindah Keluar
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1.5">
              <span>{stats?.totalPindah || 0}</span>
              <span className="text-xs font-normal text-slate-400">Jiwa</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Riwayat kepindahan keluar wilayah RT
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Demografi & Peristiwa Terakhir */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Kelompok Usia */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Kelompok Usia Penduduk RT</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-slate-500 flex items-center gap-1 font-medium">
                <Baby className="w-4 h-4 text-sky-500" />
                <span>Balita (0 - 5 th)</span>
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats?.demografi?.balita || 0} Anak
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-slate-500 flex items-center gap-1 font-medium">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Anak (6 - 14 th)</span>
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats?.demografi?.anak || 0} Jiwa
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-slate-500 flex items-center gap-1 font-medium">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Usia Produktif (15 - 59 th)</span>
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats?.demografi?.produktif || 0} Jiwa
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-slate-500 flex items-center gap-1 font-medium">
                <Users className="w-4 h-4 text-purple-500" />
                <span>Lansia (&gt;= 60 th)</span>
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {stats?.demografi?.lansia || 0} Jiwa
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Log Peristiwa Mutasi Terkini */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Catatan Peristiwa Terakhir</span>
            </h3>
            <Link href="/mutasi" className="text-xs text-emerald-600 hover:underline font-semibold">
              Buku Mutasi Lengkap &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {!stats?.recentMutasi || stats.recentMutasi.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada peristiwa mutasi yang tercatat
              </div>
            ) : (
              stats.recentMutasi.map((m: any) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {m.nama_warga}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {m.keterangan || m.jenis_mutasi}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.jenis_mutasi === 'Kematian'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {m.jenis_mutasi}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {m.tanggal_kejadian}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
