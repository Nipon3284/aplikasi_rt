import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function calculateAge(tanggalLahir: string): number {
  if (!tanggalLahir) return 0;
  const parts = tanggalLahir.split('-');
  if (parts.length < 3) return 0;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return age >= 0 ? age : 0;
}

function getAgeCategory(age: number): 'Balita' | 'Anak & Remaja' | 'Dewasa' | 'Lansia' {
  if (age <= 5) return 'Balita';
  if (age <= 17) return 'Anak & Remaja';
  if (age <= 59) return 'Dewasa';
  return 'Lansia';
}

export async function GET() {
  try {
    const rawWarga = await prisma.warga.findMany({
      where: { status_warga: 'Aktif' },
      select: {
        nama_lengkap: true,
        jenis_kelamin: true,
        tanggal_lahir: true,
        status_warga: true,
        createdAt: true,
      },
      orderBy: { nama_lengkap: 'asc' },
    });

    let totalPria = 0;
    let totalWanita = 0;
    let totalBalita = 0;
    let totalAnak = 0;
    let totalDewasa = 0;
    let totalLansia = 0;
    let sumAge = 0;

    const wargaPublik = rawWarga.map((w, index) => {
      const age = calculateAge(w.tanggal_lahir);
      const category = getAgeCategory(age);
      
      sumAge += age;
      if (w.jenis_kelamin === 'LAKI-LAKI') totalPria++;
      else totalWanita++;

      if (category === 'Balita') totalBalita++;
      else if (category === 'Anak & Remaja') totalAnak++;
      else if (category === 'Dewasa') totalDewasa++;
      else totalLansia++;

      return {
        id: `w-${index + 1}`,
        nama_lengkap: w.nama_lengkap,
        jenis_kelamin: w.jenis_kelamin,
        umur: age,
        kategori_usia: category,
        status_warga: w.status_warga,
      };
    });

    const totalWarga = rawWarga.length;
    const rataRataUmur = totalWarga > 0 ? Math.round(sumAge / totalWarga) : 0;

    // Hitung total KK aktif
    const totalKK = await prisma.kartuKeluarga.count();

    return NextResponse.json({
      success: true,
      stats: {
        totalWarga,
        totalKK,
        totalPria,
        totalWanita,
        totalBalita,
        totalAnak,
        totalDewasa,
        totalLansia,
        rataRataUmur,
      },
      data: wargaPublik,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
