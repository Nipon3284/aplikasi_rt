'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, 
  Camera, 
  FileText, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  RotateCcw
} from 'lucide-react';
import ImageCropModal from './ImageCropModal';
import { ensureLandscapeOrientation } from '@/lib/image-utils';

interface BatchItem {
  id: string;
  file: File;
  name: string;
  size: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
  error?: string;
  resultId?: string;
  noKK?: string;
  kepalaKeluarga?: string;
}

interface ScanUploaderProps {
  onUploadSuccess?: () => void;
}

export default function ScanUploader({ onUploadSuccess }: ScanUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Single Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // Batch Upload State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isBatchFinished, setIsBatchFinished] = useState(false);

  // Single file process
  const processSingleUpload = async (file: File | null, isSample: boolean = false) => {
    setIsUploading(true);
    setErrorMessage('');
    setUploadStatus('Mengoptimalkan orientasi lanskap dokumen KK...');

    try {
      const formData = new FormData();
      if (file) {
        const landscapeFile = await ensureLandscapeOrientation(file);
        formData.append('file', landscapeFile);
      }
      if (isSample) {
        formData.append('isSample', 'true');
      }

      setUploadStatus('Mengekstraksi nomor KK, NIK, dan data anggota keluarga...');

      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses dokumen scan');
      }

      setUploadStatus('Ekstraksi selesai! Mengarahkan ke layar verifikasi manual...');
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      setTimeout(() => {
        router.push(`/scan/verify/${data.data.id}`);
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses');
      setIsUploading(false);
    }
  };

  // Batch process loop (Sequential to avoid rate limit & memory spike)
  const processBatchUpload = async (files: File[]) => {
    setIsBatchMode(true);
    setIsBatchProcessing(true);
    setIsBatchFinished(false);
    setErrorMessage('');

    const initialItems: BatchItem[] = files.map((f, i) => ({
      id: `batch-${Date.now()}-${i}`,
      file: f,
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      status: 'PENDING',
    }));

    setBatchItems(initialItems);

    for (let i = 0; i < initialItems.length; i++) {
      setBatchCurrentIndex(i);

      // Tandai item sedang diproses
      setBatchItems((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'PROCESSING' } : item))
      );

      try {
        // Otomatis deteksi orientasi & putar ke posisi lanskap mendatar jika portrait
        const landscapeFile = await ensureLandscapeOrientation(initialItems[i].file);

        const formData = new FormData();
        formData.append('file', landscapeFile);

        const res = await fetch('/api/scan', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal mengekstrak dokumen KK');
        }

        let parsed: any = {};
        try {
          parsed = JSON.parse(data.data.extracted_json);
        } catch {}

        setBatchItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'SUCCESS',
                  resultId: data.data.id,
                  noKK: parsed.no_kk || (data.ocrPending ? 'Menunggu AI / Manual' : 'No KK Ditemukan'),
                  kepalaKeluarga: parsed.kepala_keluarga || (data.ocrPending ? 'Tersimpan di Antrean' : 'Kepala Keluarga'),
                }
              : item
          )
        );

        // Beri jeda 3.5 detik antar-berkas agar tidak memicu pembatasan kuota RPM (maks 15 req/menit)
        if (i < initialItems.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3500));
        }
      } catch (err: any) {
        setBatchItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'ERROR',
                  error: err.message || 'Gagal diproses',
                }
              : item
          )
        );
      }
    }

    setIsBatchProcessing(false);
    setIsBatchFinished(true);

    if (onUploadSuccess) {
      onUploadSuccess();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    e.target.value = '';

    if (files.length === 1) {
      // 1 berkas: otomatis rotasikan ke posisi lanskap sebelum ditampilkan di modal crop
      const landscapeFile = await ensureLandscapeOrientation(files[0]);
      const objectUrl = URL.createObjectURL(landscapeFile);
      setSelectedImageSrc(objectUrl);
      setSelectedFileName(landscapeFile.name);
    } else {
      // Lebih dari 1 berkas: langsung jalankan Batch Upload dengan auto-rotate
      processBatchUpload(files);
    }
  };

  const handleCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Kamera HP umumnya menghasilkan gambar vertikal (portrait)
      // Otomatis rotasi 90 derajat ke format lanskap resmi KK
      const landscapeFile = await ensureLandscapeOrientation(e.target.files[0]);
      const objectUrl = URL.createObjectURL(landscapeFile);
      setSelectedImageSrc(objectUrl);
      setSelectedFileName(landscapeFile.name);
      e.target.value = '';
    }
  };

  const handleCropConfirm = (croppedFile: File) => {
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedImageSrc(null);
    processSingleUpload(croppedFile, false);
  };

  const handleCropCancel = () => {
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedImageSrc(null);
  };

  const handleUseSample = () => {
    processSingleUpload(null, true);
  };

  const handleResetBatch = () => {
    setIsBatchMode(false);
    setBatchItems([]);
    setIsBatchProcessing(false);
    setIsBatchFinished(false);
  };

  const completedCount = batchItems.filter((b) => b.status === 'SUCCESS').length;
  const errorCount = batchItems.filter((b) => b.status === 'ERROR').length;
  const progressPercent = batchItems.length > 0
    ? Math.round(((batchCurrentIndex + (isBatchFinished ? 1 : 0)) / batchItems.length) * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
      <div className="max-w-xl mx-auto text-center space-y-3 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Digitalisasi Fotokopi Kartu Keluarga
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Unggah satu foto atau <strong>banyak foto sekaligus</strong> dari komputer/HP. Sistem otomatis membaca teks dokumen dan memasukkannya ke antrean verifikasi.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MODE 1: Single Upload Loading */}
      {isUploading && !isBatchMode && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Sedang Memproses Dokumen
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {uploadStatus}
            </p>
          </div>
        </div>
      )}

      {/* MODE 2: Batch Upload Progress & Results */}
      {isBatchMode && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Progress Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isBatchFinished ? 'Batch Upload Selesai!' : 'Sedang Memproses Batch Upload KK...'}
                </h3>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {isBatchFinished
                  ? `${completedCount} Sukses &bull; ${errorCount} Gagal dari ${batchItems.length} Berkas`
                  : `Memproses ${batchCurrentIndex + 1} dari ${batchItems.length} Berkas (${progressPercent}%)`}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
              />
            </div>
          </div>

          {/* List of Batch Items */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {batchItems.map((item, idx) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition ${
                  item.status === 'PROCESSING'
                    ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                    : item.status === 'SUCCESS'
                    ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10'
                    : item.status === 'ERROR'
                    ? 'border-rose-200 bg-rose-50/30 dark:bg-rose-950/10'
                    : 'border-slate-100 bg-slate-50 dark:bg-slate-800/40 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-slate-400 text-[11px] w-5 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.size}
                      {item.noKK && ` &bull; No. KK: ${item.noKK}`}
                      {item.kepalaKeluarga && ` &bull; Kepala: ${item.kepalaKeluarga}`}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {item.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" /> Antrean
                    </span>
                  )}
                  {item.status === 'PROCESSING' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ekstraksi Teks...
                    </span>
                  )}
                  {item.status === 'SUCCESS' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Masuk Antrean
                    </span>
                  )}
                  {item.status === 'ERROR' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-bold" title={item.error}>
                      <AlertCircle className="w-3.5 h-3.5" /> Gagal
                    </span>
                  )}

                  {item.resultId && (
                    <button
                      onClick={() => router.push(`/scan/verify/${item.resultId}`)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-lg text-[10px] font-bold text-emerald-600 transition ml-1"
                    >
                      Verifikasi &rarr;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Batch Completed Action Buttons */}
          {isBatchFinished && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Seluruh dokumen telah ditambahkan ke antrean verifikasi di bawah.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetBatch}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                >
                  Unggah Berkas Lain
                </button>
                <a
                  href="#antrean-verifikasi"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                >
                  <span>Lihat Antrean di Bawah</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: Default File Picker Box */}
      {!isUploading && !isBatchMode && (
        <div className="space-y-4">
          {/* Kotak Drag and Drop / Pilih File */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*,.pdf"
              multiple
              className="hidden"
            />
            <FileText className="w-10 h-10 mx-auto text-slate-400 group-hover:text-emerald-600 transition mb-2" />
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Klik untuk memilih foto / scan KK (Bisa pilih 1 atau banyak berkas sekaligus)
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Format JPG, PNG, atau PDF &bull; Tahan tombol <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">Ctrl</kbd> atau <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">Shift</kbd> untuk memilih banyak foto
            </p>
          </div>

          {/* Opsi Kamera Langsung (Bagus di HP) & Sampel Demo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Kamera HP Langsung */}
            <div>
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleCameraChange}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Foto Langsung dengan Kamera HP</span>
              </button>
            </div>

            {/* Tombol Demo Sampel */}
            <div>
              <button
                type="button"
                onClick={handleUseSample}
                className="w-full py-3 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Uji Coba dengan Contoh Dokumen KK</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImageSrc && (
        <ImageCropModal
          imageSrc={selectedImageSrc}
          fileName={selectedFileName}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
