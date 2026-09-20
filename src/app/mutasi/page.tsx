'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  UserX, 
  Home, 
  Plus, 
  Printer, 
  X
} from 'lucide-react';

export default function MutasiPage() {
  const [mutasiList, setMutasiList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Kematian' | 'Pindah Keluar' | 'SEMUA'>('SEMUA');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeWargaList, setActiveWargaList] = useState<any[]>([]);
  const [form, setForm] = useState({
    nik: '',
    nama_warga: '',
    no_kk: '',
    jenis_mutasi: 'Kematian',
    tanggal_kejadian: new Date().toISOString().split('T')[0],
    keterangan: '',
    no_surat: '',
    pindah_seluruh_kk: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMutasi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mutasi?jenis=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setMutasiList(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchActiveWarga = async () => {
    try {
      const res = await fetch('/api/warga?status=Aktif');
      const data = await res.json();
      if (data.success) {
        setActiveWargaList(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMutasi();
  }, [fetchMutasi]);

  useEffect(() => {
    fetchActiveWarga();
  }, []);

  const handleSelectWarga = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNik = e.target.value;
    const found = activeWargaList.find((w) => w.nik === selectedNik);
    if (found) {
      setForm({
        ...form,
        nik: found.nik,
        nama_warga: found.nama_lengkap,
        no_kk: found.no_kk,
      });
    } else {
      setForm({ ...form, nik: '', nama_warga: '', no_kk: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/mutasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setIsModalOpen(false);
        fetchMutasi();
        fetchActiveWarga();
      } else {
        alert(data.error || 'Gagal menyimpan mutasi');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const kematianList = mutasiList.filter((m) => m.jenis_mutasi === 'Kematian');
  const pindahList = mutasiList.filter((m) => m.jenis_mutasi === 'Pindah Keluar' || m.jenis_mutasi === 'Pindah Masuk');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-7 h-7 text-emerald-600" />
            <span>Buku Register Riwayat Mutasi Warga</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Pencatatan resmi peristiwa warga pindahan dan riwayat kematian tingkat RT.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition print:hidden"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 print:hidden"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Mutasi Baru</span>
          </button>
        </div>
      </div>

      {/* Tab Navigasi */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab('SEMUA')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'SEMUA'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Semua Peristiwa ({mutasiList.length})
        </button>

        <button
          onClick={() => setActiveTab('Kematian')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'Kematian'
              ? 'bg-rose-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Riwayat Kematian ({kematianList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('Pindah Keluar')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'Pindah Keluar'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Warga Pindah ({pindahList.length})</span>
        </button>
      </div>

      {/* Tabel Mutasi */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat catatan mutasi...</div>
        ) : mutasiList.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Belum ada data mutasi yang dicatat
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Klik &quot;+ Catat Mutasi Baru&quot; untuk mencatat warga yang meninggal atau pindah.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Tanggal Peristiwa</th>
                  <th className="p-3.5">Jenis Mutasi</th>
                  <th className="p-3.5">Nama Warga</th>
                  <th className="p-3.5">NIK / No. KK</th>
                  <th className="p-3.5">Keterangan / Alasan</th>
                  <th className="p-3.5">No. Surat</th>
                  <th className="p-3.5">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mutasiList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {item.tanggal_kejadian}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.jenis_mutasi === 'Kematian'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      }`}>
                        {item.jenis_mutasi}
                      </span>
                    </td>

                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {item.nama_warga}
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      <div>NIK: {item.nik || '-'}</div>
                      <div>KK: {item.no_kk || '-'}</div>
                    </td>

                    <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs">
                      {item.keterangan || '-'}
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {item.no_surat || '-'}
                    </td>

                    <td className="p-3.5 text-slate-500">
                      {item.dicatat_oleh}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Input Mutasi Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <span>Pencatatan Peristiwa Kependudukan RT</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Jenis Mutasi */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Jenis Peristiwa / Mutasi <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, jenis_mutasi: 'Kematian' })}
                    className={`py-2 rounded-lg font-bold border transition ${
                      form.jenis_mutasi === 'Kematian'
                        ? 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    Kematian Warga
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, jenis_mutasi: 'Pindah Keluar' })}
                    className={`py-2 rounded-lg font-bold border transition ${
                      form.jenis_mutasi === 'Pindah Keluar'
                        ? 'bg-amber-50 dark:bg-amber-950 border-amber-500 text-amber-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    Warga Pindah Keluar
                  </button>
                </div>
              </div>

              {/* Pilih Warga dari Database */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Pilih Warga dari Daftar Aktif <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.nik}
                  onChange={handleSelectWarga}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                >
                  <option value="">-- Pilih Nama Warga --</option>
                  {activeWargaList.map((w) => (
                    <option key={w.nik} value={w.nik}>
                      {w.nama_lengkap} (NIK: {w.nik}) - KK: {w.no_kk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Kejadian */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Tanggal Kejadian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.tanggal_kejadian}
                  onChange={(e) => setForm({ ...form, tanggal_kejadian: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              {/* Nomor Surat Pengantar/Keterangan */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Nomor Surat Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder={form.jenis_mutasi === 'Kematian' ? 'Contoh: 474.3/12/SKM/RT03/2024' : 'Contoh: 475/02/SPP/RT03/2024'}
                  value={form.no_surat}
                  onChange={(e) => setForm({ ...form, no_surat: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Pindah Seluruh KK Option */}
              {form.jenis_mutasi === 'Pindah Keluar' && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50">
                  <input
                    type="checkbox"
                    id="pindah_seluruh_kk"
                    checked={form.pindah_seluruh_kk}
                    onChange={(e) => setForm({ ...form, pindah_seluruh_kk: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <label htmlFor="pindah_seluruh_kk" className="text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
                    Pindahkan seluruh anggota keluarga dalam 1 KK ini
                  </label>
                </div>
              )}

              {/* Keterangan */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Keterangan / Alasan
                </label>
                <textarea
                  rows={3}
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder={
                    form.jenis_mutasi === 'Kematian'
                      ? 'Penyebab sakit/meninggal di RS, dimakamkan di TPU...'
                      : 'Pindah ke kota lain, alamat tujuan baru...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-white font-bold rounded-lg shadow ${
                    form.jenis_mutasi === 'Kematian'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan ke Buku Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
