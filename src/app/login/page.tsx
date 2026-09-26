'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Sparkles
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('kangmasngud');
  const [password, setPassword] = useState('kangmasngud123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isPublicWeb =
    process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true' ||
    (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'));

  useEffect(() => {
    // Pada web publik, sistem login dinonaktifkan sepenuhnya
    if (isPublicWeb) {
      router.replace('/');
    }
  }, [isPublicWeb, router]);

  if (isPublicWeb) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center text-slate-400 text-xs">
        Mengalihkan ke Dashboard Publik...
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Username atau password salah.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Login berhasil! Mengalihkan ke sistem...');
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 700);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal menghubungi server. Pastikan server aktif.');
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('kangmasngud');
    setPassword('kangmasngud123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        
        {/* Tombol Kembali ke Dashboard */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Dashboard</span>
        </Link>

        {/* Card Login */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Header Card */}
          <div className="text-center space-y-3">
            <div className="relative w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-lg border-2 border-amber-500/40 bg-white/10 group">
              <img 
                src="/logo.jpg" 
                alt="Logo RT 3 RW 3 Istimewa" 
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Portal Pengurus RT 003 / RW 003</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Masuk Sistem Admin Lokal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Akses penuh pengelolaan berkas KK, scan AI, mutasi, dan cetak surat
              </p>
            </div>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Alert Success */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Username Admin</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Masukkan username pengurus"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Kata Sandi (Password)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Memvalidasi...' : 'Masuk Sebagai Pengurus'}</span>
            </button>
          </form>

          {/* Quick Helper Kredensial */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Kredensial Default RT:</span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>kangmasngud / kangmasngud123</span>
            </button>
          </div>
        </div>

        {/* Footer info UU PDP */}
        <p className="text-center text-[11px] text-slate-400 leading-relaxed">
          Sistem Terproteksi UU PDP No. 27/2022. Data NIK, No KK, dan riwayat mutasi hanya dapat diakses oleh aparatur pengurus RT 03 RW 03 Istimewa yang berwenang.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex items-center justify-center text-slate-400 text-xs">
        Memuat...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
