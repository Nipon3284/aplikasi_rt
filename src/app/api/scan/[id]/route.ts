import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractKKFromImage } from '@/lib/gemini-ocr';
import { markNeedsSync } from '@/lib/sync-state';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scan = await prisma.scanQueue.findUnique({
      where: { id: params.id },
    });

    if (!scan) {
      return NextResponse.json({ success: false, error: 'Data scan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: scan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { kkData, anggotaData } = body;

    if (!kkData || !kkData.no_kk || !kkData.kepala_keluarga) {
      return NextResponse.json({ success: false, error: 'Data Nomor KK dan Kepala Keluarga wajib diisi' }, { status: 400 });
    }

    // Jalankan transaksi database: Simpan KK dan seluruh Anggota
    const result = await prisma.$transaction(async (tx: any) => {
      // Upsert Kartu Keluarga
      const savedKK = await tx.kartuKeluarga.upsert({
        where: { no_kk: kkData.no_kk },
        create: {
          no_kk: kkData.no_kk,
          kepala_keluarga: kkData.kepala_keluarga,
          alamat: kkData.alamat || 'Alamat RT',
          rt: kkData.rt || '001',
          rw: kkData.rw || '001',
          kelurahan: kkData.kelurahan || 'Kelurahan',
          kecamatan: kkData.kecamatan || 'Kecamatan',
          kabupaten_kota: kkData.kabupaten_kota || 'Kota',
          provinsi: kkData.provinsi || 'Provinsi',
          kode_pos: kkData.kode_pos || '',
          no_rumah: '', // Sengaja dikosongkan
          blok: '',     // Sengaja dikosongkan
          status_hunian: kkData.status_hunian || 'Tetap',
          tgl_dikeluarkan: kkData.tgl_dikeluarkan || '',
        },
        update: {
          kepala_keluarga: kkData.kepala_keluarga,
          alamat: kkData.alamat,
          rt: kkData.rt,
          rw: kkData.rw,
          kelurahan: kkData.kelurahan,
          kecamatan: kkData.kecamatan,
          kabupaten_kota: kkData.kabupaten_kota,
          provinsi: kkData.provinsi,
          kode_pos: kkData.kode_pos,
          no_rumah: '', // Sengaja dikosongkan
          blok: '',     // Sengaja dikosongkan
          status_hunian: kkData.status_hunian,
          tgl_dikeluarkan: kkData.tgl_dikeluarkan,
        },
      });

      // Upsert Setiap Anggota Keluarga
      if (Array.isArray(anggotaData)) {
        for (const w of anggotaData) {
          if (!w.nik || w.nik.trim() === '') continue;

          await tx.warga.upsert({
            where: { nik: w.nik },
            create: {
              nik: w.nik,
              no_kk: kkData.no_kk,
              nama_lengkap: w.nama_lengkap,
              jenis_kelamin: w.jenis_kelamin || 'LAKI-LAKI',
              tempat_lahir: w.tempat_lahir || '',
              tanggal_lahir: w.tanggal_lahir || '2000-01-01',
              agama: w.agama || 'ISLAM',
              pendidikan: w.pendidikan || 'SLTA / SEDERAJAT',
              pekerjaan: w.pekerjaan || 'BELUM/TIDAK BEKERJA',
              status_perkawinan: w.status_perkawinan || 'BELUM KAWIN',
              status_hubungan: w.status_hubungan || 'ANAK',
              kewarganegaraan: w.kewarganegaraan || 'WNI',
              nama_ayah: w.nama_ayah || '',
              nama_ibu: w.nama_ibu || '',
              status_warga: 'Aktif',
              golongan_darah: w.golongan_darah || '-',
              no_telp: w.no_telp || '',
            },
            update: {
              no_kk: kkData.no_kk,
              nama_lengkap: w.nama_lengkap,
              jenis_kelamin: w.jenis_kelamin,
              tempat_lahir: w.tempat_lahir,
              tanggal_lahir: w.tanggal_lahir,
              agama: w.agama,
              pendidikan: w.pendidikan,
              pekerjaan: w.pekerjaan,
              status_perkawinan: w.status_perkawinan,
              status_hubungan: w.status_hubungan,
              nama_ayah: w.nama_ayah,
              nama_ibu: w.nama_ibu,
              golongan_darah: w.golongan_darah,
              no_telp: w.no_telp,
            },
          });
        }
      }

      // Perbarui status antrean scan menjadi VERIFIED
      await tx.scanQueue.update({
        where: { id: params.id },
        data: {
          status: 'VERIFIED',
          verified_at: new Date(),
          no_kk_result: kkData.no_kk,
        },
      });

      return savedKK;
    });

    markNeedsSync();

    return NextResponse.json({
      success: true,
      message: 'Data KK dan seluruh warga berhasil diverifikasi dan disimpan ke database!',
      data: result,
    });
  } catch (error: any) {
    console.error('Error verifying scan:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.scanQueue.update({
      where: { id: params.id },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({ success: true, message: 'Scan ditandai Ditolak / Dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scan = await prisma.scanQueue.findUnique({
      where: { id: params.id },
    });

    if (!scan) {
      return NextResponse.json({ success: false, error: 'Data scan tidak ditemukan' }, { status: 404 });
    }

    let base64 = '';
    let mimeType = 'image/jpeg';

    if (scan.image_url && scan.image_url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', scan.image_url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        base64 = fileBuffer.toString('base64');
        mimeType = filePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      }
    }

    if (!base64) {
      return NextResponse.json(
        { success: false, error: 'Berkas gambar scan tidak ditemukan di server' },
        { status: 400 }
      );
    }

    // Jalankan OCR ulang dengan multi-key pool
    const extracted = await extractKKFromImage(base64, mimeType);

    const hasNoKK = !extracted.no_kk || extracted.no_kk.trim() === '';
    const newStatus = (hasNoKK || (extracted.confidence_score !== undefined && extracted.confidence_score <= 0.2))
      ? 'PENDING_OCR'
      : 'PENDING';

    const updated = await prisma.scanQueue.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        extracted_json: JSON.stringify(extracted),
        confidence_score: extracted.confidence_score,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Analisis AI ulang berhasil!',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error re-running OCR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
