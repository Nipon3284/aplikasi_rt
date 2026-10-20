import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';

const isPublicWeb = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true';

export async function POST(req: NextRequest) {
  // Blokir endpoint destruktif ini di lingkungan produksi / web publik
  if (isPublicWeb || process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        error: 'Endpoint reset database dinonaktifkan pada lingkungan produksi demi keamanan data.',
      },
      { status: 403 }
    );
  }

  // Defense-in-Depth: verifikasi sesi admin
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Pada mode lokal, izinkan jika request datang dari localhost tanpa cookie (backward compat)
  const host = req.headers.get('host') || '';
  const isLocalhost = host.startsWith('localhost:') || host.startsWith('127.0.0.1:');
  if (!isLocalhost && (!session || session.role !== 'ADMIN')) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak: Hanya admin lokal yang dapat mereset database.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { reseed } = body;

    // Bersihkan semua tabel database
    await prisma.$transaction([
      prisma.scanQueue.deleteMany(),
      prisma.riwayatMutasi.deleteMany(),
      prisma.warga.deleteMany(),
      prisma.kartuKeluarga.deleteMany(),
    ]);

    if (reseed) {
      await seedDatabase();
      return NextResponse.json({
        success: true,
        message: 'Database berhasil direset dan diisi ulang dengan data template demo.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Seluruh database kependudukan berhasil direset dan sekarang dalam keadaan bersih/kosong.',
    });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
