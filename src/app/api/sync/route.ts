import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase-client';
import { getSyncState, markSynced } from '@/lib/sync-state';

export async function GET() {
  const isCloud = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true';

  if (isCloud) {
    return NextResponse.json({
      success: true,
      isCloud: true,
      needsSync: false,
      message: 'Berjalan di Web Publik (Cloud)',
    });
  }

  const syncState = getSyncState();
  return NextResponse.json({
    success: true,
    isCloud: false,
    ...syncState,
  });
}

export async function POST() {
  const isCloud = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true';

  if (isCloud) {
    return NextResponse.json(
      {
        success: false,
        error: 'Akses ditolak: Sinkronisasi data hanya dapat dijalankan dari aplikasi desktop lokal.',
      },
      { status: 403 }
    );
  }

  try {
    // 1. Ambil seluruh data master dari SQLite lokal
    const localKK = await prisma.kartuKeluarga.findMany();
    const localWarga = await prisma.warga.findMany();
    const localMutasi = await prisma.riwayatMutasi.findMany();

    // 2. Hubungkan ke database cloud Supabase PostgreSQL
    const supabase = getSupabaseClient();

    // Uji koneksi ringan
    await supabase.$queryRaw`SELECT 1`;

    // 3. Sinkronkan Kartu Keluarga ke Supabase (Upsert)
    for (const kk of localKK) {
      await supabase.kartuKeluarga.upsert({
        where: { no_kk: kk.no_kk },
        update: {
          kepala_keluarga: kk.kepala_keluarga,
          alamat: kk.alamat,
          rt: kk.rt,
          rw: kk.rw,
          kelurahan: kk.kelurahan,
          kecamatan: kk.kecamatan,
          kabupaten_kota: kk.kabupaten_kota,
          provinsi: kk.provinsi,
          kode_pos: kk.kode_pos,
          no_rumah: kk.no_rumah,
          blok: kk.blok,
          status_hunian: kk.status_hunian,
          tgl_dikeluarkan: kk.tgl_dikeluarkan,
        },
        create: {
          no_kk: kk.no_kk,
          kepala_keluarga: kk.kepala_keluarga,
          alamat: kk.alamat,
          rt: kk.rt,
          rw: kk.rw,
          kelurahan: kk.kelurahan,
          kecamatan: kk.kecamatan,
          kabupaten_kota: kk.kabupaten_kota,
          provinsi: kk.provinsi,
          kode_pos: kk.kode_pos,
          no_rumah: kk.no_rumah,
          blok: kk.blok,
          status_hunian: kk.status_hunian,
          tgl_dikeluarkan: kk.tgl_dikeluarkan,
        },
      });
    }

    // 4. Sinkronkan Data Warga ke Supabase (Upsert)
    for (const w of localWarga) {
      await supabase.warga.upsert({
        where: { nik: w.nik },
        update: {
          no_kk: w.no_kk,
          nama_lengkap: w.nama_lengkap,
          jenis_kelamin: w.jenis_kelamin,
          tempat_lahir: w.tempat_lahir,
          tanggal_lahir: w.tanggal_lahir,
          agama: w.agama,
          pendidikan: w.pendidikan,
          pekerjaan: w.pekerjaan,
          status_perkawinan: w.status_perkawinan,
          status_hubungan: w.status_hubungan,
          kewarganegaraan: w.kewarganegaraan,
          nama_ayah: w.nama_ayah,
          nama_ibu: w.nama_ibu,
          status_warga: w.status_warga,
          no_telp: w.no_telp,
          golongan_darah: w.golongan_darah,
        },
        create: {
          nik: w.nik,
          no_kk: w.no_kk,
          nama_lengkap: w.nama_lengkap,
          jenis_kelamin: w.jenis_kelamin,
          tempat_lahir: w.tempat_lahir,
          tanggal_lahir: w.tanggal_lahir,
          agama: w.agama,
          pendidikan: w.pendidikan,
          pekerjaan: w.pekerjaan,
          status_perkawinan: w.status_perkawinan,
          status_hubungan: w.status_hubungan,
          kewarganegaraan: w.kewarganegaraan,
          nama_ayah: w.nama_ayah,
          nama_ibu: w.nama_ibu,
          status_warga: w.status_warga,
          no_telp: w.no_telp,
          golongan_darah: w.golongan_darah,
        },
      });
    }

    // 5. Bersihkan data di cloud jika ada warga/KK yang sudah dihapus di lokal
    const activeNiks = localWarga.map((w: any) => w.nik);
    if (activeNiks.length > 0) {
      await supabase.warga.deleteMany({
        where: {
          nik: { notIn: activeNiks },
        },
      });
    }

    const activeKks = localKK.map((k: any) => k.no_kk);
    if (activeKks.length > 0) {
      await supabase.kartuKeluarga.deleteMany({
        where: {
          no_kk: { notIn: activeKks },
        },
      });
    }

    // 6. Sinkronkan Riwayat Mutasi
    for (const m of localMutasi) {
      await supabase.riwayatMutasi.upsert({
        where: { id: m.id },
        update: {
          nik: m.nik,
          nama_warga: m.nama_warga,
          no_kk: m.no_kk,
          jenis_mutasi: m.jenis_mutasi,
          tanggal_kejadian: m.tanggal_kejadian,
          keterangan: m.keterangan,
          no_surat: m.no_surat,
          bukti_dokumen: m.bukti_dokumen,
          dicatat_oleh: m.dicatat_oleh,
        },
        create: {
          id: m.id,
          nik: m.nik,
          nama_warga: m.nama_warga,
          no_kk: m.no_kk,
          jenis_mutasi: m.jenis_mutasi,
          tanggal_kejadian: m.tanggal_kejadian,
          keterangan: m.keterangan,
          no_surat: m.no_surat,
          bukti_dokumen: m.bukti_dokumen,
          dicatat_oleh: m.dicatat_oleh,
        },
      });
    }

    // 7. Catat status sinkronisasi sukses
    markSynced({ warga: localWarga.length, kk: localKK.length });

    return NextResponse.json({
      success: true,
      message: 'Sinkronisasi ke Web Publik berhasil diselesaikan!',
      syncedAt: new Date().toISOString(),
      counts: {
        kk: localKK.length,
        warga: localWarga.length,
        mutasi: localMutasi.length,
      },
    });
  } catch (error: any) {
    console.error('Error during cloud sync:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          'Gagal menyinkronkan data ke Web Publik. Pastikan laptop terhubung ke internet. Detail: ' +
          (error.message || 'Koneksi database cloud bermasalah.'),
      },
      { status: 500 }
    );
  }
}
