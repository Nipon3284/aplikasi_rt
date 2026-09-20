import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { nik: string } }
) {
  try {
    const warga = await prisma.warga.findUnique({
      where: { nik: params.nik },
      include: {
        kartu_keluarga: true,
        mutasi: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!warga) {
      return NextResponse.json({ success: false, error: 'Warga tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: warga });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { nik: string } }
) {
  try {
    const body = await req.json();
    const updated = await prisma.warga.update({
      where: { nik: params.nik },
      data: body,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { nik: string } }
) {
  try {
    const warga = await prisma.warga.findUnique({
      where: { nik: params.nik },
    });

    if (!warga) {
      return NextResponse.json({ success: false, error: 'Warga tidak ditemukan' }, { status: 404 });
    }

    const no_kk = warga.no_kk;
    let kkDeleted = false;

    await prisma.$transaction(async (tx) => {
      // 1. Hapus riwayat mutasi terkait warga ini
      await tx.riwayatMutasi.deleteMany({
        where: { nik: params.nik },
      });

      // 2. Hapus data warga
      await tx.warga.delete({
        where: { nik: params.nik },
      });

      // 3. Cek apakah masih ada anggota keluarga tersisa di KK ini
      const sisaWarga = await tx.warga.count({
        where: { no_kk: no_kk },
      });

      // 4. Jika sudah tidak ada anggota tersisa (0 jiwa), hapus juga Kartu Keluarga tersebut
      if (sisaWarga === 0) {
        await tx.riwayatMutasi.deleteMany({
          where: { no_kk: no_kk },
        });

        // Lepas relasi scan queue jika ada
        await tx.scanQueue.updateMany({
          where: { no_kk_result: no_kk },
          data: { no_kk_result: null },
        });

        await tx.kartuKeluarga.delete({
          where: { no_kk: no_kk },
        });

        kkDeleted = true;
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: kkDeleted 
        ? 'Data warga berhasil dihapus, dan Kartu Keluarga kosong otomatis dihapus dari sistem.' 
        : 'Data warga berhasil dihapus permanen.',
      kkDeleted,
      no_kk
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
