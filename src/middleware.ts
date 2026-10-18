import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';

const isPublicWeb =
  process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true';

// Rute Halaman Administratif yang memerlukan autentikasi Admin
const ADMIN_PAGES = [
  '/scan',
  '/kk',
  '/mutasi',
  '/surat',
  '/import',
  '/warga', // Database warga lengkap (ada NIK & tombol edit)
];

// Rute API Administratif / Mutasi yang memerlukan hak akses Admin
const ADMIN_API_PREFIXES = [
  '/api/scan',
  '/api/kk',
  '/api/mutasi',
  '/api/surat',
  '/api/import',
  '/api/sync',
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
  // 1. ATURAN WEB ONLINE (VERCEL / PUBLIC WEB)
  // =========================================================================
  if (isPublicWeb) {
    // Ambil token sesi dari cookie HTTP-Only
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    const isAdmin = Boolean(session && session.role === 'ADMIN');

    // Jika admin sudah login dan membuka /login, arahkan ke data warga admin
    if (pathname === '/login') {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/warga', request.url));
      }
      return NextResponse.next();
    }

    // Periksa apakah mencoba mengakses halaman admin (/warga, /kk, /scan, dll)
    const isTryingAdminPage = ADMIN_PAGES.some(
      (page) => pathname === page || pathname.startsWith(`${page}/`)
    );

    if (isTryingAdminPage) {
      if (!isAdmin) {
        // Belum login: arahkan ke halaman login dengan parameter redirect
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Sudah login: izinkan akses penuh ke halaman admin
      return NextResponse.next();
    }

    // Periksa apakah mencoba mengakses API administratif
    const isWargaMutation =
      pathname.startsWith('/api/warga') && request.method !== 'GET';
    const isTryingAdminApi = ADMIN_API_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (isTryingAdminApi || isWargaMutation) {
      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Akses Ditolak: Anda harus login sebagai Pengurus RT untuk melakukan tindakan ini.',
          },
          { status: 401 }
        );
      }
      // Sudah login: izinkan request API admin
      return NextResponse.next();
    }

    // Rute publik (/ , /publik , /api/dashboard , /api/publik/* , /api/auth/*)
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
