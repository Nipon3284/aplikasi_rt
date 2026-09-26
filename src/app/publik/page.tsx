'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Baby, 
  UserCheck, 
  Sparkles, 
  ArrowUpDown, 
  X, 
  Grid, 
  List, 
  Lock, 
  HeartHandshake, 
  BarChart2, 
  Info,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

interface WargaItem {
  id: string;
  nama_lengkap: string;
  jenis_kelamin: 'LAKI-LAKI' | 'PEREMPUAN';
  umur: number;
  kategori_usia: 'Balita' | 'Anak & Remaja' | 'Dewasa' | 'Lansia';
  status_warga: string;
}

interface StatsData {
  totalWarga: number;
  totalKK: number;
  totalPria: number;
  totalWanita: number;
  totalBalita: number;
  totalAnak: number;
  totalDewasa: number;
  totalLansia: number;
  rataRataUmur: number;
}

export default function WebTampilanWargaPage() {
  const [wargaList, setWargaList] = useState<WargaItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [selectedGender, setSelectedGender] = useState<string>('SEMUA');
  const [sortBy, setSortBy] = useState<'nama-asc' | 'nama-desc' | 'umur-asc' | 'umur-desc'>('nama-asc');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Interactive Modal Profil Warga
  const [activeModalWarga, setActiveModalWarga] = useState<WargaItem | null>(null);

  // Fetch data aman dari API Publik
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/publik/warga');
        const json = await res.json();
        if (json.success) {
          setWargaList(json.data || []);
          setStats(json.stats || null);
        }
      } catch (err) {
        console.error('Gagal mengambil data publik:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter and Sort logic
  const filteredWarga = useMemo(() => {
    return wargaList
      .filter((item) => {
        // Search filter
        const matchSearch = item.nama_lengkap
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        // Category filter
        const matchCategory =
          selectedCategory === 'SEMUA' || item.kategori_usia === selectedCategory;

        // Gender filter
        const matchGender =
          selectedGender === 'SEMUA' || item.jenis_kelamin === selectedGender;

        return matchSearch && matchCategory && matchGender;
      })
      .sort((a, b) => {
        if (sortBy === 'nama-asc') return a.nama_lengkap.localeCompare(b.nama_lengkap);
        if (sortBy === 'nama-desc') return b.nama_lengkap.localeCompare(a.nama_lengkap);
        if (sortBy === 'umur-asc') return a.umur - b.umur;
        if (sortBy === 'umur-desc') return b.umur - a.umur;
        return 0;
      });
  }, [wargaList, searchQuery, selectedCategory, selectedGender, sortBy]);

  // Color helper based on name initials
  const getAvatarGradient = (name: string, gender: string) => {
    if (gender === 'PEREMPUAN') {
      return 'from-pink-500 to-rose-600 text-white';
    }
    return 'from-emerald-500 to-teal-700 text-white';
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case 'Balita':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300';
      case 'Anak & Remaja':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300';
      case 'Dewasa':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300';
      case 'Lansia':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* 🌟 HERO & WELCOME BANNER (Sangat Cantik di Mobile & Desktop) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 border-b border-emerald-900/40 text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            
            {/* Logo & Judul Lingkungan */}
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Portal Publik Transparansi Warga RT 003 / RW 003</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Data Kependudukan Warga RT
              </h1>
              
              <p className="text-sm text-slate-300 leading-relaxed">
                Halaman informasi kependudukan warga RT 003 / RW 003 Dusun Tambaksari Kidul. Menampilkan demografi warga secara transparan dan ramah keluarga.
              </p>

              {/* Jaminan Privasi Data (UU PDP) */}
              <div className="inline-flex items-start gap-2 text-xs bg-slate-800/80 border border-slate-700/80 px-3.5 py-2.5 rounded-xl text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Perlindungan Privasi Terjamin:</strong> Sesuai UU PDP No. 27/2022, data yang ditampilkan ke publik <u>hanya mencakup Nama Lengkap &amp; Usia</u>. NIK, No KK, dan alamat rahasia tersimpan aman di sistem pengurus RT.
                </span>
              </div>
            </div>

            {/* Tombol Akses Portal Pengurus RT */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
              <Link
                href="/warga"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Lock className="w-4 h-4" />
                <span>Portal Pengurus RT (Admin)</span>
              </Link>
              <span className="text-[11px] text-slate-400 text-center md:text-right">
                Akses penuh input scan KK &amp; cetak surat
              </span>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* 📊 INTERACTIVE STATS CARDS (Bisa Di-klik untuk Langsung Filter!) */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* Total Warga */}
            <button
              onClick={() => { setSelectedCategory('SEMUA'); setSelectedGender('SEMUA'); }}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 col-span-2 sm:col-span-2 ${
                selectedCategory === 'SEMUA' && selectedGender === 'SEMUA'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/50'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">Total Warga Aktif</span>
                <Users className="w-5 h-5 opacity-90" />
              </div>
              <div className="text-3xl font-black mt-2 font-mono">{stats.totalWarga}</div>
              <div className="text-[11px] opacity-75 mt-1">
                {stats.totalKK} Kepala Keluarga &bull; Rata-rata usia {stats.rataRataUmur} th
              </div>
            </button>

            {/* Balita */}
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'Balita' ? 'SEMUA' : 'Balita')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                selectedCategory === 'Balita'
                  ? 'bg-amber-500 text-white border-amber-400 shadow-md ring-2 ring-amber-300/50'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold opacity-85">Balita (&le;5 th)</span>
                <Baby className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-2xl font-black mt-1 font-mono">{stats.totalBalita}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Generasi Emas</div>
            </button>

            {/* Anak & Remaja */}
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'Anak & Remaja' ? 'SEMUA' : 'Anak & Remaja')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                selectedCategory === 'Anak & Remaja'
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md ring-2 ring-sky-300/50'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold opacity-85">Anak &amp; Remaja</span>
                <Sparkles className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-2xl font-black mt-1 font-mono">{stats.totalAnak}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Usia 6 - 17 th</div>
            </button>

            {/* Dewasa Produktif */}
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'Dewasa' ? 'SEMUA' : 'Dewasa')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                selectedCategory === 'Dewasa'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-md ring-2 ring-teal-300/50'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold opacity-85">Produktif</span>
                <UserCheck className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-2xl font-black mt-1 font-mono">{stats.totalDewasa}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Usia 18 - 59 th</div>
            </button>

            {/* Lansia */}
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'Lansia' ? 'SEMUA' : 'Lansia')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                selectedCategory === 'Lansia'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-300/50'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold opacity-85">Lansia</span>
                <HeartHandshake className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-2xl font-black mt-1 font-mono">{stats.totalLansia}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Usia &ge; 60 th</div>
            </button>

          </div>
        )}

        {/* 🔍 FILTER, SEARCH & CONTROLS TOOLBAR (Sticky di Mobile saat Scroll) */}
        <div className="sticky top-3 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm space-y-3">
          
          {/* Baris Atas: Input Pencarian & Pilihan Tampilan */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
            
            {/* Input Pencarian Nama */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama warga (contoh: Harmono, Budi, Siti)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Kontrol Sort & View Mode */}
            <div className="flex items-center gap-2">
              {/* Urutan Sort */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="nama-asc">Nama (A &rarr; Z)</option>
                  <option value="nama-desc">Nama (Z &rarr; A)</option>
                  <option value="umur-asc">Usia (Termuda)</option>
                  <option value="umur-desc">Usia (Tertua)</option>
                </select>
              </div>

              {/* Toggle Grid vs Table (Khusus Desktop & Layar Menengah) */}
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('card')}
                  title="Tampilan Kartu"
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'card'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Tampilan Tabel"
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Baris Bawah: Filter Kategori & Jenis Kelamin (Pills yang Scrollable di HP) */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            
            {/* Filter Pills Gender */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Gender:</span>
              {['SEMUA', 'LAKI-LAKI', 'PEREMPUAN'].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition shrink-0 ${
                    selectedGender === g
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {g === 'SEMUA' ? 'Semua' : g === 'LAKI-LAKI' ? '👨 Pria' : '👩 Wanita'}
                </button>
              ))}
            </div>

            {/* Status Hasil */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
              Menampilkan <span className="font-bold text-emerald-600">{filteredWarga.length}</span> warga
            </div>

          </div>

        </div>

        {/* 👥 KONTEN UTAMA: DAFTAR WARGA (RESPONSIF KARTU & TABEL) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredWarga.length === 0 ? (
          /* Empty State jika tidak ada data ditemukan */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3 max-w-md mx-auto my-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Warga Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tidak ada warga dengan kriteria pencarian &quot;{searchQuery}&quot; atau filter yang dipilih.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('SEMUA');
                setSelectedGender('SEMUA');
              }}
              className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : viewMode === 'card' ? (
          /* 📱 MODE KARTU (Sangat nyaman dipegang & disentuh lewat HP) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredWarga.map((warga, index) => (
              <div
                key={warga.id}
                onClick={() => setActiveModalWarga(warga)}
                className="group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Avatar Inisial */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${getAvatarGradient(warga.nama_lengkap, warga.jenis_kelamin)} flex items-center justify-center font-bold text-sm shadow-sm shrink-0`}>
                    {getInitials(warga.nama_lengkap)}
                  </div>

                  {/* Informasi Nama & Kategori */}
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {warga.nama_lengkap}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(warga.kategori_usia)}`}>
                        {warga.kategori_usia}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {warga.jenis_kelamin === 'LAKI-LAKI' ? 'L' : 'P'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge Usia Besar */}
                <div className="text-right shrink-0">
                  <div className="inline-flex flex-col items-end">
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {warga.umur}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 -mt-1">
                      Tahun
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 💻 MODE TABEL (Elegan untuk tampilan Desktop / Laptop) */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Lengkap</th>
                    <th className="py-3.5 px-4">Jenis Kelamin</th>
                    <th className="py-3.5 px-4 text-center">Umur / Usia</th>
                    <th className="py-3.5 px-4">Kategori Demografi</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredWarga.map((warga, idx) => (
                    <tr
                      key={warga.id}
                      onClick={() => setActiveModalWarga(warga)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${getAvatarGradient(warga.nama_lengkap, warga.jenis_kelamin)} flex items-center justify-center font-bold text-xs shrink-0`}>
                            {getInitials(warga.nama_lengkap)}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {warga.nama_lengkap}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {warga.jenis_kelamin === 'LAKI-LAKI' ? '👨 Laki-Laki' : '👩 Perempuan'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black font-mono text-sm text-emerald-600 dark:text-emerald-400">
                          {warga.umur}
                        </span>{' '}
                        <span className="text-[11px] text-slate-400">Tahun</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeColor(warga.kategori_usia)}`}>
                          {warga.kategori_usia}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-slate-400 group-hover:text-emerald-500 font-semibold text-[11px] inline-flex items-center gap-1">
                          Detail <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* 🛡️ MODAL DETAIL AMAN PROFIL WARGA (INTERAKTIF & EDUKATIF) */}
      {activeModalWarga && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5 relative">
            
            {/* Tombol Tutup */}
            <button
              onClick={() => setActiveModalWarga(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Avatar & Nama */}
            <div className="text-center space-y-2 pt-2">
              <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr ${getAvatarGradient(activeModalWarga.nama_lengkap, activeModalWarga.jenis_kelamin)} flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/10`}>
                {getInitials(activeModalWarga.nama_lengkap)}
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {activeModalWarga.nama_lengkap}
              </h2>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getCategoryBadgeColor(activeModalWarga.kategori_usia)}`}>
                Kategori: {activeModalWarga.kategori_usia}
              </span>
            </div>

            {/* Data Publik yang Ditampilkan */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Usia / Umur</span>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {activeModalWarga.umur} Tahun
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Jenis Kelamin</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {activeModalWarga.jenis_kelamin === 'LAKI-LAKI' ? 'Laki-Laki' : 'Perempuan'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status Warga</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Warga Aktif
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Domisili</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  RT 003 / RW 003
                </span>
              </div>
            </div>

            {/* Kotak Info Privasi Hukum */}
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Privasi Data Kependudukan Terjaga</span>
              </div>
              <p className="text-[10px] opacity-90 leading-tight">
                Nomor Induk Kependudukan (NIK), No Kartu Keluarga, dan riwayat mutasi bersifat rahasia dan hanya dikelola secara sah oleh Pengurus RT.
              </p>
            </div>

            {/* Tombol Tutup */}
            <button
              onClick={() => setActiveModalWarga(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs transition"
            >
              Tutup Jendela
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
