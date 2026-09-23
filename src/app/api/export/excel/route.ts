import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generatePopulationExcelReport } from '@/lib/excel-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const gender = searchParams.get('gender') || '';
    const rt = searchParams.get('rt') || '';
    const rw = searchParams.get('rw') || '';

    // Build filter query for warga
    const whereWarga: any = {};

    if (status && status !== 'SEMUA') {
      whereWarga.status_warga = status;
    }

    if (gender && gender !== 'SEMUA') {
      whereWarga.jenis_kelamin = gender;
    }

    if (search) {
      whereWarga.OR = [
        { nama_lengkap: { contains: search } },
        { nik: { contains: search } },
        { no_kk: { contains: search } },
        { pekerjaan: { contains: search } },
        { tempat_lahir: { contains: search } },
      ];
    }

    if (rt || rw) {
      whereWarga.kartu_keluarga = {};
      if (rt) whereWarga.kartu_keluarga.rt = rt;
      if (rw) whereWarga.kartu_keluarga.rw = rw;
    }

    // Fetch warga with relation to KK
    const wargaList = await prisma.warga.findMany({
      where: whereWarga,
      include: {
        kartu_keluarga: true,
      },
      orderBy: [
        { no_kk: 'asc' },
        { status_hubungan: 'asc' },
      ],
    });

    // Fetch all KK (filtered by rt/rw if provided)
    const whereKK: any = {};
    if (rt) whereKK.rt = rt;
    if (rw) whereKK.rw = rw;

    const kkList = await prisma.kartuKeluarga.findMany({
      where: whereKK,
      include: {
        anggota: true,
      },
      orderBy: { no_kk: 'asc' },
    });

    const excelBuffer = await generatePopulationExcelReport(wargaList, kkList, {
      search,
      status,
      gender,
      rt,
      rw,
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Rekapitulasi-Data-Kependudukan-RT003-${timestamp}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Export Excel Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
