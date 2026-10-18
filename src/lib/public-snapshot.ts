import fs from 'fs';
import path from 'path';

export interface PublicWargaItem {
  id: string;
  nama_lengkap: string;
  jenis_kelamin: 'LAKI-LAKI' | 'PEREMPUAN';
  umur: number;
  kategori_usia: 'Balita' | 'Anak & Remaja' | 'Dewasa' | 'Lansia';
  status_warga: string;
}

export interface PublicSnapshotData {
  updatedAt: string;
  dashboard: {
    totalKK: number;
    totalWarga: number;
    totalWargaAktif: number;
    totalMeninggal: number;
    totalPindah: number;
    totalPendingScan: number;
    gender: { laki: number; perempuan: number };
    demografi: {
      pria: number;
      wanita: number;
      balita: number;
      anak: number;
      produktif: number;
      lansia: number;
    };
    statusKK: { tetap: number; kontrak: number };
    hunian: { tetap: number; kontrak: number };
    recentMutasi: any[];
  };
  publikWarga: {
    stats: {
      totalWarga: number;
      totalKK: number;
      totalPria: number;
      totalWanita: number;
      totalBalita: number;
      totalAnak: number;
      totalDewasa: number;
      totalLansia: number;
      rataRataUmur: number;
    };
    data: PublicWargaItem[];
  };
}

function calculateAge(tanggalLahir?: string): number {
  if (!tanggalLahir) return 0;
  const parts = tanggalLahir.split('-');
  if (parts.length < 3) return 0;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) age--;
  return age >= 0 ? age : 0;
}

function getAgeCategory(age: number): 'Balita' | 'Anak & Remaja' | 'Dewasa' | 'Lansia' {
  if (age <= 5) return 'Balita';
  if (age <= 17) return 'Anak & Remaja';
  if (age <= 59) return 'Dewasa';
  return 'Lansia';
}

export function generatePublicSnapshotData(
  kks: any[],
  wargas: any[],
  mutasis: any[] = []
): PublicSnapshotData {
  const aktifWarga = wargas.filter((w) => w.status_warga === 'Aktif');
  const meninggal = wargas.filter((w) => w.status_warga === 'Meninggal').length;
  const pindah = wargas.filter((w) => w.status_warga === 'Pindah').length;

  let pria = 0;
  let wanita = 0;
  let balita = 0;
  let anak = 0;
  let produktif = 0;
  let lansia = 0;
  let sumAge = 0;

  const publicWargaList: PublicWargaItem[] = aktifWarga.map((w, idx) => {
    const age = calculateAge(w.tanggal_lahir);
    const cat = getAgeCategory(age);
    sumAge += age;
    if (w.jenis_kelamin === 'LAKI-LAKI') pria++;
    else wanita++;

    if (cat === 'Balita') balita++;
    else if (cat === 'Anak & Remaja') anak++;
    else if (cat === 'Dewasa') produktif++;
    else lansia++;

    return {
      id: `w-${idx + 1}`,
      nama_lengkap: w.nama_lengkap,
      jenis_kelamin: w.jenis_kelamin,
      umur: age,
      kategori_usia: cat,
      status_warga: w.status_warga,
    };
  });

  let tetap = 0;
  let kontrak = 0;
  for (const kk of kks) {
    if (kk.status_hunian === 'Tetap') tetap++;
    else kontrak++;
  }

  return {
    updatedAt: new Date().toISOString(),
    dashboard: {
      totalKK: kks.length,
      totalWarga: aktifWarga.length,
      totalWargaAktif: aktifWarga.length,
      totalMeninggal: meninggal,
      totalPindah: pindah,
      totalPendingScan: 0,
      gender: { laki: pria, perempuan: wanita },
      demografi: { pria, wanita, balita, anak, produktif, lansia },
      statusKK: { tetap, kontrak },
      hunian: { tetap, kontrak },
      recentMutasi: mutasis.slice(0, 5),
    },
    publikWarga: {
      stats: {
        totalWarga: aktifWarga.length,
        totalKK: kks.length,
        totalPria: pria,
        totalWanita: wanita,
        totalBalita: balita,
        totalAnak: anak,
        totalDewasa: produktif,
        totalLansia: lansia,
        rataRataUmur: aktifWarga.length > 0 ? Math.round(sumAge / aktifWarga.length) : 0,
      },
      data: publicWargaList,
    },
  };
}

export function readPublicSnapshot(): PublicSnapshotData | null {
  try {
    const filePath = path.join(process.cwd(), 'data', 'public-snapshot.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('readPublicSnapshot error:', err);
  }
  return null;
}

export function writePublicSnapshot(snapshot: PublicSnapshotData): void {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, 'public-snapshot.json');
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  } catch (err) {
    console.error('writePublicSnapshot error:', err);
  }
}
