import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'RT 3 Istimewa | Kependudukan RT 03 RW 03',
  description: 'Sistem Informasi Kependudukan RT 3 Istimewa, RT 03 RW 03 Tambaksari Kidul.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <body className="min-h-full flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
        <Navbar />
        <main className="flex-1 pb-16">
          {children}
        </main>
        <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 print:hidden">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Logo RT 3 RW 3" className="w-5 h-5 rounded object-cover" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Pengurus RT 03 RW 03 &quot;Istimewa&quot;</span>
            </div>
            <div>
              &copy; {new Date().getFullYear()} RT 3 Istimewa &bull; Guyub, Rukun, Kompak, Peduli
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
