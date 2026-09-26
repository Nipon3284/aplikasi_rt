import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'si-warga-rt-secret-key-2026-istimewa-rw03-rt03';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = 'si_warga_token';

// Rute Halaman yang HANYA BOLEH DIAKSES OLEH PENGURUS RT (ADMIN)
const PROTECTED_PAGES = [
  '/scan',
  '/kk',
  '/mutasi',
  '/surat',
  '/import',
  '/warga', // Database warga lengkap (ada NIK & tombol edit)
];

// Rute API yang Memerlukan Otorisasi Admin
const PROTECTED_API_PREFIXES = [
  '/api/scan',
  '/api/kk',
  '/api/mutasi',
  '/api/surat',
  '/api/import',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati file statis, gambar, internal next, dll.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/publik') ||
    pathname === '/api/system-info' ||
    pathname === '/api/dashboard' ||
    pathname === '/login' ||
    pathname === '/publik' ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

  // Ambil token dari cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload && payload.role === 'ADMIN') {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. Cek Proteksi Halaman Admin
  const isProtectedPage = PROTECTED_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  );

  if (isProtectedPage && !isAuthenticated) {
    // Jika warga umum mencoba buka /warga, arahkan ke web warga /publik
    if (pathname === '/warga') {
      return NextResponse.redirect(new URL('/publik', request.url));
    }

    // Untuk halaman scan/kk/mutasi/surat/import, arahkan ke login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Cek Proteksi API Admin
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Jika API sensitif atau mutasi pada /api/warga
  const isWargaMutation =
    pathname.startsWith('/api/warga') && request.method !== 'GET';

  if ((isProtectedApi || isWargaMutation) && !isAuthenticated) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Akses ditolak. Anda harus login sebagai Pengurus RT.',
      },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
