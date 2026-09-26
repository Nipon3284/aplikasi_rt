import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { markNeedsSync } from '@/lib/sync-state';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jenis = searchParams.get('jenis');

    const where: any = {};
    if (jenis && jenis !== 'SEMUA') {
      where.jenis_mutasi = jenis;
    }

    const mutasi = await prisma.riwayatMutasi.findMany({
      where,
      orderBy: { tanggal_kejadian: 'desc' },
      include: {
        warga: {
          select: {
            nik: true,
            nama_lengkap: true,
            jenis_kelamin: true,
            kartu_keluarga: {
              select: {
                alamat: true,
                no_rumah: true,
                blok: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: mutasi });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nik,
      nama_warga,
      no_kk,
      jenis_mutasi,
      tanggal_kejadian,
      keterangan,
      no_surat,
      pindah_seluruh_kk,
    } = body;

    if (!nama_warga || !jenis_mutasi || !tanggal_kejadian) {
      return NextResponse.json(
        { success: false, error: 'Nama warga, jenis mutasi, dan tanggal wajib diisi' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Simpan catatan mutasi
      const mutasi = await tx.riwayatMutasi.create({
        data: {
          nik: nik || null,
          nama_warga: nama_warga,
          no_kk: no_kk || null,
          jenis_mutasi: jenis_mutasi,
          tanggal_kejadian: tanggal_kejadian,
          keterangan: keterangan || '',
          no_surat: no_surat || '',
          dicatat_oleh: 'Ketua RT',
        },
      });

      // 2. Perbarui status warga di master data
      if (jenis_mutasi === 'Kematian' && nik) {
        await tx.warga.update({
          where: { nik },
          data: { status_warga: 'Meninggal' },
        });
      } else if (jenis_mutasi === 'Pindah Keluar') {
        if (pindah_seluruh_kk && no_kk) {
          // Pindah seluruh anggota dalam 1 KK
          await tx.warga.updateMany({
            where: { no_kk },
            data: { status_warga: 'Pindah' },
          });
        } else if (nik) {
          // Pindah individu
          await tx.warga.update({
            where: { nik },
            data: { status_warga: 'Pindah' },
          });
        }
      }

      return mutasi;
    });

    markNeedsSync();

    return NextResponse.json({
      success: true,
      message: `Riwayat ${jenis_mutasi} berhasil dicatat dan status kependudukan diperbarui`,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
