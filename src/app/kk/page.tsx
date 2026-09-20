'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  Search, 
  Plus, 
  Eye, 
  Home, 
  Users, 
  MapPin,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2
} from 'lucide-react';

export default function KKListPage() {
  const [kkList, setKKList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kkToDelete, setKKToDelete] = useState<any | null>(null);
  const [isDeletingKK, setIsDeletingKK] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchKK = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kk?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setKKList(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKK();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKK();
  };

  const handleDeleteKK = async () => {
    if (!kkToDelete) return;
    setIsDeletingKK(true);
    try {
      const res = await fetch(`/api/kk/${kkToDelete.no_kk}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Kartu Keluarga berhasil dihapus');
        setKKToDelete(null);
        fetchKK();
      } else {
        alert(data.error || 'Gagal menghapus Kartu Keluarga');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeletingKK(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
      {/* Toast Notification */}
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

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 shrink-0" />
            <span>Daftar Kartu Keluarga (KK)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Daftar seluruh Kepala Keluarga dan hunian yang terdaftar di lingkungan RT.
          </p>
        </div>

        <Link
          href="/scan"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Scan / Input KK Baru</span>
        </Link>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan Nomor KK, Nama Kepala Keluarga, Alamat..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>
      </div>

      {/* Grid KK Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat daftar Kartu Keluarga...</div>
      ) : kkList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Home className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Belum ada data Kartu Keluarga
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan fitur scan fotokopi KK untuk memasukkan data keluarga secara otomatis.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {kkList.map((kk) => {
            const activeMembers = kk.anggota.filter((a: any) => a.status_warga === 'Aktif');
            const isEmptyKK = activeMembers.length === 0;

            return (
              <div
                key={kk.no_kk}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition space-y-3 sm:space-y-4 flex flex-col justify-between ${
                  isEmptyKK 
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Nomor KK
                      </span>
                      <div className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white break-all">
                        {kk.no_kk}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        kk.status_hunian === 'Tetap'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {kk.status_hunian}
                      </span>

                      {isEmptyKK && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                          0 Jiwa (Kosong)
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">
                      Kepala Keluarga
                    </span>
                    <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {kk.kepala_keluarga || '(Tanpa Nama)'}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {kk.alamat}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className={isEmptyKK ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                        {activeMembers.length} Jiwa Aktif
                        {kk.anggota.length > activeMembers.length && (
                          <span className="text-slate-400 ml-1 font-normal">
                            ({kk.anggota.length - activeMembers.length} mutasi)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    RT {kk.rt} / RW {kk.rw}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Tombol Hapus KK */}
                    <button
                      onClick={() => setKKToDelete(kk)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Hapus Kartu Keluarga ini"
                      aria-label="Hapus Kartu Keluarga"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>

                    <Link
                      href={`/kk/${kk.no_kk}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition"
                    >
                      <span>Detail</span>
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POP-UP MODAL: Konfirmasi Hapus Kartu Keluarga */}
      {kkToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus Kartu Keluarga
                </h3>
              </div>
              <button
                onClick={() => setKKToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Peringatan:</strong> Tindakan ini akan menghapus data Kartu Keluarga ini beserta seluruh riwayatnya dari sistem secara permanen.
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-xl text-xs space-y-2 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-500 block">Nomor KK:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {kkToDelete.no_kk}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Kepala Keluarga:</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {kkToDelete.kepala_keluarga || '(Tanpa Nama)'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Jumlah Anggota:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {kkToDelete.anggota?.length || 0} orang
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeletingKK}
                onClick={() => setKKToDelete(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeletingKK}
                onClick={handleDeleteKK}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-md transition flex items-center gap-1.5"
              >
                {isDeletingKK ? 'Menghapus...' : 'Ya, Hapus Kartu Keluarga'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
