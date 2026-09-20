'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ScanUploader from '@/components/scan-verifier/ScanUploader';
import { 
  Clock, 
  ArrowRight, 
  RotateCcw,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function ScanPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = async () => {
    try {
      const res = await fetch('/api/scan');
      const data = await res.json();
      if (data.success) {
        setScans(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const pendingScans = scans.filter((s) => s.status === 'PENDING');
  const finishedScans = scans.filter((s) => s.status !== 'PENDING');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Upload Box */}
      <ScanUploader />

      {/* Antrean Verifikasi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Antrean Menunggu Verifikasi Manual ({pendingScans.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Dokumen yang baru discan harus dicek oleh Ketua RT / Petugas sebelum tersimpan permanen di database.
            </p>
          </div>

          <button
            onClick={fetchScans}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Refresh Antrean"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data antrean...</div>
        ) : pendingScans.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Semua dokumen scan sudah selesai diverifikasi
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Silakan unggah atau foto dokumen Kartu Keluarga baru di atas untuk mulai mendigitalkan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingScans.map((item) => {
              let parsed: any = {};
              try {
                parsed = JSON.parse(item.extracted_json);
              } catch {}

              const confidence = Math.round((item.confidence_score || 0.8) * 100);

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/50 p-4 shadow-sm space-y-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {parsed.no_kk || 'No. KK Belum Terdeteksi'}
                      </div>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {parsed.kepala_keluarga || 'Nama Kepala Keluarga'}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                      {confidence}% Jelas
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                    <div>{parsed.alamat || 'Alamat RT'}</div>
                    <div>{parsed.anggota?.length || 0} Anggota Keluarga Terbaca</div>
                    <div className="text-[10px] text-slate-400">
                      Discan: {new Date(item.created_at).toLocaleString('id-ID')}
                    </div>
                  </div>

                  <Link
                    href={`/scan/verify/${item.id}`}
                    className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <span>Buka Layar Verifikasi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Riwayat Scan Selesai */}
      {finishedScans.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Riwayat Scan yang Telah Diproses ({finishedScans.length})
          </h3>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
            {finishedScans.slice(0, 5).map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between flex-wrap gap-2">
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
                      className="text-emerald-600 hover:underline font-semibold"
                    >
                      Lihat Kartu Keluarga
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
