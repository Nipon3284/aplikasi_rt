import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { KKImportItem } from '@/lib/excel-service';
import { markNeedsSync } from '@/lib/sync-state';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kkItems } = body as { kkItems: KKImportItem[] };

    if (!Array.isArray(kkItems) || kkItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada data yang dikirim untuk diimpor' },
        { status: 400 }
      );
    }

    let createdKKCount = 0;
    let updatedKKCount = 0;
    let createdWargaCount = 0;
    let updatedWargaCount = 0;
    let skippedCount = 0;

    await prisma.$transaction(async (tx: any) => {
      for (const kkItem of kkItems) {
        // 1. Eksekusi Kartu Keluarga
        if (kkItem.action === 'CREATE') {
          await tx.kartuKeluarga.upsert({
            where: { no_kk: kkItem.no_kk },
            create: {
              no_kk: kkItem.no_kk,
              kepala_keluarga: kkItem.kepala_keluarga || 'KEPALA KELUARGA',
              alamat: kkItem.alamat || '-',
              rt: kkItem.rt || '003',
              rw: kkItem.rw || '003',
              status_hunian: kkItem.status_hunian || 'Tetap',
              no_rumah: '',
              blok: '',
            },
            update: {
              kepala_keluarga: kkItem.kepala_keluarga,
              alamat: kkItem.alamat,
              rt: kkItem.rt || '003',
              rw: kkItem.rw || '003',
              status_hunian: kkItem.status_hunian || 'Tetap',
            },
          });
          createdKKCount++;
        } else if (kkItem.action === 'UPDATE') {
          await tx.kartuKeluarga.update({
            where: { no_kk: kkItem.no_kk },
            data: {
              kepala_keluarga: kkItem.kepala_keluarga,
              alamat: kkItem.alamat,
              rt: kkItem.rt || '003',
              rw: kkItem.rw || '003',
              status_hunian: kkItem.status_hunian || 'Tetap',
            },
          });
          updatedKKCount++;
        }

        // 2. Eksekusi Anggota Warga
        for (const member of kkItem.members || []) {
          if (member.action === 'CREATE') {
            // Pastikan Kartu Keluarga induk sudah terdaftar di database
            await tx.kartuKeluarga.upsert({
              where: { no_kk: member.no_kk },
              create: {
                no_kk: member.no_kk,
                kepala_keluarga: kkItem.kepala_keluarga || member.nama_lengkap,
                alamat: kkItem.alamat || '-',
                rt: kkItem.rt || '003',
                rw: kkItem.rw || '003',
                status_hunian: kkItem.status_hunian || 'Tetap',
                no_rumah: '',
                blok: '',
              },
              update: {},
            });

            await tx.warga.upsert({
              where: { nik: member.nik },
              create: {
                nik: member.nik,
                no_kk: member.no_kk,
                nama_lengkap: member.nama_lengkap,
                jenis_kelamin: member.jenis_kelamin || 'LAKI-LAKI',
                tempat_lahir: member.tempat_lahir || '-',
                tanggal_lahir: member.tanggal_lahir || '2000-01-01',
                agama: member.agama || 'ISLAM',
                pendidikan: member.pendidikan || 'TIDAK/BELUM SEKOLAH',
                pekerjaan: member.pekerjaan || 'BELUM/TIDAK BEKERJA',
                status_perkawinan: member.status_perkawinan || 'BELUM KAWIN',
                status_hubungan: member.status_hubungan || 'ANGGOTA',
                kewarganegaraan: member.kewarganegaraan || 'WNI',
                nama_ayah: member.nama_ayah || '',
                nama_ibu: member.nama_ibu || '',
                golongan_darah: member.golongan_darah || '-',
                no_telp: member.no_telp || '',
                status_warga: member.status_warga || 'Aktif',
              },
              update: {
                no_kk: member.no_kk,
                nama_lengkap: member.nama_lengkap,
                jenis_kelamin: member.jenis_kelamin,
                tempat_lahir: member.tempat_lahir,
                tanggal_lahir: member.tanggal_lahir,
                agama: member.agama,
                pendidikan: member.pendidikan,
                pekerjaan: member.pekerjaan,
                status_perkawinan: member.status_perkawinan,
                status_hubungan: member.status_hubungan,
                kewarganegaraan: member.kewarganegaraan || 'WNI',
                nama_ayah: member.nama_ayah,
                nama_ibu: member.nama_ibu,
                golongan_darah: member.golongan_darah || '-',
                no_telp: member.no_telp || '',
                status_warga: member.status_warga || 'Aktif',
              },
            });
            createdWargaCount++;
          } else if (member.action === 'UPDATE') {
            await tx.warga.update({
              where: { nik: member.nik },
              data: {
                nama_lengkap: member.nama_lengkap,
                jenis_kelamin: member.jenis_kelamin,
                tempat_lahir: member.tempat_lahir,
                tanggal_lahir: member.tanggal_lahir,
                agama: member.agama,
                pendidikan: member.pendidikan,
                pekerjaan: member.pekerjaan,
                status_perkawinan: member.status_perkawinan,
                status_hubungan: member.status_hubungan,
                kewarganegaraan: member.kewarganegaraan || 'WNI',
                nama_ayah: member.nama_ayah,
                nama_ibu: member.nama_ibu,
                golongan_darah: member.golongan_darah || '-',
                no_telp: member.no_telp || '',
                status_warga: member.status_warga || 'Aktif',
              },
            });
            updatedWargaCount++;
          } else {
            // 'SKIP' atau 'KEEP' -> tidak ada perubahan pada database
            skippedCount++;
          }
        }
      }
    });

    if (createdKKCount > 0 || updatedKKCount > 0 || createdWargaCount > 0 || updatedWargaCount > 0) {
      markNeedsSync();
    }

    return NextResponse.json({
      success: true,
      message: 'Proses import data berhasil dieksekusi dengan aman',
      summary: {
        createdKKCount,
        updatedKKCount,
        createdWargaCount,
        updatedWargaCount,
        skippedCount,
      },
    });
  } catch (error: any) {
    console.error('Import Execution Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengeksekusi import data' },
      { status: 500 }
    );
  }
}
