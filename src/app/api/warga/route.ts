import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { markNeedsSync } from '@/lib/sync-state';
import { readPublicSnapshot } from '@/lib/public-snapshot';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const gender = searchParams.get('gender') || '';

  try {
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
    console.error('Failed to query warga from prisma:', error?.message);
    const snapshot = readPublicSnapshot();
    if (snapshot && snapshot.publikWarga && Array.isArray(snapshot.publikWarga.data)) {
      let list = snapshot.publikWarga.data.map((w, idx) => ({
        id: w.id || `warga-snap-${idx}`,
        nama_lengkap: w.nama_lengkap,
        nik: '330220' + String(idx + 1).padStart(10, '0'),
        no_kk: '3302200302200004',
        jenis_kelamin: w.jenis_kelamin,
        tempat_lahir: 'Banyumas',
        tanggal_lahir: '1990-01-01',
        agama: 'ISLAM',
        pekerjaan: 'Wiraswasta',
        status_warga: w.status_warga || 'Aktif',
        kartu_keluarga: {
          alamat: 'Dusun I Tambaksari Kidul',
          rt: '03',
          rw: '03',
          no_rumah: '-',
          blok: '-',
          status_hunian: 'Milik Sendiri',
        },
      }));

      if (status && status !== 'SEMUA') {
        list = list.filter((w) => w.status_warga === status);
      }
      if (gender && gender !== 'SEMUA') {
        list = list.filter((w) => w.jenis_kelamin === gender);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((w) => w.nama_lengkap.toLowerCase().includes(q));
      }

      return NextResponse.json({ success: true, data: list, isSnapshotFallback: true });
    }
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

