const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

function getDirectUrl() {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql')) return process.env.DATABASE_URL;

  // Baca dari .env.local atau .env
  for (const envFile of ['.env.local', '.env']) {
    const fullPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const directMatch = content.match(/DIRECT_URL=["']?([^"'\r\n]+)["']?/);
      if (directMatch && directMatch[1].startsWith('postgresql')) {
        return directMatch[1];
      }
      const dbMatch = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (dbMatch && dbMatch[1].startsWith('postgresql')) {
        return dbMatch[1];
      }
    }
  }

  // Fallback ke kredensial Supabase proyek jika tidak ada di env
  const passwordEncoded = encodeURIComponent('WargaIstimewa2026!');
  return `postgresql://postgres.cgfljoyxdvgxncebwype:${passwordEncoded}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;
}

let rawUrl = getDirectUrl();

// Pastikan password yang memuat karakter khusus seperti ! ter-encode dengan benar jika belum
if (rawUrl.includes(':WargaIstimewa2026!@')) {
  rawUrl = rawUrl.replace(':WargaIstimewa2026!@', `:${encodeURIComponent('WargaIstimewa2026!')}@`);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: rawUrl,
    },
  },
});

async function main() {
  console.log('🔒 Menghubungkan ke Supabase PostgreSQL...');
  console.log('🔒 Mengaktifkan Row Level Security (RLS) pada tabel-tabel publik...');

  const tables = ['ScanQueue', 'KartuKeluarga', 'Warga', 'RiwayatMutasi'];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✅ RLS BERHASIL DIAKTIFKAN: public."${table}"`);
    } catch (err) {
      console.error(`⚠️ Gagal pada ${table}:`, err.message);
    }
  }

  console.log('\n🔍 Memverifikasi status RLS pada sistem PostgreSQL...');
  const result = await prisma.$queryRawUnsafe(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename IN ('ScanQueue', 'KartuKeluarga', 'Warga', 'RiwayatMutasi');
  `);

  console.table(result);

  const allActive = result.every((row) => row.rowsecurity === true || row.rowsecurity === 'true');
  if (allActive) {
    console.log('🎉 SUKSES 100%! Semua tabel publik kini terlindungi dari akses anonim PostgREST.');
  } else {
    console.warn('⚠️ Beberapa tabel belum memiliki rowsecurity = true. Periksa daftar di atas.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
