import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { markNeedsSync } from '@/lib/sync-state';

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

    // Cari berkas scan terverifikasi yang cocok dengan no_kk ini
    const scanDoc = await prisma.scanQueue.findFirst({
      where: {
        no_kk_result: params.no_kk,
        status: 'VERIFIED',
      },
      orderBy: {
        verified_at: 'desc',
      },
    });

    const scanData = scanDoc ? {
      id: scanDoc.id,
      image_url: scanDoc.image_url,
      filename: scanDoc.filename,
      file_type: scanDoc.image_url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
      verified_at: scanDoc.verified_at,
      confidence_score: scanDoc.confidence_score,
    } : null;

    return NextResponse.json({ 
      success: true, 
      data: {
        ...kk,
        scan_document: scanData,
      } 
    });
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
    markNeedsSync();
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
    await prisma.$transaction(async (tx: any) => {
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

    markNeedsSync();

    return NextResponse.json({ success: true, message: 'Kartu Keluarga beserta anggota berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
