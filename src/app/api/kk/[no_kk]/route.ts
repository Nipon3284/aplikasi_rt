import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { no_kk: string } }
) {
  try {
    const kk = await prisma.kartuKeluarga.findUnique({
      where: { no_kk: params.no_kk },
      include: {
        anggota: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!kk) {
      return NextResponse.json({ success: false, error: 'Kartu Keluarga tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: kk });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { no_kk: string } }
) {
  try {
    const body = await req.json();
    const updated = await prisma.kartuKeluarga.update({
      where: { no_kk: params.no_kk },
      data: body,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { no_kk: string } }
) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Hapus mutasi warga terkait KK ini
      await tx.riwayatMutasi.deleteMany({
        where: { no_kk: params.no_kk },
      });

      // 2. Lepas relasi antrean scan
      await tx.scanQueue.updateMany({
        where: { no_kk_result: params.no_kk },
        data: { no_kk_result: null },
      });

      // 3. Hapus seluruh anggota warga di KK ini
      await tx.warga.deleteMany({
        where: { no_kk: params.no_kk },
      });

      // 4. Hapus Kartu Keluarga
      await tx.kartuKeluarga.delete({
        where: { no_kk: params.no_kk },
      });
    });

    return NextResponse.json({ success: true, message: 'Kartu Keluarga beserta anggota berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
