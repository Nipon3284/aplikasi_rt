'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ScanUploader from '@/components/scan-verifier/ScanUploader';
import { 
  Clock, 
  ArrowRight, 
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trash2,
  Sparkles,
  Loader2,
  AlertTriangle,
  Play,
  Pause,
  Eye,
  X,
  FileText,
  FileCheck,
  Layers,
  ZoomIn,
  Check
} from 'lucide-react';

interface ScanItem {
  id: string;
  image_url: string;
  filename: string;
  status: string;
  extracted_json: string;
  confidence_score: number;
  created_at: string;
  verified_at?: string | null;
  no_kk_result?: string | null;
}

export default function ScanPage() {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING_OCR' | 'READY' | 'FINISHED'>('ALL');

  // Single Item Scanning State
  const [singleScanningId, setSingleScanningId] = useState<string | null>(null);

  // Batch Re-scan State
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [isBatchCancelled, setIsBatchCancelled] = useState(false);
  const isCancelledRef = useRef(false);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    success: 0,
    failed: 0,
    currentName: '',
  });

  // Lightbox Preview Modal State
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const fetchScans = async () => {
    try {
      const res = await fetch('/api/scan');
      const data = await res.json();
      if (data.success) {
        setScans(data.data);
      }
    } catch (err) {
      console.error('Error fetching scans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  // Klasifikasi Status Antrean
  const isPendingOCRItem = (item: ScanItem): boolean => {
    if (item.status === 'PENDING_OCR') return true;
    if (item.status === 'PENDING') {
      try {
        const parsed = JSON.parse(item.extracted_json);
        if (!parsed.no_kk || parsed.no_kk.trim() === '' || (item.confidence_score !== undefined && item.confidence_score <= 0.2)) {
          return true;
        }
      } catch {
        return true;
      }
    }
    return false;
  };

  // Antrean 1: AI OCR Ditunda / Belum Diproses
  const pendingOCRScans = scans.filter((s) => s.status !== 'VERIFIED' && s.status !== 'REJECTED' && isPendingOCRItem(s));

  // Antrean 2: AI OCR Berhasil & Menunggu Verifikasi Manual
  const readyVerificationScans = scans.filter((s) => s.status === 'PENDING' && !isPendingOCRItem(s));

  // Riwayat Selesai (Masuk DB atau Ditolak)
  const finishedScans = scans.filter((s) => s.status === 'VERIFIED' || s.status === 'REJECTED');

  // Handle Scan Ulang Single Dokumen
  const handleScanSingle = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (singleScanningId || isBatchScanning) return;

    setSingleScanningId(id);
    try {
      const res = await fetch(`/api/scan/${id}`, { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        setScans((prev) => prev.map((s) => (s.id === id ? data.data : s)));
      } else {
        alert(data.error || 'Gagal memproses dokumen scan');
      }
    } catch (err: any) {
      alert(`Kesalahan: ${err.message}`);
    } finally {
      setSingleScanningId(null);
    }
  };

  // Handle Master Action: Scan Ulang Semua Dokumen Tertunda (Batch Runner)
  const handleStartBatchScan = async () => {
    if (pendingOCRScans.length === 0 || isBatchScanning) return;

    setIsBatchScanning(true);
    setIsBatchCancelled(false);
    isCancelledRef.current = false;

    setBatchProgress({
      current: 0,
      total: pendingOCRScans.length,
      success: 0,
      failed: 0,
      currentName: '',
    });

    const queue = [...pendingOCRScans];

    for (let i = 0; i < queue.length; i++) {
      if (isCancelledRef.current) {
        break;
      }

      const item = queue[i];
      setBatchProgress((prev) => ({
        ...prev,
        current: i + 1,
        currentName: item.filename,
      }));
      setSingleScanningId(item.id);

      try {
        const res = await fetch(`/api/scan/${item.id}`, { method: 'POST' });
        const data = await res.json();

        if (res.ok && data.success) {
          setBatchProgress((prev) => ({ ...prev, success: prev.success + 1 }));
          // Langsung perbarui scan di state sehingga dokumen otomatis berpindah ke Antrean 2!
          setScans((prev) => prev.map((s) => (s.id === item.id ? data.data : s)));
        } else {
          setBatchProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
        }
      } catch (err) {
        setBatchProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
      }

      setSingleScanningId(null);

      // Jeda 3.5 detik antar-berkas untuk menjaga batas kuota RPM (maks 15 request/menit pada Google Free Tier)
      if (i < queue.length - 1 && !isCancelledRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 3500));
      }
    }

    setIsBatchScanning(false);
  };

  const handleStopBatchScan = () => {
    isCancelledRef.current = true;
    setIsBatchCancelled(true);
  };

  // Handle Batalkan / Hapus Dokumen dari Antrean
  const handleDeleteScan = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Hapus berkas ini dari antrean scan?')) return;

    try {
      const res = await fetch(`/api/scan/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setScans((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert(data.error || 'Gagal menghapus antrean scan');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const batchPercent = batchProgress.total > 0
    ? Math.round((batchProgress.current / batchProgress.total) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Upload Box dengan dukungan Multi-File / Batch Upload & Kamera */}
      <ScanUploader onUploadSuccess={fetchScans} />

      {/* Ringkasan & Navigasi 2 Antrean */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>Pusat Antrean Dokumen Scan KK</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sistem memisahkan dokumen yang belum di-scan AI (karena limit kuota) dengan dokumen yang sudah siap diverifikasi manual.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchScans}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Refresh Antrean"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Antrean 1: Scan AI Tertunda */}
          <div 
            onClick={() => setActiveFilter(activeFilter === 'PENDING_OCR' ? 'ALL' : 'PENDING_OCR')}
            className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
              activeFilter === 'PENDING_OCR'
                ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-400'
                : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/40 hover:border-amber-300'
            }`}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Antrean 1: Scan AI Tertunda
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {pendingOCRScans.length}
              </div>
              <p className="text-[10px] text-slate-400">Menunggu kuota AI / Scan ulang</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {/* Antrean 2: Siap Verifikasi Manual */}
          <div 
            onClick={() => setActiveFilter(activeFilter === 'READY' ? 'ALL' : 'READY')}
            className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
              activeFilter === 'READY'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-400'
                : 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-300'
            }`}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Antrean 2: Siap Verifikasi
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {readyVerificationScans.length}
              </div>
              <p className="text-[10px] text-slate-400">AI selesai, siap divalidasi RT</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Selesai / Terverifikasi */}
          <div 
            onClick={() => setActiveFilter(activeFilter === 'FINISHED' ? 'ALL' : 'FINISHED')}
            className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
              activeFilter === 'FINISHED'
                ? 'bg-slate-200 dark:bg-slate-700 border-slate-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Sudah Diproses (Selesai)
              </span>
              <div className="text-2xl font-black text-slate-700 dark:text-slate-300">
                {finishedScans.length}
              </div>
              <p className="text-[10px] text-slate-400">Masuk database warga</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-500 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL / PANEL PROGRESS BATCH RE-SCAN BERJALAN */}
      {isBatchScanning && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 rounded-2xl border-2 border-amber-400/50 shadow-lg space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Sedang Melakukan Scan Ulang Otomatis ke AI Gemini...</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                  Memproses berkas {batchProgress.current} dari {batchProgress.total} ({batchPercent}%) &bull; {batchProgress.currentName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                ✓ {batchProgress.success} Berhasil
              </span>
              {batchProgress.failed > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                  ✗ {batchProgress.failed} Gagal/Limit
                </span>
              )}
              <button
                type="button"
                onClick={handleStopBatchScan}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Hentikan</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, batchPercent))}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Tips: Dokumen yang berhasil discan akan langsung berpindah otomatis ke <strong>Antrean 2 (Siap Verifikasi Manual)</strong> di bawah secara real-time.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ANTREAN 1: ANTREAN SCAN ULANG AI (TERTUNDA / LIMIT KUOTA)                */}
      {/* ========================================================================= */}
      {(activeFilter === 'ALL' || activeFilter === 'PENDING_OCR') && (
        <section id="antrean-scan-ulang" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-200 dark:border-amber-900/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Antrean 1: Scan Ulang AI (Tertunda / Limit Kuota)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 font-extrabold">
                    {pendingOCRScans.length} Dokumen
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Dokumen-dokumen ini telah tersimpan di server namun belum diproses oleh AI karena limit API saat upload.
              </p>
            </div>

            {/* MASTER BUTTON: Scan Ulang Semua Dokumen Tertunda */}
            {pendingOCRScans.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isBatchScanning || singleScanningId !== null}
                  onClick={handleStartBatchScan}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isBatchScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Memindai...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Scan Ulang Semua Dokumen Tertunda ({pendingOCRScans.length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat data antrean...</div>
          ) : pendingOCRScans.length === 0 ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-900/50 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tidak ada dokumen tertunda!
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Semua berkas telah berhasil diproses oleh AI atau belum ada berkas baru yang diunggah.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOCRScans.map((item) => {
                const isItemScanning = singleScanningId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between transition ${
                      isItemScanning 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                        : 'border-amber-200 dark:border-amber-900/50 hover:border-amber-300'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />

                    <div className="space-y-3">
                      {/* Thumbnail Preview */}
                      <div 
                        onClick={() => setPreviewImage({ url: item.image_url, title: item.filename })}
                        className="relative w-full h-36 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group"
                      >
                        <img
                          src={item.image_url}
                          alt={item.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                            <ZoomIn className="w-3 h-3" /> Lihat Foto
                          </span>
                        </div>
                        <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow">
                          Scan AI Tertunda
                        </div>
                      </div>

                      {/* Info Berkas */}
                      <div className="space-y-1">
                        <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate" title={item.filename}>
                          {item.filename}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Diunggah: {new Date(item.created_at).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          Status: Belum terbaca (Limit AI saat upload)
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isItemScanning || isBatchScanning}
                        onClick={(e) => handleScanSingle(item.id, e)}
                        className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow disabled:opacity-50"
                      >
                        {isItemScanning ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menganalisis...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Scan AI Sekarang</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/scan/verify/${item.id}`}
                        className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
                        title="Buka Verifikasi & Ketik Manual"
                      >
                        Ketik Manual
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteScan(item.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        title="Batalkan & Hapus dari antrean"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* ANTREAN 2: ANTREAN MENUNGGU VERIFIKASI MANUAL (SIAP DIVALIDASI)           */}
      {/* ========================================================================= */}
      {(activeFilter === 'ALL' || activeFilter === 'READY') && (
        <section id="antrean-verifikasi" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Antrean 2: Menunggu Verifikasi Manual (Siap Divalidasi)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200 font-extrabold">
                    {readyVerificationScans.length} Berkas Siap
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Dokumen telah berhasil dibaca oleh AI. Silakan tinjau dan periksa sebelum dimasukkan ke database warga RT.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat data antrean...</div>
          ) : readyVerificationScans.length === 0 ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Belum ada dokumen yang siap diverifikasi
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Klik tombol <strong>&apos;Scan Ulang Semua Dokumen Tertunda&apos;</strong> pada Antrean 1 di atas atau unggah dokumen KK baru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyVerificationScans.map((item) => {
                let parsed: any = {};
                try {
                  parsed = JSON.parse(item.extracted_json);
                } catch {}

                const confidence = Math.round((item.confidence_score || 0.8) * 100);

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/50 p-4 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition"
                  >
                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
                    
                    <div className="space-y-3">
                      {/* Thumbnail Preview */}
                      <div 
                        onClick={() => setPreviewImage({ url: item.image_url, title: parsed.no_kk || item.filename })}
                        className="relative w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group"
                      >
                        <img
                          src={item.image_url}
                          alt={item.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                            <ZoomIn className="w-3 h-3" /> Lihat Foto
                          </span>
                        </div>
                      </div>

                      {/* Header Data KK */}
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                              {parsed.no_kk || 'No. KK Belum Terdeteksi'}
                            </div>
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                              {parsed.kepala_keluarga || 'Nama Kepala Keluarga'}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 shrink-0">
                            {confidence}% Jelas
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          <div className="truncate">{parsed.alamat || 'Alamat RT'} RT {parsed.rt || '-'}/RW {parsed.rw || '-'}</div>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {parsed.anggota?.length || 0} Anggota Keluarga Terbaca
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Discan: {new Date(item.created_at).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        href={`/scan/verify/${item.id}`}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow"
                      >
                        <span>Tinjau & Verifikasi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteScan(item.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        title="Batalkan & Hapus dari antrean"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* RIWAYAT SCAN SELESAI (MASUK DATABASE ATAU DITOLAK)                       */}
      {/* ========================================================================= */}
      {(activeFilter === 'ALL' || activeFilter === 'FINISHED') && finishedScans.length > 0 && (
        <section className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Riwayat Dokumen yang Telah Diproses ({finishedScans.length})</span>
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
            {finishedScans.slice(0, 10).map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between flex-wrap gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <div className="flex items-center space-x-3">
                  {item.status === 'VERIFIED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {item.no_kk_result || item.filename}
                    </span>
                    <span className="text-slate-400 ml-2">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.status === 'VERIFIED' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {item.status === 'VERIFIED' ? 'Masuk Database' : 'Ditolak'}
                  </span>

                  {item.no_kk_result && item.status === 'VERIFIED' && (
                    <Link
                      href={`/kk/${item.no_kk_result}`}
                      className="text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Lihat Kartu Keluarga</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX MODAL PREVIEW FOTO DOKUMEN                                       */}
      {/* ========================================================================= */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
