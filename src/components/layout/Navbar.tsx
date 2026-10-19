'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  ScanLine, 
  Home, 
  FileText, 
  History, 
  UserCheck, 
  Menu, 
  X, 
  UploadCloud, 
  Smartphone, 
  Check, 
  Globe,
  RefreshCw,
  Laptop,
  Lock,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [syncState, setSyncState] = useState<{
    needsSync: boolean;
    lastSyncedAt: string | null;
    isCloud?: boolean;
  }>({
    needsSync: false,
    lastSyncedAt: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
    name: string;
  } | null>(null);

  // Deteksi lingkungan: Web Publik (Vercel) vs Aplikasi Lokal (Desktop)
  const isPublicWeb =
    process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true' ||
    (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'));

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      window.location.href = '/publik';
    } catch {
      window.location.href = '/publik';
    }
  };

  const fetchSyncStatus = useCallback(async () => {
    if (isPublicWeb) return;
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data.success) {
        setSyncState({
          needsSync: Boolean(data.needsSync),
          lastSyncedAt: data.lastSyncedAt || null,
          isCloud: data.isCloud,
        });
      }
    } catch {
      // ignore
    }
  }, [isPublicWeb]);

  const fetchPending = useCallback(async () => {
    if (isPublicWeb) return;
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data.success) {
        setPendingCount(data.data.totalPendingScan || 0);
      }
    } catch {
      // ignore
    }
  }, [isPublicWeb]);

  const fetchSystemInfo = useCallback(async () => {
    if (isPublicWeb) return;
    try {
      const res = await fetch('/api/system-info');
      const data = await res.json();
      if (data.success && data.localIp && data.localIp !== '127.0.0.1') {
        setMobileUrl(data.mobileUrl);
      }
    } catch {
      // ignore
    }
  }, [isPublicWeb]);

  useEffect(() => {
    fetchCurrentUser();
    if (!isPublicWeb) {
      fetchSyncStatus();
      fetchPending();
      fetchSystemInfo();
      const interval = setInterval(() => {
        fetchSyncStatus();
        fetchPending();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [pathname, isPublicWeb, fetchCurrentUser, fetchSyncStatus, fetchPending, fetchSystemInfo]);

  const handleCopyMobileUrl = () => {
    if (!mobileUrl) return;
    navigator.clipboard.writeText(mobileUrl);
    setCopiedMobile(true);
    setTimeout(() => setCopiedMobile(false), 2500);
  };

  const handleSyncToCloud = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}\nTotal data disinkronkan: ${data.counts?.warga || 0} Warga, ${data.counts?.kk || 0} KK.`);
        await fetchSyncStatus();
      } else {
        alert(`⚠️ Sinkronisasi Gagal: ${data.error || 'Terjadi kesalahan sistem.'}`);
      }
    } catch (err: any) {
      alert(`⚠️ Gagal terhubung: Pastikan laptop terhubung ke internet.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const isAdminLoggedIn = Boolean(currentUser && currentUser.role === 'ADMIN');
  const showAdminMenu = !isPublicWeb || isAdminLoggedIn;

  interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | null;
  }

  const adminNavItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: Home },
    { 
      href: '/scan', 
      label: 'Scan KK', 
      icon: ScanLine,
      badge: pendingCount > 0 ? pendingCount : null
    },
    { href: '/warga', label: 'Data Warga', icon: Users },
    { href: '/kk', label: 'Kartu Keluarga', icon: UserCheck },
    { href: '/mutasi', label: 'Mutasi', icon: History },
    { href: '/import', label: 'Import', icon: UploadCloud },
    { href: '/publik', label: 'Web Publik', icon: Globe },
  ];

  const publicNavItems: NavItem[] = [
    { href: '/', label: 'Dashboard Informasi', icon: Home },
    { href: '/publik', label: 'Data Warga (Publik)', icon: Globe },
  ];

  // Navigasi: Sisi Publik vs Sisi Lokal Administratif (atau Admin saat login online)
  const navItems: NavItem[] = showAdminMenu ? adminNavItems : publicNavItems;

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md border-b border-slate-800 w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          
          {/* Logo & Judul RT */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-2.5 group shrink-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-md border border-amber-500/40 bg-white/10 shrink-0 group-hover:scale-105 transition">
              <img 
                src="/logo.jpg" 
                alt="Logo RT 3 RW 3 Istimewa" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="shrink-0 flex flex-col justify-center">
              <div className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-black text-white tracking-tight">RT 3 ISTIMEWA</span>
                <span className="text-[10px] sm:text-[11px] bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-semibold whitespace-nowrap">
                  RT 03 / RW 03
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap hidden xl:block">
                {isPublicWeb
                  ? isAdminLoggedIn
                    ? 'Portal Administrasi Online Pengurus RT'
                    : 'Portal Informasi Publik Warga RT'
                  : 'Aplikasi Pengelolaan Data Lokal (Offline-Ready)'}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-1 xl:space-x-1.5 px-2 xl:px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] xl:text-xs font-bold bg-amber-500 text-slate-950 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Sisi Publik vs Sisi Lokal */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0">
            {isPublicWeb ? (
              // Tampilan pada Web Publik
              <div className="flex items-center gap-1.5 xl:gap-2">
                {isAdminLoggedIn ? (
                  <>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold whitespace-nowrap">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>kangmasngud (admin)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-xs font-semibold transition shrink-0 shadow-sm"
                      title="Keluar dari sesi Admin"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Keluar</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Publik</span>
                    </div>
                    <Link
                      href="/login?redirect=/warga"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md transition shrink-0"
                    >
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Portal Admin</span>
                    </Link>
                  </>
                )}
              </div>
            ) : (
              // Tampilan pada Aplikasi Lokal Desktop
              <div className="flex items-center gap-2">
                {/* Tombol Sinkronisasi ke Web Publik */}
                <button
                  type="button"
                  onClick={handleSyncToCloud}
                  disabled={isSyncing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition ${
                    syncState.needsSync
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                  title={
                    syncState.needsSync
                      ? 'Data lokal belum disinkronkan ke Web Publik. Klik untuk sinkronkan!'
                      : 'Data lokal sudah sinkron dengan Web Publik.'
                  }
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncing
                      ? 'Menyinkronkan...'
                      : syncState.needsSync
                      ? 'Sinkronkan ke Web Publik'
                      : 'Data Tersinkron'}
                  </span>
                </button>

                {/* Indikator Mode Lokal */}
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lokal</span>
                </div>

                {/* Akses HP Jaringan Lokal */}
                {mobileUrl && (
                  <button
                    type="button"
                    onClick={handleCopyMobileUrl}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition"
                    title={`Alamat Akses HP Lokal: ${mobileUrl}`}
                  >
                    {copiedMobile ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="text-[11px] font-medium text-emerald-300">
                      {copiedMobile ? 'Tersalin' : 'HP'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            {!isPublicWeb && pendingCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full animate-pulse">
                {pendingCount} Antrean
              </span>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900/98 backdrop-blur-md border-b border-slate-800 px-3 pt-2 pb-4 space-y-1.5 animate-fade-in shadow-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-emerald-500" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Aksi di Mobile jika di Web Publik */}
          {isPublicWeb && (
            <div className="pt-2 border-t border-slate-800 mt-2 space-y-2">
              {isAdminLoggedIn ? (
                <>
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>kangmasngud (admin)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold text-rose-200 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Akun Admin</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login?redirect=/warga"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg transition"
                >
                  <Lock className="w-4 h-4" />
                  <span>Portal Pengurus RT (Login Admin)</span>
                </Link>
              )}
            </div>
          )}

          {/* Tombol Sinkronisasi di Mobile jika di mode lokal */}
          {!isPublicWeb && (
            <div className="pt-2 border-t border-slate-800 mt-2 space-y-2">
              <button
                type="button"
                onClick={handleSyncToCloud}
                disabled={isSyncing}
                className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md transition ${
                  syncState.needsSync
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing
                    ? 'Sedang Menyinkronkan...'
                    : syncState.needsSync
                    ? 'Sinkronkan ke Web Publik Sekarang'
                    : 'Data Lokal Sudah Tersinkron'}
                </span>
              </button>

              {mobileUrl && (
                <button
                  type="button"
                  onClick={handleCopyMobileUrl}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 transition"
                >
                  <div className="flex items-center gap-2">
                    {copiedMobile ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-slate-400">Akses HP:</span>
                    <span className="font-mono text-emerald-300 font-semibold">{mobileUrl}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 font-semibold text-emerald-400">
                    {copiedMobile ? 'Tersalin' : 'Salin'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
