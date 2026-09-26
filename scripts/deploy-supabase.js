const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const passwordEncoded = encodeURIComponent('WargaIstimewa2026!');
const DATABASE_URL = `postgresql://postgres.cgfljoyxdvgxncebwype:${passwordEncoded}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;
const DIRECT_URL = `postgresql://postgres.cgfljoyxdvgxncebwype:${passwordEncoded}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;

console.log('🔗 Menghubungkan ke Supabase PostgreSQL...');

const env = {
  ...process.env,
  DATABASE_URL,
  DIRECT_URL,
};

// 1. Jalankan prisma db push ke PostgreSQL Supabase
try {
  console.log('📦 Membuat tabel database di Supabase...');
  const prismaBin = path.join(__dirname, '..', 'node_modules', '.bin', 'prisma.cmd');
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  
  execSync(`"${prismaBin}" db push --schema="${schemaPath}" --skip-generate`, {
    env,
    stdio: 'inherit',
  });
  console.log('✅ Skema tabel KartuKeluarga, Warga, Mutasi, dan ScanQueue berhasil sinkron di Supabase!');
} catch (e) {
  console.error('❌ Gagal membuat skema di Supabase:', e.message);
  process.exit(1);
}

// 2. Sekarang migrasikan data backup ke database Supabase
async function seedData() {
  const dataFile = path.join(__dirname, '..', 'data', 'backup-warga-rt.json');
  if (!fs.existsSync(dataFile)) {
    console.error('❌ File backup tidak ditemukan di:', dataFile);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  console.log(`🚀 Mengunggah ${backup.counts.kartuKeluarga} KK dan ${backup.counts.warga} Warga ke Supabase...`);

  // Buat PrismaClient yang terhubung langsung ke Supabase
  const prismaCloud = new PrismaClient({
    datasources: {
      db: {
        url: DIRECT_URL,
      },
    },
  });

  try {
    // 1. Masukkan KK
    for (const kk of backup.kartuKeluarga) {
      const { anggota, ...kkData } = kk;
      await prismaCloud.kartuKeluarga.upsert({
        where: { no_kk: kkData.no_kk },
        update: kkData,
        create: kkData,
      });
    }
    console.log(`✅ Berhasil mengunggah ${backup.kartuKeluarga.length} Kartu Keluarga ke Supabase!`);

    // 2. Masukkan Warga
    for (const w of backup.warga) {
      await prismaCloud.warga.upsert({
        where: { nik: w.nik },
        update: w,
        create: w,
      });
    }
    console.log(`✅ Berhasil mengunggah ${backup.warga.length} Jiwa Warga ke Supabase!`);

    // 3. Masukkan Mutasi (jika ada)
    if (backup.mutasi && backup.mutasi.length > 0) {
      for (const m of backup.mutasi) {
        await prismaCloud.riwayatMutasi.upsert({
          where: { id: m.id },
          update: m,
          create: m,
        });
      }
      console.log(`✅ Berhasil mengunggah ${backup.mutasi.length} Catatan Mutasi ke Supabase!`);
    }

    console.log('🎉 SEMUA DATA WARGA SUDAH ONLINE 100% DI SUPABASE!');
  } catch (err) {
    console.error('❌ Gagal mengunggah data ke Supabase:', err);
  } finally {
    await prismaCloud.$disconnect();
  }
}

seedData();
