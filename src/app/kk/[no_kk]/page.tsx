'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Users, 
  Printer, 
  Edit,
  Eye,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  AlertCircle,
  Maximize2,
  X,
  Scan,
  RotateCw
} from 'lucide-react';

interface KKDetailPageProps {
  params: {
    no_kk: string;
  };
}

export default function KKDetailPage({ params }: KKDetailPageProps) {
  const [kk, setKK] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingKK, setIsEditingKK] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [editForm, setEditForm] = useState({
    kepala_keluarga: '',
    alamat: '',
    rt: '',
    rw: '',
    no_rumah: '',
    blok: '',
    status_hunian: 'Tetap',
  });

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kk/${params.no_kk}`);
      const data = await res.json();
      if (data.success) {
        setKK(data.data);
        setEditForm({
          kepala_keluarga: data.data.kepala_keluarga,
          alamat: data.data.alamat,
          rt: data.data.rt,
          rw: data.data.rw,
          no_rumah: '',
          blok: '',
          status_hunian: data.data.status_hunian,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [params.no_kk]);

  const handleUpdateKK = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/kk/${params.no_kk}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditingKK(false);
        fetchDetail();
      } else {
        alert(data.error || 'Gagal memperbarui KK');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Memuat rincian Kartu Keluarga...</div>;
  }

  if (!kk) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Kartu Keluarga Tidak Ditemukan</h2>
        <Link href="/kk" className="text-xs text-emerald-600 font-bold hover:underline">
          &larr; Kembali ke Daftar KK
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/kk"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Kartu Keluarga</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditingKK(!isEditingKK)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Alamat KK</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Lembar KK</span>
          </button>
        </div>
      </div>

      {/* Detail Kartu Keluarga Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.jpg" 
              alt="Logo RT 3 RW 3 Istimewa" 
              className="w-12 h-12 object-contain rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 shrink-0" 
            />
            <div>
              <span className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-wider">
                KARTU KELUARGA &bull; RT 003 / RW 003 ISTIMEWA
              </span>
              <h1 className="text-2xl font-mono font-black text-slate-900 dark:text-white tracking-wide">
                No. {kk.no_kk}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              kk.status_hunian === 'Tetap'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
            }`}>
              Hunian: {kk.status_hunian}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Nama Kepala Keluarga</span>
            <strong className="text-slate-900 dark:text-white text-sm font-bold">
              {kk.kepala_keluarga}
            </strong>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Alamat Jalan / Dusun Sesuai KK</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              {kk.alamat}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">RT / RW</span>
            <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">
              RT {kk.rt} / RW {kk.rw}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Wilayah Administrasi</span>
            <span className="text-slate-800 dark:text-slate-200">
              {kk.kelurahan}, {kk.kecamatan}, {kk.kabupaten_kota}
            </span>
          </div>
        </div>
      </div>

      {/* Form Edit KK jika Mode Edit Aktif */}
      {isEditingKK && (
        <form onSubmit={handleUpdateKK} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-300 dark:border-slate-700 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Perbarui Data Alamat Kartu Keluarga</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Nama Kepala Keluarga</label>
              <input
                type="text"
                value={editForm.kepala_keluarga}
                onChange={(e) => setEditForm({ ...editForm, kepala_keluarga: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Alamat Lengkap</label>
              <input
                type="text"
                value={editForm.alamat}
                onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Status Tempat Tinggal</label>
              <select
                value={editForm.status_hunian}
                onChange={(e) => setEditForm({ ...editForm, status_hunian: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
              >
                <option value="Tetap">Tetap</option>
                <option value="Kontrak">Kontrak / Sewa</option>
                <option value="Kos">Kos</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingKK(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      )}

      {/* Seksi Dokumen Scan Kartu Keluarga */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 border border-emerald-100 dark:border-emerald-900">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Dokumen Scan Kartu Keluarga
              </h3>
              <p className="text-[11px] text-slate-500">
                Arsip digital berkas fisik scan Kartu Keluarga
              </p>
            </div>
          </div>

          {kk.scan_document ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                Dokumen Terverifikasi Tersedia
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              Scan Belum Tersedia
            </span>
          )}
        </div>

        {kk.scan_document ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Preview Box */}
              <div className="md:col-span-5 lg:col-span-4">
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 aspect-[4/3] flex items-center justify-center shadow-inner">
                  {kk.scan_document.file_type === 'pdf' ? (
                    <iframe
                      src={`${kk.scan_document.image_url}#toolbar=0`}
                      className="w-full h-full border-0 pointer-events-none"
                      title="Preview PDF KK"
                    />
                  ) : (
                    <img
                      src={kk.scan_document.image_url}
                      alt={`Scan Kartu Keluarga No. ${kk.no_kk}`}
                      className="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-105"
                      onClick={() => setShowLightbox(true)}
                    />
                  )}

                  {/* Overlay Action Button */}
                  <div
                    onClick={() => setShowLightbox(true)}
                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer gap-1.5 text-white text-xs font-semibold p-2 text-center"
                  >
                    <Maximize2 className="w-5 h-5 text-emerald-400" />
                    <span>Perbesar Pratinjau</span>
                  </div>
                </div>
              </div>

              {/* Rincian Berkas & Tombol Aksi */}
              <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between space-y-4 h-full">
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Nama Berkas:</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate block" title={kk.scan_document.filename}>
                        {kk.scan_document.filename}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Tipe Dokumen:</span>
                      <span className="uppercase font-bold text-slate-800 dark:text-slate-200">
                        {kk.scan_document.file_type}
                      </span>
                    </div>

                    {kk.scan_document.verified_at && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[11px] mb-0.5">Waktu Verifikasi Sistem:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {new Date(kk.scan_document.verified_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Dokumen ini adalah arsip scan fisik resmi yang telah diverifikasi sesuai Kartu Keluarga asli warga dan tersimpan aman di server RT.
                  </p>
                </div>

                {/* Tombol Aksi */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowLightbox(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lihat Preview</span>
                  </button>

                  <a
                    href={kk.scan_document.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Buka Tab Baru</span>
                  </a>

                  <a
                    href={kk.scan_document.image_url}
                    download={kk.scan_document.filename || `Scan-KK-${kk.no_kk}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Berkas Scan</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Scan Dokumen KK Belum Tersedia
                </h4>
                <p className="text-[11px] text-slate-500">
                  Kartu Keluarga ini didaftarkan secara manual atau berkas fisik scan belum diunggah ke sistem.
                </p>
              </div>
            </div>

            <Link
              href="/scan"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 text-slate-700 dark:text-slate-300 text-xs font-semibold transition shadow-sm shrink-0"
            >
              <Scan className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unggah / Pindai Berkas KK</span>
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox Modal Fullscreen */}
      {showLightbox && kk.scan_document && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-bold text-sm block">Dokumen Scan KK No. {kk.no_kk}</span>
                <span className="text-[11px] text-slate-400 font-mono">{kk.scan_document.filename}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {kk.scan_document.file_type !== 'pdf' && (
                <button
                  type="button"
                  onClick={() => setLightboxRotation((prev) => (prev + 90) % 360)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
                  title="Putar 90 Derajat Searah Jarum Jam"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Putar {lightboxRotation > 0 ? `(${lightboxRotation}°)` : ''}</span>
                </button>
              )}
              <a
                href={kk.scan_document.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tab Baru</span>
              </a>
              <a
                href={kk.scan_document.image_url}
                download={kk.scan_document.filename || `Scan-KK-${kk.no_kk}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold transition shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setShowLightbox(false);
                  setLightboxRotation(0);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-600 text-white transition ml-1"
                aria-label="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4">
            {kk.scan_document.file_type === 'pdf' ? (
              <iframe
                src={kk.scan_document.image_url}
                className="w-full h-full max-w-5xl rounded-xl border border-slate-700 bg-white shadow-2xl"
                title="Pratinjau PDF Kartu Keluarga"
              />
            ) : (
              <img
                src={kk.scan_document.image_url}
                alt={`Scan Kartu Keluarga No. ${kk.no_kk}`}
                style={{ transform: `rotate(${lightboxRotation}deg)` }}
                className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10 transition-transform duration-200"
              />
            )}
          </div>
        </div>
      )}

      {/* Tabel Anggota Keluarga Lengkap */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Daftar Susunan Anggota Keluarga ({kk.anggota.length} Jiwa)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Data lengkap NIK, tanggal lahir, status hubungan, dan nama orang tua.
            </p>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <th className="p-3">No</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">NIK</th>
                <th className="p-3">Jenis Kelamin</th>
                <th className="p-3">Tempat / Tgl Lahir</th>
                <th className="p-3">Agama</th>
                <th className="p-3">Pendidikan</th>
                <th className="p-3">Pekerjaan</th>
                <th className="p-3">Status Hubungan</th>
                <th className="p-3">Orang Tua (Ayah / Ibu)</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {kk.anggota.map((w: any, idx: number) => (
                <tr key={w.nik} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {w.nama_lengkap}
                  </td>
                  <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                    {w.nik}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">
                    {w.jenis_kelamin}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">
                    {w.tempat_lahir}, {w.tanggal_lahir}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">
                    {w.agama}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">
                    {w.pendidikan}
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">
                    {w.pekerjaan}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                      {w.status_hubungan}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">
                    {w.nama_ayah || '-'} / {w.nama_ibu || '-'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      w.status_warga === 'Aktif'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : w.status_warga === 'Meninggal'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {w.status_warga}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tampilan Mobile / HP: Kartu Anggota Keluarga Responsif */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {kk.anggota.map((w: any, idx: number) => (
            <div key={w.nik} className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold flex items-center justify-center text-slate-500 shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {w.nama_lengkap}
                    </h4>
                    <div className="font-mono text-xs text-slate-500 font-semibold mt-0.5">
                      NIK: {w.nik}
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  w.status_warga === 'Aktif'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : w.status_warga === 'Meninggal'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {w.status_warga}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Hubungan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {w.status_hubungan}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Jenis Kelamin:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {w.jenis_kelamin}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Tempat / Tgl Lahir:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {w.tempat_lahir}, {w.tanggal_lahir}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Agama &amp; Pendidikan:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {w.agama} &bull; {w.pendidikan}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Pekerjaan:</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate block">
                    {w.pekerjaan}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Orang Tua:</span>
                  <span className="text-slate-800 dark:text-slate-200 text-[11px] truncate block">
                    {w.nama_ayah || '-'} / {w.nama_ibu || '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
