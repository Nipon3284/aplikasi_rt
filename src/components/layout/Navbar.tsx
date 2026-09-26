'use client';

import React, { useState, useEffect } from 'react';
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
  Lock,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface AuthUser {
  username: string;
  role: 'ADMIN' | 'WARGA';
  name: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const fetchAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data.success) {
        setPendingCount(data.data.totalPendingScan || 0);
      }
    } catch {
      // ignore
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('/api/system-info');
      const data = await res.json();
      if (data.success && data.localIp && data.localIp !== '127.0.0.1') {
        setMobileUrl(data.mobileUrl);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAuth();
    fetchPending();
    fetchSystemInfo();
    const interval = setInterval(() => {
      fetchPending();
    }, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleCopyMobileUrl = () => {
    if (!mobileUrl) return;
    navigator.clipboard.writeText(mobileUrl);
    setCopiedMobile(true);
    setTimeout(() => setCopiedMobile(false), 2500);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/publik';
    } catch (err) {
      console.error(err);
    }
  };

  // Navigasi Terpisah: Khusus Admin vs Warga Publik
  const navItems = user?.role === 'ADMIN' ? [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/publik', label: 'Web Warga', icon: Globe },
    { 
      href: '/scan', 
      label: 'Scan KK', 
      icon: ScanLine,
      badge: pendingCount > 0 ? pendingCount : null
    },
    { href: '/warga', label: 'Data Warga', icon: Users },
    { href: '/kk', label: 'Kartu Keluarga', icon: UserCheck },
    { href: '/mutasi', label: 'Mutasi', icon: History },
    { href: '/surat', label: 'Surat', icon: FileText },
    { href: '/import', label: 'Import', icon: UploadCloud },
  ] : [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/publik', label: 'Data Warga (Publik)', icon: Globe },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Judul RT (Anti-wrapping, shrink-0) */}
          <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group shrink-0">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-md border border-amber-500/40 bg-white/10 shrink-0 group-hover:scale-105 transition">
              <img 
                src="/logo.jpg" 
                alt="Logo RT 3 RW 3 Istimewa" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="shrink-0 flex flex-col justify-center">
              <div className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                <span>SI-WARGA RT</span>
                <span className="text-[10px] sm:text-[11px] bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-500/40 font-semibold whitespace-nowrap">
                  RT 03 / RW 03
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap hidden md:block">
                RT 3 RW 3 Istimewa &bull; Guyub - Rukun - Kompak
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
                  className={`relative flex items-center space-x-1.5 xl:space-x-2 px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-lg text-xs xl:text-sm font-medium transition whitespace-nowrap ${
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

          {/* Right Action: Auth Status & Tombol Login/Logout */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {user?.role === 'ADMIN' ? (
              <div className="flex items-center gap-2">
                <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin: {user.username}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
                  title="Keluar dari sesi Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login Pengurus</span>
              </Link>
            )}

            {/* Tombol Ringkas Akses HP jika ada */}
            {mobileUrl && (
              <button
                type="button"
                onClick={handleCopyMobileUrl}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition"
                title={`Alamat HP: ${mobileUrl}`}
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

          {/* Mobile Menu Button (Muncul di layar < lg) */}
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            {pendingCount > 0 && user?.role === 'ADMIN' && (
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

          {/* Tombol Auth di Mobile Dropdown */}
          <div className="pt-2 border-t border-slate-800 mt-2">
            {user?.role === 'ADMIN' ? (
              <div className="space-y-2">
                <div className="px-3.5 py-2 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/40 rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Login sebagai: {user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold transition hover:bg-rose-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Akun Pengurus</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md transition"
              >
                <Lock className="w-4 h-4" />
                <span>Masuk Portal Pengurus RT</span>
              </Link>
            )}
          </div>

          {/* Akses HP di menu mobile */}
          {mobileUrl && (
            <button
              type="button"
              onClick={handleCopyMobileUrl}
              className="w-full mt-2 flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 transition"
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
    </header>
  );
}
