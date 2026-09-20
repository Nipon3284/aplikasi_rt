import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { no_kk: { contains: search } },
        { kepala_keluarga: { contains: search } },
        { alamat: { contains: search } },
        { blok: { contains: search } },
      ];
    }

    const kks = await prisma.kartuKeluarga.findMany({
      where,
      include: {
        anggota: {
          select: {
            nik: true,
            nama_lengkap: true,
            status_hubungan: true,
            status_warga: true,
            jenis_kelamin: true,
          },
        },
      },
      orderBy: { kepala_keluarga: 'asc' },
    });

    return NextResponse.json({ success: true, data: kks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await prisma.kartuKeluarga.create({
      data: body,
    });
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
