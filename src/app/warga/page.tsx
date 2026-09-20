'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  UserPlus, 
  UserX, 
  Home, 
  AlertCircle,
  Eye,
  X,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export default function WargaPage() {
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Aktif');
  const [genderFilter, setGenderFilter] = useState('SEMUA');

  // Modal State for Quick Mutasi (Kematian / Pindah)
  const [selectedWarga, setSelectedWarga] = useState<any | null>(null);
  const [mutationType, setMutationType] = useState<'Kematian' | 'Pindah Keluar' | null>(null);
  const [mutationForm, setMutationForm] = useState({
    tanggal_kejadian: new Date().toISOString().split('T')[0],
    keterangan: '',
    no_surat: '',
  });
  const [submittingMutasi, setSubmittingMutasi] = useState(false);

  // Modal State untuk Hapus Warga (Kasus Salah Input)
  const [wargaToDelete, setWargaToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal State untuk Reset Database
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Feedback Notification Banner
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchWarga = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter) query.set('status', statusFilter);
      if (genderFilter) query.set('gender', genderFilter);

      const res = await fetch(`/api/warga?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setWargaList(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, genderFilter]);

  useEffect(() => {
    fetchWarga();
  }, [fetchWarga]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWarga();
  };

  const handleOpenMutasi = (warga: any, type: 'Kematian' | 'Pindah Keluar') => {
    setSelectedWarga(warga);
    setMutationType(type);
    setMutationForm({
      tanggal_kejadian: new Date().toISOString().split('T')[0],
      keterangan: type === 'Kematian' ? 'Meninggal di rumah / sakit' : 'Pindah ke alamat baru',
      no_surat: '',
    });
  };

  const handleSubmitMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarga || !mutationType) return;
    setSubmittingMutasi(true);

    try {
      const res = await fetch('/api/mutasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik: selectedWarga.nik,
          nama_warga: selectedWarga.nama_lengkap,
          no_kk: selectedWarga.no_kk,
          jenis_mutasi: mutationType,
          tanggal_kejadian: mutationForm.tanggal_kejadian,
          keterangan: mutationForm.keterangan,
          no_surat: mutationForm.no_surat,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Status warga berhasil diubah menjadi ${mutationType}`);
        setSelectedWarga(null);
        setMutationType(null);
        fetchWarga();
      } else {
        alert(data.error || 'Gagal mencatat mutasi');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingMutasi(false);
    }
  };

  // Eksekusi Hapus Warga (Kasus Salah Input)
  const handleDeleteWarga = async () => {
    if (!wargaToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/warga/${wargaToDelete.nik}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Data warga "${wargaToDelete.nama_lengkap}" berhasil dihapus permanen.`);
        setWargaToDelete(null);
        fetchWarga();
      } else {
        alert(data.error || 'Gagal menghapus data warga');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Eksekusi Reset Seluruh Database
  const handleResetDatabase = async () => {
    if (confirmText !== 'RESET') {
      alert('Ketik kata "RESET" dengan huruf besar untuk mengonfirmasi pengosongan database.');
      return;
    }
    setIsResetting(true);

    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reseed: false }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setIsResetModalOpen(false);
        setConfirmText('');
        fetchWarga();
      } else {
        alert(data.error || 'Gagal mereset database');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return '-';
    const birthYear = parseInt(birthDateString.split('-')[0], 10);
    if (isNaN(birthYear)) return '-';
    const currentYear = new Date().getFullYear();
    return `${currentYear - birthYear} thn`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="p-1 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Halaman & Tombol Aksi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            <span>Master Data Warga RT</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Daftar seluruh penduduk RT yang terdata dari Kartu Keluarga, buku mutasi, dan pencatatan warga.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tombol Reset Database */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 border border-slate-200 dark:border-slate-700 hover:border-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Kosongkan seluruh data KK dan Warga"
          >
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <span>Reset Database</span>
          </button>

          <Link
            href="/scan"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Scan KK Baru</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan Nama, NIK, atau No. KK..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
            {['Aktif', 'Meninggal', 'Pindah', 'SEMUA'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md transition ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {st === 'SEMUA' ? 'Semua Status' : st}
              </button>
            ))}
          </div>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="SEMUA">Semua Gender</option>
            <option value="LAKI-LAKI">Laki-Laki</option>
            <option value="PEREMPUAN">Perempuan</option>
          </select>
        </div>
      </div>

      {/* Tabel Data Warga */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat data kependudukan warga...</div>
        ) : wargaList.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Database warga saat ini dalam keadaan kosong
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan tombol &quot;+ Scan KK Baru&quot; untuk memindai berkas fotokopi KK warga.
            </p>
          </div>
        ) : (
          <>
            {/* Tampilan Desktop: Tabel Lengkap */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                    <th className="p-3.5">Nama &amp; NIK</th>
                    <th className="p-3.5">No. Kartu Keluarga</th>
                    <th className="p-3.5">Gender / Usia</th>
                    <th className="p-3.5">Status Hubungan</th>
                    <th className="p-3.5">Status Warga</th>
                    <th className="p-3.5">Alamat Dusun / Jalan</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {wargaList.map((w) => {
                    const isAlive = w.status_warga === 'Aktif';
                    return (
                      <tr key={w.nik} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {w.nama_lengkap}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {w.nik}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <Link
                            href={`/kk/${w.no_kk}`}
                            className="font-mono text-emerald-600 hover:underline font-semibold"
                          >
                            {w.no_kk}
                          </Link>
                        </td>

                        <td className="p-3.5">
                          <div className="text-slate-800 dark:text-slate-200">
                            {w.jenis_kelamin === 'LAKI-LAKI' ? 'L' : 'P'} ({calculateAge(w.tanggal_lahir)})
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {w.agama}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {w.status_hub_text || w.status_hubungan}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status_warga === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : w.status_warga === 'Meninggal'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {w.status_warga}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-600 dark:text-slate-400">
                          <div>
                            {w.kartu_keluarga?.alamat || '-'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {w.kartu_keluarga?.rt ? `RT ${w.kartu_keluarga.rt} / RW ${w.kartu_keluarga.rw}` : ''}
                          </div>
                        </td>

                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          {/* Detail KK */}
                          <Link
                            href={`/kk/${w.no_kk}`}
                            className="p-1.5 inline-block text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                            title="Lihat Detail Kartu Keluarga"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Mutasi Kematian & Pindah (Hanya jika warga masih aktif) */}
                          {isAlive && (
                            <>
                              <button
                                onClick={() => handleOpenMutasi(w, 'Kematian')}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition"
                                title="Catat Warga Meninggal"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenMutasi(w, 'Pindah Keluar')}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition"
                                title="Catat Warga Pindah Keluar"
                              >
                                <Home className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Tombol Hapus Warga (Kasus Salah Input) */}
                          <button
                            onClick={() => setWargaToDelete(w)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition"
                            title="Hapus Data Ini (Kasus Salah Input)"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500 hover:text-rose-700" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tampilan Mobile / HP: Kartu Warga Responsif Touch-Friendly */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {wargaList.map((w) => {
                const isAlive = w.status_warga === 'Aktif';
                return (
                  <div key={w.nik} className="p-3.5 space-y-2.5">
                    {/* Baris Atas: Nama & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {w.nama_lengkap}
                        </h4>
                        <div className="font-mono text-xs text-slate-500 font-semibold mt-0.5">
                          NIK: {w.nik}
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        w.status_warga === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : w.status_warga === 'Meninggal'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {w.status_warga}
                      </span>
                    </div>

                    {/* Info Rincian Penduduk Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">No. KK:</span>
                        <Link href={`/kk/${w.no_kk}`} className="font-mono font-bold text-emerald-600 truncate block">
                          {w.no_kk}
                        </Link>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Hubungan Keluarga:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {w.status_hubungan}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Gender / Usia:</span>
                        <span className="text-slate-800 dark:text-slate-200">
                          {w.jenis_kelamin === 'LAKI-LAKI' ? 'Laki-Laki' : 'Perempuan'} ({calculateAge(w.tanggal_lahir)})
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Agama &amp; Pekerjaan:</span>
                        <span className="text-slate-800 dark:text-slate-200 truncate block">
                          {w.agama} &bull; {w.pekerjaan}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi Touch-Friendly untuk Layar HP */}
                    <div className="flex items-center justify-between pt-1 gap-1.5">
                      <Link
                        href={`/kk/${w.no_kk}`}
                        className="flex-1 py-2 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lihat KK</span>
                      </Link>

                      {isAlive && (
                        <>
                          <button
                            onClick={() => handleOpenMutasi(w, 'Kematian')}
                            className="py-2 px-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                            title="Catat Wafat"
                          >
                            <UserX className="w-3.5 h-3.5 text-rose-500" />
                            <span>Wafat</span>
                          </button>
                          <button
                            onClick={() => handleOpenMutasi(w, 'Pindah Keluar')}
                            className="py-2 px-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                            title="Catat Pindah"
                          >
                            <Home className="w-3.5 h-3.5 text-amber-500" />
                            <span>Pindah</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setWargaToDelete(w)}
                        className="py-2 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1"
                        title="Hapus Data Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* POP-UP MODAL 1: Konfirmasi Hapus Data Warga (Kasus Salah Input) */}
      {wargaToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Hapus Data Warga
                  </h3>
                  <span className="text-[11px] text-rose-600 font-semibold">Kasus Salah Input Data</span>
                </div>
              </div>
              <button
                onClick={() => setWargaToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Peringatan Penting:</strong> Tindakan ini akan menghapus data penduduk ini secara permanen dari sistem. Gunakan fitur ini jika data salah diinputkan atau terjadi duplikasi.
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-xs space-y-2 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-500 block">Nama Lengkap:</span>
                <strong className="text-slate-900 dark:text-white text-sm">
                  {wargaToDelete.nama_lengkap}
                </strong>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">NIK:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {wargaToDelete.nik}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">No. KK:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {wargaToDelete.no_kk}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setWargaToDelete(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteWarga}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-md transition flex items-center gap-1.5"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data Ini'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL 2: Konfirmasi Reset Seluruh Database */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Reset &amp; Kosongkan Database
                  </h3>
                  <span className="text-[11px] text-slate-400">Pengosongan Seluruh Data RT</span>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <strong>Peringatan Kritis:</strong>
              <p>
                Tindakan ini akan menghapus <strong>seluruh data Kartu Keluarga, seluruh data Warga, catatan Mutasi, dan Antrean Scan</strong>. Database akan dikosongkan total menjadi lembar kerja baru.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                Ketik kata <span className="font-mono text-rose-600 font-bold">RESET</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center font-bold tracking-widest text-slate-900 dark:text-white uppercase"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => {
                  setIsResetModalOpen(false);
                  setConfirmText('');
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isResetting || confirmText !== 'RESET'}
                onClick={handleResetDatabase}
                className="px-5 py-2 bg-rose-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-md transition"
              >
                {isResetting ? 'Mengosongkan...' : 'Kosongkan Seluruh Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL 3: Pencatatan Mutasi Kematian / Pindah */}
      {selectedWarga && mutationType && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className={mutationType === 'Kematian' ? 'text-rose-600' : 'text-amber-600'}>
                  Catat Riwayat {mutationType}
                </span>
              </h3>
              <button
                onClick={() => setSelectedWarga(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-xs space-y-1">
              <div>
                <span className="text-slate-500">Nama Warga:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{selectedWarga.nama_lengkap}</strong>
              </div>
              <div>
                <span className="text-slate-500">NIK:</span>{' '}
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedWarga.nik}</span>
              </div>
              <div>
                <span className="text-slate-500">No. KK:</span>{' '}
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedWarga.no_kk}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitMutasi} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Tanggal Kejadian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={mutationForm.tanggal_kejadian}
                  onChange={(e) => setMutationForm({ ...mutationForm, tanggal_kejadian: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Nomor Surat Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder={mutationType === 'Kematian' ? 'Contoh: 474.3/05/SKM/2024' : 'Contoh: 475/02/SPP/2024'}
                  value={mutationForm.no_surat}
                  onChange={(e) => setMutationForm({ ...mutationForm, no_surat: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Keterangan / Alasan
                </label>
                <textarea
                  rows={3}
                  value={mutationForm.keterangan}
                  onChange={(e) => setMutationForm({ ...mutationForm, keterangan: e.target.value })}
                  placeholder={
                    mutationType === 'Kematian'
                      ? 'Penyebab wafat, tempat wafat, atau lokasi pemakaman...'
                      : 'Alasan pindah dan alamat tujuan baru...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWarga(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submittingMutasi}
                  className={`px-4 py-2 text-white font-bold rounded-lg shadow ${
                    mutationType === 'Kematian'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {submittingMutasi ? 'Menyimpan...' : `Simpan ${mutationType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
