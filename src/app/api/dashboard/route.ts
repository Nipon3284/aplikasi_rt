import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [
      totalKK,
      totalWargaAktif,
      totalWargaMeninggal,
      totalWargaPindah,
      wargaList,
      totalPendingScan,
      kkList,
      recentMutasi,
    ] = await Promise.all([
      prisma.kartuKeluarga.count(),
      prisma.warga.count({ where: { status_warga: 'Aktif' } }),
      prisma.warga.count({ where: { status_warga: 'Meninggal' } }),
      prisma.warga.count({ where: { status_warga: 'Pindah' } }),
      prisma.warga.findMany({
        where: { status_warga: 'Aktif' },
        select: { jenis_kelamin: true, tanggal_lahir: true },
      }),
      prisma.scanQueue.count({ where: { status: 'PENDING' } }),
      prisma.kartuKeluarga.findMany({
        select: { status_hunian: true },
      }),
      prisma.riwayatMutasi.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Hitung gender & usia
    let pria = 0;
    let wanita = 0;
    let balita = 0; // <= 5 tahun
    let lansia = 0; // >= 60 tahun
    let produktif = 0; // 15 - 59 tahun
    let anak = 0; // 6 - 14 tahun

    const currentYear = new Date().getFullYear();

    for (const w of wargaList) {
      if (w.jenis_kelamin === 'LAKI-LAKI') pria++;
      else wanita++;

      if (w.tanggal_lahir) {
        const birthYear = parseInt(w.tanggal_lahir.split('-')[0], 10);
        if (!isNaN(birthYear)) {
          const age = currentYear - birthYear;
          if (age <= 5) balita++;
          else if (age <= 14) anak++;
          else if (age >= 60) lansia++;
          else produktif++;
        }
      }
    }

    // Hitung status hunian KK
    let hunianTetap = 0;
    let hunianKontrak = 0;
    for (const kk of kkList) {
      if (kk.status_hunian === 'Tetap') hunianTetap++;
      else hunianKontrak++;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalKK,
        totalWarga: totalWargaAktif,
        totalWargaAktif,
        totalMeninggal: totalWargaMeninggal,
        totalWargaMeninggal,
        totalPindah: totalWargaPindah,
        totalWargaPindah,
        totalPendingScan,
        gender: {
          laki: pria,
          perempuan: wanita,
        },
        demografi: {
          pria,
          wanita,
          balita,
          anak,
          produktif,
          lansia,
        },
        statusKK: {
          tetap: hunianTetap,
          kontrak: hunianKontrak,
        },
        hunian: {
          tetap: hunianTetap,
          kontrak: hunianKontrak,
        },
        recentMutasi,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
