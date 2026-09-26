const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importToCloud() {
  console.log('🚀 Memulai migrasi data ke Cloud Database (PostgreSQL)...');

  const dataFile = path.join(__dirname, '..', 'data', 'backup-warga-rt.json');
  if (!fs.existsSync(dataFile)) {
    console.error('❌ File backup tidak ditemukan di:', dataFile);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  console.log(`📦 Memuat ${backup.counts.kartuKeluarga} KK dan ${backup.counts.warga} Warga...`);

  try {
    // 1. Masukkan KK
    for (const kk of backup.kartuKeluarga) {
      const { anggota, ...kkData } = kk;
      await prisma.kartuKeluarga.upsert({
        where: { no_kk: kkData.no_kk },
        update: kkData,
        create: kkData,
      });
    }
    console.log(`✅ Berhasil migrasi ${backup.kartuKeluarga.length} Kartu Keluarga.`);

    // 2. Masukkan Warga
    for (const w of backup.warga) {
      await prisma.warga.upsert({
        where: { nik: w.nik },
        update: w,
        create: w,
      });
    }
    console.log(`✅ Berhasil migrasi ${backup.warga.length} Jiwa Warga.`);

    // 3. Masukkan Mutasi (jika ada)
    if (backup.mutasi && backup.mutasi.length > 0) {
      for (const m of backup.mutasi) {
        await prisma.riwayatMutasi.upsert({
          where: { id: m.id },
          update: m,
          create: m,
        });
      }
      console.log(`✅ Berhasil migrasi ${backup.mutasi.length} Catatan Mutasi.`);
    }

    console.log('🎉 Migrasi data ke database cloud selesai 100%!');
  } catch (err) {
    console.error('❌ Gagal melakukan migrasi:', err);
  } finally {
    await prisma.$disconnect();
  }
}

importToCloud();
