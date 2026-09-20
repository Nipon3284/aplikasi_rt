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
  HeartCrack
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any | null>(null);

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

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner Selamat Datang */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistem Informasi Kependudukan RT 003 / RW 003 &quot;Istimewa&quot;</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Digitalisasi &amp; Manajemen Data Warga RT
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Kelola data Kartu Keluarga, validasi hasil scan berkas fisik fotokopi, pantau mutasi warga (pindah &amp; kematian), serta cetak surat pengantar secara instan.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
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
              <span>Daftar Data Warga</span>
            </Link>

            <Link
              href="/surat"
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Buat Surat Pengantar</span>
            </Link>
          </div>
        </div>

        {/* Official Logo RT Showcase */}
        <div className="relative z-10 shrink-0 flex flex-col items-center bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl group hover:border-amber-400/50 transition">
          <img 
            src="/logo.jpg" 
            alt="Logo RT 3 RW 3 Istimewa" 
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-xl drop-shadow-md"
          />
          <span className="mt-2 text-[10px] tracking-widest uppercase font-bold text-amber-300">
            RT 3 RW 3 ISTIMEWA
          </span>
        </div>
      </div>

      {/* Peringatan Antrean Scan Menunggu Verifikasi */}
      {stats?.totalPendingScan > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                Ada {stats.totalPendingScan} Berkas Scan KK Menunggu Verifikasi Manual Anda
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                Dokumen hasil scan fotokopi perlu diperiksa kesesuaian NIK dan namanya sebelum masuk ke database resmi.
              </p>
            </div>
          </div>

          <Link
            href="/scan"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shrink-0 text-center shadow flex items-center justify-center gap-1.5 transition"
          >
            <span>Periksa Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Grid Kartu Statistik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total KK */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Keluarga (KK)</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats?.totalKK ?? '-'}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>{stats?.hunian?.tetap || 0} Tetap</span>
            <span>•</span>
            <span>{stats?.hunian?.kontrak || 0} Kontrak</span>
          </div>
        </div>

        {/* Total Warga Aktif */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Warga Aktif</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {stats?.totalWargaAktif ?? '-'} <span className="text-sm font-normal text-slate-400">Jiwa</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>{stats?.demografi?.pria || 0} Laki-laki</span>
            <span>•</span>
            <span>{stats?.demografi?.wanita || 0} Perempuan</span>
          </div>
        </div>

        {/* Riwayat Kematian */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Catatan Kematian</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <HeartCrack className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {stats?.totalWargaMeninggal ?? '0'} <span className="text-sm font-normal text-slate-400">Jiwa</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Tercatat di Buku Register Kematian
          </div>
        </div>

        {/* Riwayat Pindah */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Warga Pindah Keluar</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats?.totalWargaPindah ?? '0'} <span className="text-sm font-normal text-slate-400">Jiwa</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Riwayat kepindahan keluar wilayah RT
          </div>
        </div>
      </div>

      {/* Bagian Statistik Demografi & Mutasi Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Breakdown Demografi Usia & Hunian */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Kelompok Usia Penduduk RT</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
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
