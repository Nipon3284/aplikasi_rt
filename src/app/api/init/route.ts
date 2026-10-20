import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

const isPublicWeb = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true';

export async function GET(req: NextRequest) {
  // Blokir seeding di web publik / produksi
  if (isPublicWeb || process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Endpoint init dinonaktifkan pada lingkungan produksi.' },
      { status: 403 }
    );
  }

  // Hanya izinkan dari localhost
  const host = req.headers.get('host') || '';
  const isLocalhost = host.startsWith('localhost:') || host.startsWith('127.0.0.1:');
  if (!isLocalhost) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak: Init hanya dapat dijalankan dari localhost.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const shouldSeed = searchParams.get('seed') === 'true';

    if (shouldSeed) {
      await seedDatabase();
      return NextResponse.json({ success: true, message: 'Database seeded' });
    }

    return NextResponse.json({ success: true, message: 'Database ready' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
