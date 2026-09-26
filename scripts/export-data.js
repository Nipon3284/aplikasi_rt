const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportAllData() {
  console.log('🔄 Memulai ekspor data lokal SI-WARGA RT...');

  try {
    const kartuKeluarga = await prisma.kartuKeluarga.findMany({
      include: { anggota: true },
    });
    const warga = await prisma.warga.findMany();
    const mutasi = await prisma.riwayatMutasi.findMany();
    const scanQueue = await prisma.scanQueue.findMany();

    const backupData = {
      exportedAt: new Date().toISOString(),
      counts: {
        kartuKeluarga: kartuKeluarga.length,
        warga: warga.length,
        mutasi: mutasi.length,
        scanQueue: scanQueue.length,
      },
      kartuKeluarga,
      warga,
      mutasi,
      scanQueue,
    };

    const outDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outFile = path.join(outDir, 'backup-warga-rt.json');
    fs.writeFileSync(outFile, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log(`✅ Berhasil mengekspor:`);
    console.log(`   - ${kartuKeluarga.length} Kartu Keluarga (KK)`);
    console.log(`   - ${warga.length} Jiwa Warga`);
    console.log(`   - ${mutasi.length} Catatan Mutasi`);
    console.log(`📁 File tersimpan di: ${outFile}`);
  } catch (err) {
    console.error('❌ Gagal mengekspor data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

exportAllData();
