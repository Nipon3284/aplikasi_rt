'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Filter,
  Check,
  X,
  Users,
  Home,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { ImportAnalysisResult, KKImportItem, WargaImportItem } from '@/lib/excel-service';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImportAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review State
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'BARU' | 'DIPERBARUI' | 'KONFLIK' | 'TIDAK_DITEMUKAN'>('ALL');
  const [expandedKKs, setExpandedKKs] = useState<Record<string, boolean>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setErrorMsg(null);
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setErrorMsg('Format file tidak didukung. Harap pilih berkas .xlsx, .xls, atau .csv');
      return;
    }
    setFile(selectedFile);
  };

  // Upload and analyze
  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);
    setExecutionResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import/analyze', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Gagal menganalisis file import');
      }

      setAnalysisResult(json.data);

      // Auto-expand all KKs by default
      const initialExpanded: Record<string, boolean> = {};
      json.data.kkItems.forEach((kk: KKImportItem) => {
        initialExpanded[kk.no_kk] = true;
      });
      setExpandedKKs(initialExpanded);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses file');
    } finally {
      setAnalyzing(false);
    }
  };

  // Toggle Action for KK
  const handleKKActionChange = (no_kk: string, action: 'CREATE' | 'UPDATE' | 'SKIP') => {
    if (!analysisResult) return;
    const updatedKKs = analysisResult.kkItems.map((kk) => {
      if (kk.no_kk === no_kk) {
        return { ...kk, action };
      }
      return kk;
    });
    setAnalysisResult({ ...analysisResult, kkItems: updatedKKs });
  };

  // Toggle Action for Warga Member
  const handleMemberActionChange = (no_kk: string, nik: string, action: 'CREATE' | 'UPDATE' | 'SKIP' | 'KEEP') => {
    if (!analysisResult) return;
    const updatedKKs = analysisResult.kkItems.map((kk) => {
      if (kk.no_kk === no_kk) {
        const updatedMembers = kk.members.map((m) => {
          if (m.nik === nik) {
            return { ...m, action };
          }
          return m;
        });
        return { ...kk, members: updatedMembers };
      }
      return kk;
    });
    setAnalysisResult({ ...analysisResult, kkItems: updatedKKs });
  };

  // Bulk Action Helpers
  const handleBulkAction = (targetStatus: string, actionToSet: any) => {
    if (!analysisResult) return;
    const updatedKKs = analysisResult.kkItems.map((kk) => {
      let kkAction = kk.action;
      if (kk.status === targetStatus) {
        kkAction = actionToSet;
      }
      const updatedMembers = kk.members.map((m) => {
        if (m.status === targetStatus) {
          return { ...m, action: actionToSet };
        }
        return m;
      });
      return { ...kk, action: kkAction, members: updatedMembers };
    });
    setAnalysisResult({ ...analysisResult, kkItems: updatedKKs });
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (!analysisResult) return;
    setExecuting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kkItems: analysisResult.kkItems }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Gagal mengeksekusi import data');
      }

      setExecutionResult(json.summary);
      setShowConfirmModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan import ke database');
    } finally {
      setExecuting(false);
    }
  };

  const toggleExpandKK = (no_kk: string) => {
    setExpandedKKs((prev) => ({ ...prev, [no_kk]: !prev[no_kk] }));
  };

  // Filter KK items for display
  const filteredKKItems = (analysisResult?.kkItems || []).filter((kk) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'BARU') return kk.status === 'BARU' || kk.members.some((m) => m.status === 'BARU');
    if (activeFilter === 'DIPERBARUI') return kk.status === 'DIPERBARUI' || kk.members.some((m) => m.status === 'DIPERBARUI');
    if (activeFilter === 'KONFLIK') return kk.status === 'KONFLIK' || kk.members.some((m) => m.status === 'KONFLIK');
    if (activeFilter === 'TIDAK_DITEMUKAN') return kk.members.some((m) => m.status === 'TIDAK_DITEMUKAN');
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/" className="hover:text-emerald-600 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span>Import Data Kependudukan</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-emerald-600" />
            <span>Sistem Import Cerdas Anti-Duplikasi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Unggah file Excel/CSV data warga. Sistem otomatis membandingkan dengan database, mendeteksi duplikasi, menampilkan perbandingan visual <em>(diff)</em> sebelum dan sesudah, serta meminta persetujuan operator sebelum disimpan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/import/template"
            download="Template-Import-Data-RT003.xlsx"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh Template Resmi</span>
          </a>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold">Terjadi Kesalahan:</strong>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Execution Success Screen */}
      {executionResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-8 shadow-sm text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Data Berhasil Disinkronkan ke Database!
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Seluruh data Kartu Keluarga dan warga telah diperbarui ke dalam sistem sesuai tindakan yang Anda setujui.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-slate-500 block text-[11px]">KK Baru</span>
              <strong className="text-base text-emerald-700 dark:text-emerald-300 font-black">{executionResult.createdKKCount}</strong>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800">
              <span className="text-slate-500 block text-[11px]">Warga Baru</span>
              <strong className="text-base text-blue-700 dark:text-blue-300 font-black">{executionResult.createdWargaCount}</strong>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="text-slate-500 block text-[11px]">Warga Diperbarui</span>
              <strong className="text-base text-amber-700 dark:text-amber-300 font-black">{executionResult.updatedWargaCount}</strong>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block text-[11px]">Dilewati/Tetap</span>
              <strong className="text-base text-slate-700 dark:text-slate-300 font-black">{executionResult.skippedCount}</strong>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/warga"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
            >
              Lihat Data Penduduk &rarr;
            </Link>
            <button
              onClick={() => {
                setAnalysisResult(null);
                setExecutionResult(null);
                setFile(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              Import Berkas Lain
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Upload Box (If not analyzed yet) */}
      {!analysisResult && !executionResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              file
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            {file ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{file.name}</span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Ukuran: {(file.size / 1024).toFixed(1)} KB &bull; Siap dianalisis
                </p>
                <p className="text-[11px] text-emerald-600 font-semibold pt-1">
                  Klik atau seret berkas lain untuk mengganti
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Klik untuk memilih file atau seret file spreadsheet ke sini
                </p>
                <p className="text-xs text-slate-400">
                  Mendukung berkas Excel (.xlsx, .xls) dan CSV (.csv)
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Sistem tidak langsung menyimpan ke database. Anda dapat meninjau perbandingan data terlebih dahulu.
              </span>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || analyzing}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-sm ${
                !file || analyzing
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menganalisis &amp; Membandingkan Database...</span>
                </>
              ) : (
                <>
                  <span>Mulai Analisis &amp; Komparasi Diff</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Interactive Review Screen */}
      {analysisResult && !executionResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => setActiveFilter('BARU')}
              className={`p-3.5 rounded-xl border text-left transition ${
                activeFilter === 'BARU'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-emerald-600 mb-1">
                <span className="text-[11px] font-bold">DATA BARU</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {analysisResult.summary.newCount}
              </div>
              <span className="text-[10px] text-slate-400">Siap diimport ke sistem</span>
            </button>

            <button
              onClick={() => setActiveFilter('DIPERBARUI')}
              className={`p-3.5 rounded-xl border text-left transition ${
                activeFilter === 'DIPERBARUI'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-amber-600 mb-1">
                <span className="text-[11px] font-bold">DIPERBARUI</span>
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {analysisResult.summary.updatedCount}
              </div>
              <span className="text-[10px] text-slate-400">Terdapat perbedaan nilai</span>
            </button>

            <button
              onClick={() => setActiveFilter('ALL')}
              className={`p-3.5 rounded-xl border text-left transition ${
                activeFilter === 'ALL'
                  ? 'border-slate-500 bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-400/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold">SAMA PERSIS</span>
                <Check className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {analysisResult.summary.sameCount}
              </div>
              <span className="text-[10px] text-slate-400">Identik (Otomatis dilewati)</span>
            </button>

            <button
              onClick={() => setActiveFilter('KONFLIK')}
              className={`p-3.5 rounded-xl border text-left transition ${
                activeFilter === 'KONFLIK'
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 ring-2 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-rose-600 mb-1">
                <span className="text-[11px] font-bold">KONFLIK</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {analysisResult.summary.conflictCount}
              </div>
              <span className="text-[10px] text-slate-400">NIK di KK lain / tidak valid</span>
            </button>

            <button
              onClick={() => setActiveFilter('TIDAK_DITEMUKAN')}
              className={`p-3.5 rounded-xl border text-left transition ${
                activeFilter === 'TIDAK_DITEMUKAN'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-blue-600 mb-1">
                <span className="text-[11px] font-bold">PERLU DIPERIKSA</span>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {analysisResult.summary.missingCount}
              </div>
              <span className="text-[10px] text-slate-400">Di DB ada, di berkas hilang</span>
            </button>
          </div>

          {/* Validation Warnings if any */}
          {analysisResult.validationErrors.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Peringatan Format Berkas ({analysisResult.validationErrors.length} baris):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] max-h-24 overflow-y-auto">
                {analysisResult.validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Control & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {(['ALL', 'BARU', 'DIPERBARUI', 'KONFLIK', 'TIDAK_DITEMUKAN'] as const).map((filterVal) => (
                <button
                  key={filterVal}
                  onClick={() => setActiveFilter(filterVal)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    activeFilter === filterVal
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {filterVal === 'ALL' ? 'Semua Data' : filterVal.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Bulk Action Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('DIPERBARUI', 'UPDATE')}
                className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-bold transition"
              >
                Set Perbarui Semua Nilai
              </button>
              <button
                onClick={() => handleBulkAction('DIPERBARUI', 'SKIP')}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold transition"
              >
                Set Lewati Semua Perubahan
              </button>
            </div>
          </div>

          {/* List of KK and Member Diff Cards */}
          <div className="space-y-4">
            {filteredKKItems.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Tidak ada data yang cocok dengan filter &quot;{activeFilter}&quot;.
              </div>
            ) : (
              filteredKKItems.map((kk) => {
                const isExpanded = !!expandedKKs[kk.no_kk];

                return (
                  <div
                    key={kk.no_kk}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition"
                  >
                    {/* KK Card Header */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-start sm:items-center gap-3">
                        <button
                          onClick={() => toggleExpandKK(kk.no_kk)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 mt-0.5 sm:mt-0"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900 dark:text-white tracking-wide">
                              KK: {kk.no_kk}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                kk.status === 'BARU'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : kk.status === 'DIPERBARUI'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : kk.status === 'KONFLIK'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {kk.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Kepala: {kk.kepala_keluarga}
                            </span>
                            <span>&bull;</span>
                            <span>{kk.alamat} (RT {kk.rt} / RW {kk.rw})</span>
                            <span>&bull;</span>
                            <span>Hunian: {kk.status_hunian}</span>
                            <span>&bull;</span>
                            <span className="font-bold text-emerald-600">
                              {kk.members.length} Anggota
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Per-KK Action Selector */}
                      <div className="flex items-center gap-2 pl-9 sm:pl-0">
                        <span className="text-[11px] text-slate-400 font-semibold">Tindakan KK:</span>
                        <select
                          value={kk.action}
                          onChange={(e) => handleKKActionChange(kk.no_kk, e.target.value as any)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-800 ${
                            kk.action === 'CREATE'
                              ? 'text-emerald-700 border-emerald-300 dark:border-emerald-800'
                              : kk.action === 'UPDATE'
                              ? 'text-amber-700 border-amber-300 dark:border-amber-800'
                              : 'text-slate-600 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {kk.status === 'BARU' && <option value="CREATE">Import KK Baru</option>}
                          {kk.status === 'DIPERBARUI' && <option value="UPDATE">Perbarui Data KK</option>}
                          <option value="SKIP">Lewati (Skip)</option>
                        </select>
                      </div>
                    </div>

                    {/* KK Diffs if any */}
                    {kk.diffs.length > 0 && (
                      <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40 text-xs">
                        <strong className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-1">
                          Perubahan pada Atribut Kartu Keluarga:
                        </strong>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {kk.diffs.map((d, idx) => (
                            <div key={idx} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800 text-[11px]">
                              <span className="text-slate-400 block text-[10px]">{d.fieldLabel}:</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="line-through text-rose-500">{d.oldValue}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-bold text-emerald-600">{d.newValue}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Member Cards / Table */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="space-y-2.5">
                          {kk.members.map((m) => (
                            <div
                              key={m.id}
                              className={`p-3.5 rounded-xl border transition ${
                                m.status === 'BARU'
                                  ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10'
                                  : m.status === 'DIPERBARUI'
                                  ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/10'
                                  : m.status === 'KONFLIK'
                                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                                  : m.status === 'TIDAK_DITEMUKAN'
                                  ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/10'
                                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                                <div className="space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                                      {m.nama_lengkap}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-500">
                                      NIK: {m.nik}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                        m.status === 'BARU'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : m.status === 'DIPERBARUI'
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                          : m.status === 'KONFLIK'
                                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                          : m.status === 'TIDAK_DITEMUKAN'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                      }`}
                                    >
                                      {m.status === 'TIDAK_DITEMUKAN' ? 'PERLU DIPERIKSA' : m.status}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {m.status_hubungan}
                                    </span>
                                    <span>&bull;</span>
                                    <span>{m.jenis_kelamin}</span>
                                    <span>&bull;</span>
                                    <span>Lahir: {m.tempat_lahir}, {m.tanggal_lahir}</span>
                                    <span>&bull;</span>
                                    <span>Pekerjaan: {m.pekerjaan}</span>
                                  </div>
                                </div>

                                {/* Member Action Selector */}
                                <div className="flex items-center gap-2">
                                  {m.status === 'KONFLIK' ? (
                                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Dilewati (Konflik)
                                    </span>
                                  ) : m.status === 'TIDAK_DITEMUKAN' ? (
                                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
                                      Tetap Dipertahankan di DB
                                    </span>
                                  ) : (
                                    <select
                                      value={m.action}
                                      onChange={(e) => handleMemberActionChange(kk.no_kk, m.nik, e.target.value as any)}
                                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border bg-white dark:bg-slate-800 ${
                                        m.action === 'CREATE'
                                          ? 'text-emerald-700 border-emerald-300'
                                          : m.action === 'UPDATE'
                                          ? 'text-amber-700 border-amber-300'
                                          : 'text-slate-600 border-slate-300'
                                      }`}
                                    >
                                      {m.status === 'BARU' && <option value="CREATE">Import Warga Baru</option>}
                                      {m.status === 'DIPERBARUI' && (
                                        <>
                                          <option value="UPDATE">Perbarui Data Warga</option>
                                          <option value="SKIP">Pertahankan Data Lama (Skip)</option>
                                        </>
                                      )}
                                      {m.status === 'SAMA' && <option value="SKIP">Lewati (Sama Persis)</option>}
                                    </select>
                                  )}
                                </div>
                              </div>

                              {/* Conflict Message */}
                              {m.conflictReason && (
                                <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-1.5 border border-rose-200 dark:border-rose-900">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                  <span>{m.conflictReason}</span>
                                </div>
                              )}

                              {/* Member Diffs (Old vs New) */}
                              {m.diffs.length > 0 && (
                                <div className="mt-2.5 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800 text-[11px] space-y-1.5">
                                  <span className="font-bold text-amber-800 dark:text-amber-300 block text-[10px] uppercase tracking-wider">
                                    Rincian Perbedaan Data ({m.diffs.length} Kolom Berubah):
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {m.diffs.map((d, i) => (
                                      <div key={i} className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-400 block text-[10px]">{d.fieldLabel}:</span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="line-through text-rose-500 truncate" title={d.oldValue}>
                                            {d.oldValue}
                                          </span>
                                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="font-bold text-emerald-600 truncate" title={d.newValue}>
                                            {d.newValue}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Execution Bar */}
          <div className="sticky bottom-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white">Siap Disimpan: </span>
              Periksa ringkasan di atas. Klik tombol konfirmasi untuk menerapkan perubahan data secara permanen.
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAnalysisResult(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal &amp; Pilih File Lain
              </button>

              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Perubahan ke Database</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && analysisResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Konfirmasi Eksekusi Import Data
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sistem akan memproses data sesuai aksi yang Anda pilih pada layar tinjauan:
            </p>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Total Kartu Keluarga Baru / Diperbarui:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {analysisResult.kkItems.filter((k) => k.action === 'CREATE' || k.action === 'UPDATE').length} KK
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Warga Baru yang Akan Didaftarkan:</span>
                <span className="font-bold text-emerald-600">
                  {analysisResult.kkItems.flatMap((k) => k.members).filter((m) => m.action === 'CREATE').length} Jiwa
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Warga yang Akan Diperbarui Nilainya:</span>
                <span className="font-bold text-amber-600">
                  {analysisResult.kkItems.flatMap((k) => k.members).filter((m) => m.action === 'UPDATE').length} Jiwa
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Data dengan aksi Lewati / Konflik:</span>
                <span>Tidak akan diubah di database</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
              >
                Kembali Periksa
              </button>

              <button
                onClick={handleExecuteImport}
                disabled={executing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 transition shadow-md disabled:opacity-50"
              >
                {executing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ya, Eksekusi Simpan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
