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
  X
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { 
      href: '/scan', 
      label: 'Scan & Verifikasi KK', 
      icon: ScanLine,
      badge: pendingCount > 0 ? pendingCount : null
    },
    { href: '/warga', label: 'Data Warga', icon: Users },
    { href: '/kk', label: 'Kartu Keluarga', icon: UserCheck },
    { href: '/mutasi', label: 'Riwayat Mutasi', icon: History },
    { href: '/surat', label: 'Surat Pengantar', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md border border-amber-500/40 bg-white/10 shrink-0 group-hover:scale-105 transition">
              <img 
                src="/logo.jpg" 
                alt="Logo RT 3 RW 3 Istimewa" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-bold text-base tracking-wide flex items-center gap-2">
                <span>SI-WARGA RT</span>
                <span className="text-[11px] bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-semibold">
                  RT 03 / RW 03
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium hidden sm:block">RT 3 RW 3 Istimewa &bull; Guyub - Rukun - Kompak</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-1.5">
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-500 text-slate-950 rounded-full">
                {pendingCount} Antrean
              </span>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 pt-2 pb-4 space-y-1.5 animate-fade-in shadow-2xl">
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
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
