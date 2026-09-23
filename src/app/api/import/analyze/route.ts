import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeImportSpreadsheet } from '@/lib/excel-service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Berkas belum dipilih' }, { status: 400 });
    }

    const filename = file.name;
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return NextResponse.json(
        { success: false, error: 'Format berkas tidak didukung. Harap unggah file .xlsx, .xls, atau .csv' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ambil data database eksisting untuk komparasi diff
    const [existingKKs, existingWargas] = await Promise.all([
      prisma.kartuKeluarga.findMany({
        include: {
          anggota: true,
        },
      }),
      prisma.warga.findMany(),
    ]);

    const result = await analyzeImportSpreadsheet(buffer, filename, existingKKs, existingWargas);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Import Analyze Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menganalisis berkas import' },
      { status: 500 }
    );
  }
}
