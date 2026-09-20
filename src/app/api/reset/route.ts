import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function POST(req: NextRequest) {
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
