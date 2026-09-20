'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, 
  Camera, 
  FileText, 
  Sparkles, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import ImageCropModal from './ImageCropModal';

export default function ScanUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const processUpload = async (file: File | null, isSample: boolean = false) => {
    setIsUploading(true);
    setErrorMessage('');
    setUploadStatus('Mengunggah dokumen dan menganalisis teks fotokopi KK...');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
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
      
      setTimeout(() => {
        router.push(`/scan/verify/${data.data.id}`);
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses');
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setSelectedImageSrc(objectUrl);
      setSelectedFileName(file.name);
      e.target.value = '';
    }
  };

  const handleCropConfirm = (croppedFile: File) => {
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedImageSrc(null);
    processUpload(croppedFile, false);
  };

  const handleCropCancel = () => {
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedImageSrc(null);
  };

  const handleUseSample = () => {
    processUpload(null, true);
  };

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
          Ambil foto dokumen KK menggunakan kamera HP atau unggah file scan dari komputer. Sistem akan mengekstrak data otomatis untuk Anda verifikasi sebelum disimpan.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isUploading ? (
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
      ) : (
        <div className="space-y-4">
          {/* Kotak Drag and Drop / Pilih File */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="hidden"
            />
            <FileText className="w-10 h-10 mx-auto text-slate-400 group-hover:text-emerald-600 transition mb-2" />
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Klik untuk memilih file scan / foto KK
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Format JPG, PNG, atau PDF (Disarankan foto tegak lurus dan jelas)
            </p>
          </div>

          {/* Opsi Kamera Langsung (Bagus di HP) & Sampel Demo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Kamera HP Langsung */}
            <div>
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
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
