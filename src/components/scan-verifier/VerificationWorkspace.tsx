'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageViewer from './ImageViewer';
import { 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Save, 
  ArrowLeft, 
  Building, 
  User,
  FileText,
  Image as ImageIcon,
  Eye,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface VerificationWorkspaceProps {
  scan: {
    id: string;
    image_url: string;
    filename: string;
    status: string;
    extracted_json: string;
    confidence_score: number;
    created_at: string;
  };
}

export default function VerificationWorkspace({ scan }: VerificationWorkspaceProps) {
  const router = useRouter();

  // Parse extracted data
  const initialData = React.useMemo(() => {
    try {
      return JSON.parse(scan.extracted_json);
    } catch {
      return {
        no_kk: '',
        kepala_keluarga: '',
        alamat: '',
        rt: '003',
        rw: '003',
        kelurahan: '',
        kecamatan: '',
        kabupaten_kota: '',
        provinsi: '',
        kode_pos: '',
        tgl_dikeluarkan: '',
        anggota: [],
      };
    }
  }, [scan.extracted_json]);

  // Data KK murni sesuai kolom standar Kartu Keluarga
  const [kkData, setKKData] = useState({
    no_kk: initialData.no_kk || '',
    kepala_keluarga: initialData.kepala_keluarga || '',
    alamat: initialData.alamat || '',
    rt: initialData.rt || '003',
    rw: initialData.rw || '003',
    kelurahan: initialData.kelurahan || '',
    kecamatan: initialData.kecamatan || '',
    kabupaten_kota: initialData.kabupaten_kota || '',
    provinsi: initialData.provinsi || '',
    kode_pos: initialData.kode_pos || '',
    tgl_dikeluarkan: initialData.tgl_dikeluarkan || '',
    no_rumah: '', // Sengaja dikosongkan sesuai instruksi
    blok: '',     // Sengaja dikosongkan sesuai instruksi
    status_hunian: 'Tetap',
  });

  const [anggotaList, setAnggotaList] = useState<any[]>(
    initialData.anggota || []
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mobileTab, setMobileTab] = useState<'form' | 'image'>('form');
  const [imageRotation, setImageRotation] = useState<number>(initialData.rotation_needed || 0);

  // Handle updates on KK fields
  const handleKKChange = (field: string, value: string) => {
    setKKData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle updates on resident member fields
  const handleAnggotaChange = (index: number, field: string, value: string) => {
    setAnggotaList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add new member row
  const handleAddAnggota = () => {
    setAnggotaList((prev) => [
      ...prev,
      {
        nik: '',
        nama_lengkap: '',
        jenis_kelamin: 'LAKI-LAKI',
        tempat_lahir: '',
        tanggal_lahir: '',
        agama: 'ISLAM',
        pendidikan: 'SLTA / SEDERAJAT',
        pekerjaan: 'BELUM/TIDAK BEKERJA',
        golongan_darah: '-',
        status_perkawinan: 'BELUM KAWIN',
        status_hubungan: 'ANAK',
        kewarganegaraan: 'WNI',
        nama_ayah: '',
        nama_ibu: '',
      },
    ]);
  };

  // Delete member row
  const handleDeleteAnggota = (index: number) => {
    setAnggotaList((prev) => prev.filter((_, i) => i !== index));
  };

  // Save to database
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (!kkData.no_kk || kkData.no_kk.length !== 16) {
        throw new Error('Nomor Kartu Keluarga (KK) harus tepat 16 digit angka.');
      }
      if (!kkData.kepala_keluarga.trim()) {
        throw new Error('Nama Kepala Keluarga wajib diisi.');
      }
      if (anggotaList.length === 0) {
        throw new Error('Minimal harus ada 1 anggota keluarga yang diinputkan.');
      }

      for (let i = 0; i < anggotaList.length; i++) {
        const w = anggotaList[i];
        if (!w.nik || w.nik.length !== 16) {
          throw new Error(`Anggota #${i + 1} (${w.nama_lengkap || 'Warga'}): NIK harus 16 digit.`);
        }
        if (!w.nama_lengkap.trim()) {
          throw new Error(`Anggota #${i + 1}: Nama Lengkap tidak boleh kosong.`);
        }
      }

      const res = await fetch(`/api/scan/${scan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kkData: {
            ...kkData,
            no_rumah: '', // Dikosongkan di database
            blok: '',     // Dikosongkan di database
          },
          anggotaData: anggotaList,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan data');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        router.push(`/kk/${kkData.no_kk}`);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const [isReExtracting, setIsReExtracting] = useState(false);

  // Re-run AI extraction
  const handleReExtract = async () => {
    setIsReExtracting(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/scan/${scan.id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengekstrak ulang dengan AI');
      }

      const parsed = JSON.parse(data.data.extracted_json);
      setKKData({
        no_kk: parsed.no_kk || '',
        kepala_keluarga: parsed.kepala_keluarga || '',
        alamat: parsed.alamat || '',
        rt: parsed.rt || '003',
        rw: parsed.rw || '003',
        kelurahan: parsed.kelurahan || '',
        kecamatan: parsed.kecamatan || '',
        kabupaten_kota: parsed.kabupaten_kota || '',
        provinsi: parsed.provinsi || '',
        kode_pos: parsed.kode_pos || '',
        tgl_dikeluarkan: parsed.tgl_dikeluarkan || '',
        no_rumah: '',
        blok: '',
        status_hunian: 'Tetap',
      });

      if (parsed.anggota && Array.isArray(parsed.anggota)) {
        setAnggotaList(parsed.anggota);
      }

      if (typeof parsed.rotation_needed === 'number') {
        setImageRotation(parsed.rotation_needed);
      }

      alert('Ekstraksi teks AI berhasil diperbarui!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses');
    } finally {
      setIsReExtracting(false);
    }
  };

  // Reject scan
  const handleRejectScan = async () => {
    if (confirm('Apakah Anda yakin ingin menolak / membatalkan scan ini?')) {
      await fetch(`/api/scan/${scan.id}`, { method: 'DELETE' });
      router.push('/scan');
    }
  };

  const confidencePercentage = Math.round((scan.confidence_score || 0.88) * 100);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Link
            href="/scan"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Layar Verifikasi Manual Data KK</span>
              {scan.status === 'VERIFIED' ? (
                <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-300">
                  Sudah Terverifikasi
                </span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-semibold border border-amber-300">
                  Perlu Verifikasi Manual
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Periksa dan cocokkan seluruh kolom data di sebelah kanan dengan fotokopi dokumen KK di sebelah kiri.
            </p>
          </div>
        </div>

        {/* Skor Akurasi & Tombol Aksi */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estimasi Kejelasan Teks</div>
            <div className={`text-sm font-bold ${
              confidencePercentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {confidencePercentage}% Akurat
            </div>
          </div>

          <button
            type="button"
            onClick={handleReExtract}
            disabled={isReExtracting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg border border-emerald-200 dark:border-emerald-800 transition shadow-sm disabled:opacity-50"
            title="Jalankan AI OCR ulang jika sebelumnya terlewat atau kuota baru direset"
          >
            {isReExtracting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mengekstrak AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Analisis Ulang AI</span>
              </>
            )}
          </button>

          <button
            onClick={handleRejectScan}
            className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 transition"
          >
            <Trash2 className="w-4 h-4 inline mr-1" />
            Tolak Scan
          </button>

          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving || saveSuccess}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow transition flex items-center gap-1.5 ${
              saveSuccess
                ? 'bg-emerald-600'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            }`}
          >
            {isSaving ? (
              <span>Menyimpan...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Tersimpan! Mengalihkan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Valid & Simpan ke Database</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pesan Error jika Validasi Gagal */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Peringatan Kualitas dari OCR */}
      {initialData.warnings && initialData.warnings.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Bagian yang Dideteksi Perlu Perhatian Khusus oleh Petugas:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-slate-700 dark:text-slate-300">
            {initialData.warnings.map((w: string, idx: number) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mobile Tab Switcher (Khusus Layar HP / Tablet) */}
      <div className="lg:hidden flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'form'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Formulir Validasi ({anggotaList.length} Jiwa)</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('image')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'image'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Foto Berkas KK Asli</span>
        </button>
      </div>

      {/* Grid Side-by-Side: Kiri Gambar, Kanan Form Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Kolom Kiri: Penampil Dokumen Scan Fotokopi */}
        <div className={`lg:col-span-5 h-[480px] sm:h-[580px] lg:h-[680px] lg:sticky lg:top-20 space-y-2 ${
          mobileTab === 'image' ? 'block' : 'hidden lg:block'
        }`}>
          <ImageViewer
            src={scan.image_url}
            alt={`Scan ${scan.filename}`}
            initialRotation={imageRotation}
            onRotationChange={(deg) => setImageRotation(deg)}
          />
          {/* Tombol kembali ke form di tampilan HP */}
          <div className="lg:hidden pt-1">
            <button
              type="button"
              onClick={() => setMobileTab('form')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
            >
              <span>Lanjut ke Formulir Koreksi &rarr;</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Formulir Koreksi & Validasi Data */}
        <div className={`lg:col-span-7 space-y-4 ${
          mobileTab === 'form' ? 'block' : 'hidden lg:block'
        }`}>
          {/* Card 1: Data Kepala Keluarga & Alamat Dokumen KK */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>Bagian Kepala Kartu Keluarga (KK)</span>
              </h2>
              <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                Format Standar Disdukcapil
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* No KK */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Nomor Kartu Keluarga (No. KK) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={kkData.no_kk}
                  onChange={(e) => handleKKChange('no_kk', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-mono ${
                    kkData.no_kk.length !== 16
                      ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                  }`}
                  placeholder="3302xxxxxxxxxxxx"
                />
                {kkData.no_kk.length !== 16 && (
                  <span className="text-[10px] text-amber-600">Saat ini: {kkData.no_kk.length}/16 digit</span>
                )}
              </div>

              {/* Nama Kepala Keluarga */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Nama Kepala Keluarga <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={kkData.kepala_keluarga}
                  onChange={(e) => handleKKChange('kepala_keluarga', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  placeholder="NAMA KEPALA KELUARGA"
                />
              </div>

              {/* Alamat */}
              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Alamat (Jalan / Dusun / Kampung Sesuai KK)
                </label>
                <input
                  type="text"
                  value={kkData.alamat}
                  onChange={(e) => handleKKChange('alamat', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Contoh: TAMBAKSARI KIDUL"
                />
              </div>

              {/* RT / RW */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  RT / RW
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={kkData.rt}
                    onChange={(e) => handleKKChange('rt', e.target.value)}
                    className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono"
                    placeholder="RT"
                  />
                  <input
                    type="text"
                    value={kkData.rw}
                    onChange={(e) => handleKKChange('rw', e.target.value)}
                    className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono"
                    placeholder="RW"
                  />
                </div>
              </div>

              {/* Kode Pos */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={kkData.kode_pos}
                  onChange={(e) => handleKKChange('kode_pos', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  placeholder="Contoh: 53182"
                />
              </div>

              {/* Desa / Kelurahan */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Desa / Kelurahan
                </label>
                <input
                  type="text"
                  value={kkData.kelurahan}
                  onChange={(e) => handleKKChange('kelurahan', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Contoh: TAMBAKSARI KIDUL"
                />
              </div>

              {/* Kecamatan */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={kkData.kecamatan}
                  onChange={(e) => handleKKChange('kecamatan', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Contoh: KEMBARAN"
                />
              </div>

              {/* Kabupaten / Kota */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  value={kkData.kabupaten_kota}
                  onChange={(e) => handleKKChange('kabupaten_kota', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Contoh: BANYUMAS"
                />
              </div>

              {/* Provinsi */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={kkData.provinsi}
                  onChange={(e) => handleKKChange('provinsi', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Contoh: JAWA TENGAH"
                />
              </div>

              {/* Tanggal Dikeluarkan */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Dikeluarkan Tanggal
                </label>
                <input
                  type="date"
                  value={kkData.tgl_dikeluarkan}
                  onChange={(e) => handleKKChange('tgl_dikeluarkan', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Seluruh Kolom Anggota Keluarga Standar KK */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Anggota Keluarga ({anggotaList.length} Jiwa)</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Seluruh isian sesuai kolom KK: Nama, NIK, Gender, TTL, Agama, Pendidikan, Pekerjaan, Golongan Darah, Status Nikah, Hubungan, Kewarganegaraan, dan Nama Orang Tua.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAnggota}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            {/* List Anggota Terstruktur */}
            <div className="space-y-4">
              {anggotaList.map((w, index) => {
                const isNIKInvalid = !w.nik || w.nik.length !== 16;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition ${
                      isNIKInvalid
                        ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    {/* Header Baris */}
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {w.nama_lengkap || 'Warga Baru'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-medium">
                          {w.status_hubungan || 'ANGGOTA'}
                        </span>
                      </div>

                      {anggotaList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAnggota(index)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Grid Kolom Lengkap Sesuai KK */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {/* Kolom 1: Nama Lengkap */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (1) Nama Lengkap Sesuai KK <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={w.nama_lengkap || ''}
                          onChange={(e) => handleAnggotaChange(index, 'nama_lengkap', e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                          placeholder="HARMONO"
                        />
                      </div>

                      {/* Kolom 2: NIK */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (2) NIK (16 Digit) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={16}
                          value={w.nik || ''}
                          onChange={(e) => handleAnggotaChange(index, 'nik', e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold ${
                            isNIKInvalid
                              ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}
                          placeholder="3302xxxxxxxxxxxx"
                        />
                        {isNIKInvalid && (
                          <span className="text-[10px] text-amber-600 font-semibold">
                            ⚠️ Wajib 16 digit ({w.nik?.length || 0}/16)
                          </span>
                        )}
                      </div>

                      {/* Kolom 3: Jenis Kelamin */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (3) Jenis Kelamin
                        </label>
                        <select
                          value={w.jenis_kelamin || 'LAKI-LAKI'}
                          onChange={(e) => handleAnggotaChange(index, 'jenis_kelamin', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <option value="LAKI-LAKI">LAKI-LAKI</option>
                          <option value="PEREMPUAN">PEREMPUAN</option>
                        </select>
                      </div>

                      {/* Kolom 4: Tempat Lahir */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (4) Tempat Lahir
                        </label>
                        <input
                          type="text"
                          value={w.tempat_lahir || ''}
                          onChange={(e) => handleAnggotaChange(index, 'tempat_lahir', e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          placeholder="BANYUMAS"
                        />
                      </div>

                      {/* Kolom 5: Tanggal Lahir */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (5) Tanggal Lahir (YYYY-MM-DD)
                        </label>
                        <input
                          type="date"
                          value={w.tanggal_lahir || ''}
                          onChange={(e) => handleAnggotaChange(index, 'tanggal_lahir', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>

                      {/* Kolom 6: Agama */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (6) Agama
                        </label>
                        <select
                          value={w.agama || 'ISLAM'}
                          onChange={(e) => handleAnggotaChange(index, 'agama', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <option value="ISLAM">ISLAM</option>
                          <option value="KRISTEN">KRISTEN</option>
                          <option value="KATOLIK">KATOLIK</option>
                          <option value="HINDU">HINDU</option>
                          <option value="BUDDHA">BUDDHA</option>
                          <option value="KHONGHUCU">KHONGHUCU</option>
                          <option value="LAINNYA">LAINNYA</option>
                        </select>
                      </div>

                      {/* Kolom 7: Pendidikan */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (7) Pendidikan
                        </label>
                        <select
                          value={w.pendidikan || 'SLTA / SEDERAJAT'}
                          onChange={(e) => handleAnggotaChange(index, 'pendidikan', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <option value="TIDAK / BELUM SEKOLAH">TIDAK / BELUM SEKOLAH</option>
                          <option value="BELUM TAMAT SD / SEDERAJAT">BELUM TAMAT SD / SEDERAJAT</option>
                          <option value="TAMAT SD / SEDERAJAT">TAMAT SD / SEDERAJAT</option>
                          <option value="SLTP / SEDERAJAT">SLTP / SEDERAJAT</option>
                          <option value="SLTA / SEDERAJAT">SLTA / SEDERAJAT</option>
                          <option value="DIPLOMA I / II">DIPLOMA I / II</option>
                          <option value="DIPLOMA III / D3">DIPLOMA III / D3</option>
                          <option value="DIPLOMA IV / STRATA I (S1)">DIPLOMA IV / STRATA I (S1)</option>
                          <option value="STRATA II (S2)">STRATA II (S2)</option>
                          <option value="STRATA III (S3)">STRATA III (S3)</option>
                        </select>
                      </div>

                      {/* Kolom 8: Jenis Pekerjaan */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (8) Jenis Pekerjaan
                        </label>
                        <input
                          type="text"
                          value={w.pekerjaan || ''}
                          onChange={(e) => handleAnggotaChange(index, 'pekerjaan', e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          placeholder="BELUM/TIDAK BEKERJA"
                        />
                      </div>

                      {/* Kolom 9: Golongan Darah */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (9) Golongan Darah
                        </label>
                        <select
                          value={w.golongan_darah || '-'}
                          onChange={(e) => handleAnggotaChange(index, 'golongan_darah', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <option value="-">- (TIDAK TAHU)</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </select>
                      </div>

                      {/* Kolom 10: Status Perkawinan */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (10) Status Perkawinan
                        </label>
                        <select
                          value={w.status_perkawinan || 'BELUM KAWIN'}
                          onChange={(e) => handleAnggotaChange(index, 'status_perkawinan', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          <option value="BELUM KAWIN">BELUM KAWIN</option>
                          <option value="KAWIN">KAWIN</option>
                          <option value="CERAI HIDUP">CERAI HIDUP</option>
                          <option value="CERAI MATI">CERAI MATI</option>
                        </select>
                      </div>

                      {/* Kolom 12: Status Hubungan Dalam Keluarga */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (12) Status Hubungan Dalam Keluarga
                        </label>
                        <select
                          value={w.status_hubungan || 'ANAK'}
                          onChange={(e) => handleAnggotaChange(index, 'status_hubungan', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                        >
                          <option value="KEPALA KELUARGA">KEPALA KELUARGA</option>
                          <option value="SUAMI">SUAMI</option>
                          <option value="ISTRI">ISTRI</option>
                          <option value="ANAK">ANAK</option>
                          <option value="MENANTU">MENANTU</option>
                          <option value="CUCU">CUCU</option>
                          <option value="ORANG TUA">ORANG TUA</option>
                          <option value="MERTUA">MERTUA</option>
                          <option value="FAMILI LAIN">FAMILI LAIN</option>
                          <option value="PEMBANTU">PEMBANTU</option>
                          <option value="LAINNYA">LAINNYA</option>
                        </select>
                      </div>

                      {/* Kolom 13: Kewarganegaraan */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (13) Kewarganegaraan
                        </label>
                        <select
                          value={w.kewarganegaraan || 'WNI'}
                          onChange={(e) => handleAnggotaChange(index, 'kewarganegaraan', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        >
                          <option value="WNI">WNI</option>
                          <option value="WNA">WNA</option>
                        </select>
                      </div>

                      {/* Kolom 16: Nama Ayah */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (16) Nama Ayah
                        </label>
                        <input
                          type="text"
                          value={w.nama_ayah || ''}
                          onChange={(e) => handleAnggotaChange(index, 'nama_ayah', e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          placeholder="SUYONO"
                        />
                      </div>

                      {/* Kolom 17: Nama Ibu */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          (17) Nama Ibu
                        </label>
                        <input
                          type="text"
                          value={w.nama_ibu || ''}
                          onChange={(e) => handleAnggotaChange(index, 'nama_ibu', e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          placeholder="SABAR RAHAYU"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tombol Simpan Bawah */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              Pastikan semua baris sudah cocok dengan dokumen fotokopi KK sebelum disimpan.
            </div>

            <button
              type="button"
              onClick={handleSaveToDatabase}
              disabled={isSaving || saveSuccess}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan ke Database...' : 'Konfirmasi & Simpan Permanen'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tombol Melayang Cepat untuk HP: Intip Dokumen Asli */}
      {mobileTab === 'form' && (
        <div className="lg:hidden fixed bottom-5 right-5 z-40 animate-fade-in">
          <button
            type="button"
            onClick={() => {
              setMobileTab('image');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/50 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>🔍 Intip Foto KK</span>
          </button>
        </div>
      )}
    </div>
  );
}
