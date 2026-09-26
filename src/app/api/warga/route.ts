import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { markNeedsSync } from '@/lib/sync-state';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const gender = searchParams.get('gender') || '';

    const where: any = {};

    if (status && status !== 'SEMUA') {
      where.status_warga = status;
    }

    if (gender && gender !== 'SEMUA') {
      where.jenis_kelamin = gender;
    }

    if (search.trim()) {
      where.OR = [
        { nama_lengkap: { contains: search } },
        { nik: { contains: search } },
        { no_kk: { contains: search } },
      ];
    }

    const warga = await prisma.warga.findMany({
      where,
      include: {
        kartu_keluarga: {
          select: {
            alamat: true,
            rt: true,
            rw: true,
            no_rumah: true,
            blok: true,
            status_hunian: true,
          },
        },
      },
      orderBy: { nama_lengkap: 'asc' },
    });

    return NextResponse.json({ success: true, data: warga });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await prisma.warga.create({
      data: body,
    });
    markNeedsSync();
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

