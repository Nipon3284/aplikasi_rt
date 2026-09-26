import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isPublicWeb =
  process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true';

// Rute Halaman Administratif
const ADMIN_PAGES = [
  '/scan',
  '/kk',
  '/mutasi',
  '/surat',
  '/import',
  '/warga', // Database warga lengkap (ada NIK & tombol edit)
];

// Rute API Administratif / Mutasi
const ADMIN_API_PREFIXES = [
  '/api/scan',
  '/api/kk',
  '/api/mutasi',
  '/api/surat',
  '/api/import',
  '/api/sync',
  '/api/auth',
  '/api/reset',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati file statis, gambar, internal next, dll.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

  // =========================================================================
  // 1. ATURAN WEB PUBLIK (ONLINE DI VERCEL)
  // =========================================================================
  if (isPublicWeb) {
    // Pada web publik: TIDAK ADA SISTEM LOGIN
    // Jika seseorang mencoba membuka /login, alihkan langsung ke Dashboard Publik
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Jika seseorang mencoba membuka halaman kelola admin, alihkan ke Data Warga Publik
    const isTryingAdminPage = ADMIN_PAGES.some(
      (page) => pathname === page || pathname.startsWith(`${page}/`)
    );
    if (isTryingAdminPage) {
      return NextResponse.redirect(new URL('/publik', request.url));
    }

    // Blokir mutasi pada /api/warga (POST/PUT/DELETE)
    const isWargaMutation =
      pathname.startsWith('/api/warga') && request.method !== 'GET';

    // Blokir seluruh API administratif
    const isTryingAdminApi = ADMIN_API_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (isTryingAdminApi || isWargaMutation) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Akses Ditolak: Situs web publik hanya berfungsi sebagai dashboard informasi read-only. Pengelolaan data hanya dapat dilakukan melalui Aplikasi Desktop Lokal.',
        },
        { status: 403 }
      );
    }

    // Izinkan akses rute publik (/publik, /api/publik/*, /api/dashboard, /)
    return NextResponse.next();
  }

  // =========================================================================
  // 2. ATURAN APLIKASI LOKAL (DESKTOP LAPTOP ADMIN)
  // =========================================================================
  // Pada laptop lokal pengurus RT, seluruh halaman dan API dapat diakses
  // secara langsung tanpa rintangan login yang berulang-ulang.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files & images
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
