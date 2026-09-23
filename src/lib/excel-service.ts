import ExcelJS from 'exceljs';

// Helper menghitung usia dari string YYYY-MM-DD
export function calculateAge(birthDateStr: string | null | undefined): number {
  if (!birthDateStr) return 0;
  try {
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  } catch {
    return 0;
  }
}

// Styling Constants
const THEME_HEADER_BG = '047857'; // Emerald 700
const THEME_SUBHEADER_BG = '10B981'; // Emerald 500
const THEME_ZEBRA_BG = 'F8FAFC'; // Slate 50
const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'CBD5E1' } },
  left: { style: 'thin', color: { argb: 'CBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
  right: { style: 'thin', color: { argb: 'CBD5E1' } },
};

/**
 * Generate Laporan Kependudukan Multi-Sheet (4 Sheet)
 */
export async function generatePopulationExcelReport(
  wargaList: any[],
  kkList: any[],
  filterInfo: {
    search?: string;
    status?: string;
    gender?: string;
    rt?: string;
    rw?: string;
  } = {}
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Pendataan RT 003 / RW 003 Istimewa';
  workbook.created = new Date();

  // ==========================================
  // SHEET 1: REKAPITULASI KEPENDUDUKAN
  // ==========================================
  const sheetRekap = workbook.addWorksheet('Rekapitulasi Kependudukan', {
    views: [{ showGridLines: true }],
  });

  // KOP LAPORAN RESMI RT
  sheetRekap.mergeCells('A1:H1');
  const title1 = sheetRekap.getCell('A1');
  title1.value = 'RUKUN TETANGGA 003 / RUKUN WARGA 003 "ISTIMEWA"';
  title1.font = { name: 'Arial', size: 14, bold: true, color: { argb: '0F172A' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  sheetRekap.mergeCells('A2:H2');
  const title2 = sheetRekap.getCell('A2');
  title2.value = 'DESA TAMBAKSARI KIDUL, KEC. KEMBARAN, KAB. BANYUMAS, JAWA TENGAH';
  title2.font = { name: 'Arial', size: 10, bold: false, color: { argb: '475569' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };

  sheetRekap.mergeCells('A3:H3');
  const title3 = sheetRekap.getCell('A3');
  title3.value = 'LAPORAN REKAPITULASI STATISTIK KEPENDUDUKAN';
  title3.font = { name: 'Arial', size: 12, bold: true, color: { argb: THEME_HEADER_BG } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };

  sheetRekap.mergeCells('A4:H4');
  const metaCell = sheetRekap.getCell('A4');
  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  metaCell.value = `Waktu Ekspor: ${nowStr} | Status Filter: ${filterInfo.status || 'SEMUA'} | Gender: ${filterInfo.gender || 'SEMUA'}`;
  metaCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: '64748B' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };

  sheetRekap.addRow([]); // Blank row

  // 1. STATISTIK UTAMA (RINGKASAN EKSEKUTIF)
  const totalJiwa = wargaList.length;
  const totalLaki = wargaList.filter((w) => w.jenis_kelamin?.toUpperCase().includes('LAKI')).length;
  const totalPerempuan = wargaList.filter((w) => w.jenis_kelamin?.toUpperCase().includes('PEREMPUAN')).length;
  const totalKK = kkList.length;

  const rowSummaryHeader = sheetRekap.addRow(['RINGKASAN INDIKATOR UTAMA', '', '', '', '', '', '', '']);
  sheetRekap.mergeCells(`A${rowSummaryHeader.number}:H${rowSummaryHeader.number}`);
  rowSummaryHeader.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  rowSummaryHeader.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: THEME_HEADER_BG },
  };

  const summaryRow1 = sheetRekap.addRow([
    'Total Penduduk (Jiwa):',
    totalJiwa,
    '',
    'Total Kartu Keluarga (KK):',
    totalKK,
    '',
    'Rasio Jenis Kelamin (L/P):',
    totalPerempuan > 0 ? `${((totalLaki / totalPerempuan) * 100).toFixed(1)}%` : '100%',
  ]);
  summaryRow1.font = { name: 'Arial', size: 10 };
  summaryRow1.getCell(2).font = { bold: true, color: { argb: '047857' } };
  summaryRow1.getCell(5).font = { bold: true, color: { argb: '047857' } };
  summaryRow1.getCell(8).font = { bold: true };

  const summaryRow2 = sheetRekap.addRow([
    'Laki-Laki:',
    `${totalLaki} Jiwa (${totalJiwa > 0 ? ((totalLaki / totalJiwa) * 100).toFixed(1) : 0}%)`,
    '',
    'Perempuan:',
    `${totalPerempuan} Jiwa (${totalJiwa > 0 ? ((totalPerempuan / totalJiwa) * 100).toFixed(1) : 0}%)`,
    '',
    'Rata-rata Jiwa per KK:',
    totalKK > 0 ? (totalJiwa / totalKK).toFixed(2) : 0,
  ]);
  summaryRow2.font = { name: 'Arial', size: 10 };

  sheetRekap.addRow([]); // Blank separator

  // HELPER UNTUK MEMBUAT TABEL AGREGASI 2 KOLOM (Kategori, Jumlah, Persentase)
  const addBreakdownTable = (
    title: string,
    dataMap: Record<string, number>,
    startCol: number,
    startRow: number
  ): number => {
    // Header
    const cellTitle = sheetRekap.getCell(startRow, startCol);
    sheetRekap.mergeCells(startRow, startCol, startRow, startCol + 2);
    cellTitle.value = title;
    cellTitle.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    cellTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    cellTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_SUBHEADER_BG } };

    // Subheader
    const rHead = startRow + 1;
    sheetRekap.getCell(rHead, startCol).value = 'Kategori';
    sheetRekap.getCell(rHead, startCol + 1).value = 'Jumlah';
    sheetRekap.getCell(rHead, startCol + 2).value = 'Persen';

    for (let c = startCol; c <= startCol + 2; c++) {
      const cell = sheetRekap.getCell(rHead, c);
      cell.font = { bold: true, size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
      cell.border = BORDER_STYLE;
      cell.alignment = { horizontal: c === startCol ? 'left' : 'center' };
    }

    let currRow = rHead + 1;
    let sum = 0;
    const entries = Object.entries(dataMap);

    for (const [key, val] of entries) {
      sum += val;
      const c1 = sheetRekap.getCell(currRow, startCol);
      const c2 = sheetRekap.getCell(currRow, startCol + 1);
      const c3 = sheetRekap.getCell(currRow, startCol + 2);

      c1.value = key || '-';
      c2.value = val;
      c3.value = totalJiwa > 0 ? `${((val / totalJiwa) * 100).toFixed(1)}%` : '0%';

      c1.border = BORDER_STYLE;
      c2.border = BORDER_STYLE;
      c3.border = BORDER_STYLE;

      c1.font = { size: 9 };
      c2.font = { size: 9 };
      c3.font = { size: 9 };

      c2.alignment = { horizontal: 'center' };
      c3.alignment = { horizontal: 'center' };

      if (currRow % 2 === 0) {
        c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_ZEBRA_BG } };
        c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_ZEBRA_BG } };
        c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_ZEBRA_BG } };
      }
      currRow++;
    }

    // Total Row
    const t1 = sheetRekap.getCell(currRow, startCol);
    const t2 = sheetRekap.getCell(currRow, startCol + 1);
    const t3 = sheetRekap.getCell(currRow, startCol + 2);

    t1.value = 'TOTAL';
    t2.value = sum;
    t3.value = '100%';

    t1.font = { bold: true, size: 9 };
    t2.font = { bold: true, size: 9 };
    t3.font = { bold: true, size: 9 };

    t1.border = BORDER_STYLE;
    t2.border = BORDER_STYLE;
    t3.border = BORDER_STYLE;

    t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    t2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    t3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };

    t2.alignment = { horizontal: 'center' };
    t3.alignment = { horizontal: 'center' };

    return currRow + 2; // return next available row
  };

  // Hitung Data Demografis
  const usiaDist: Record<string, number> = {
    'Balita (0-5 th)': 0,
    'Anak-anak (6-14 th)': 0,
    'Produktif (15-59 th)': 0,
    'Lansia (≥ 60 th)': 0,
  };

  const pendidikanDist: Record<string, number> = {};
  const pekerjaanDist: Record<string, number> = {};
  const agamaDist: Record<string, number> = {};
  const kawinDist: Record<string, number> = {};
  const hubunganDist: Record<string, number> = {};
  const golDarahDist: Record<string, number> = {};

  for (const w of wargaList) {
    const age = calculateAge(w.tanggal_lahir);
    if (age <= 5) usiaDist['Balita (0-5 th)']++;
    else if (age <= 14) usiaDist['Anak-anak (6-14 th)']++;
    else if (age <= 59) usiaDist['Produktif (15-59 th)']++;
    else usiaDist['Lansia (≥ 60 th)']++;

    const pend = (w.pendidikan || 'TIDAK/BELUM SEKOLAH').toUpperCase().trim();
    pendidikanDist[pend] = (pendidikanDist[pend] || 0) + 1;

    const pek = (w.pekerjaan || 'BELUM/TIDAK BEKERJA').toUpperCase().trim();
    pekerjaanDist[pek] = (pekerjaanDist[pek] || 0) + 1;

    const ag = (w.agama || 'ISLAM').toUpperCase().trim();
    agamaDist[ag] = (agamaDist[ag] || 0) + 1;

    const kaw = (w.status_perkawinan || 'BELUM KAWIN').toUpperCase().trim();
    kawinDist[kaw] = (kawinDist[kaw] || 0) + 1;

    const hub = (w.status_hubungan || 'LAINNYA').toUpperCase().trim();
    hubunganDist[hub] = (hubunganDist[hub] || 0) + 1;

    const gd = (w.golongan_darah || '-').toUpperCase().trim();
    golDarahDist[gd] = (golDarahDist[gd] || 0) + 1;
  }

  // Render Tabel Sebelahan: Kolom 1 (A-C), Kolom 2 (E-G)
  let rowLeft = 10;
  let rowRight = 10;

  rowLeft = addBreakdownTable('REKAPITULASI KELOMPOK USIA', usiaDist, 1, rowLeft);
  rowLeft = addBreakdownTable('REKAPITULASI PENDIDIKAN', pendidikanDist, 1, rowLeft);
  rowLeft = addBreakdownTable('REKAPITULASI HUBUNGAN KELUARGA', hubunganDist, 1, rowLeft);

  rowRight = addBreakdownTable('REKAPITULASI AGAMA', agamaDist, 5, rowRight);
  rowRight = addBreakdownTable('REKAPITULASI STATUS PERKAWINAN', kawinDist, 5, rowRight);
  rowRight = addBreakdownTable('REKAPITULASI GOLONGAN DARAH', golDarahDist, 5, rowRight);
  rowRight = addBreakdownTable('REKAPITULASI PEKERJAAN', pekerjaanDist, 5, rowRight);

  sheetRekap.getColumn(1).width = 28;
  sheetRekap.getColumn(2).width = 14;
  sheetRekap.getColumn(3).width = 12;
  sheetRekap.getColumn(4).width = 4;
  sheetRekap.getColumn(5).width = 28;
  sheetRekap.getColumn(6).width = 14;
  sheetRekap.getColumn(7).width = 12;
  sheetRekap.getColumn(8).width = 16;

  // ==========================================
  // SHEET 2: REKAP PER RT-RW
  // ==========================================
  const sheetRtRw = workbook.addWorksheet('Rekap per RT-RW', {
    views: [{ showGridLines: true }],
  });

  sheetRtRw.mergeCells('A1:G1');
  sheetRtRw.getCell('A1').value = 'DISTRIBUSI KEPENDUDUKAN PER RT / RW';
  sheetRtRw.getCell('A1').font = { bold: true, size: 14, color: { argb: THEME_HEADER_BG } };
  sheetRtRw.getCell('A1').alignment = { horizontal: 'center' };

  const rtRwHeaders = ['No', 'RT', 'RW', 'Jumlah KK', 'Jiwa Laki-Laki', 'Jiwa Perempuan', 'Total Jiwa'];
  const rowRtRwHead = sheetRtRw.addRow(rtRwHeaders);
  rowRtRwHead.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
  rowRtRwHead.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_HEADER_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_STYLE;
  });

  const rtRwMap: Record<string, { rt: string; rw: string; kkCount: number; l: number; p: number; total: number }> = {};

  for (const kk of kkList) {
    const key = `${kk.rt || '003'}/${kk.rw || '003'}`;
    if (!rtRwMap[key]) {
      rtRwMap[key] = { rt: kk.rt || '003', rw: kk.rw || '003', kkCount: 0, l: 0, p: 0, total: 0 };
    }
    rtRwMap[key].kkCount++;
  }

  for (const w of wargaList) {
    const kk = w.kartu_keluarga;
    const rt = kk?.rt || '003';
    const rw = kk?.rw || '003';
    const key = `${rt}/${rw}`;
    if (!rtRwMap[key]) {
      rtRwMap[key] = { rt, rw, kkCount: 0, l: 0, p: 0, total: 0 };
    }
    rtRwMap[key].total++;
    if (w.jenis_kelamin?.toUpperCase().includes('LAKI')) {
      rtRwMap[key].l++;
    } else {
      rtRwMap[key].p++;
    }
  }

  let idxRtRw = 1;
  let totKkAll = 0;
  let totLAll = 0;
  let totPAll = 0;
  let totJiwaAll = 0;

  for (const item of Object.values(rtRwMap)) {
    totKkAll += item.kkCount;
    totLAll += item.l;
    totPAll += item.p;
    totJiwaAll += item.total;

    const r = sheetRtRw.addRow([
      idxRtRw++,
      `RT ${item.rt}`,
      `RW ${item.rw}`,
      item.kkCount,
      item.l,
      item.p,
      item.total,
    ]);

    r.font = { size: 10 };
    r.eachCell((cell, colNum) => {
      cell.border = BORDER_STYLE;
      cell.alignment = { horizontal: 'center' };
      if (idxRtRw % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_ZEBRA_BG } };
      }
    });
  }

  const rTotRtRw = sheetRtRw.addRow(['TOTAL KESELURUHAN', '', '', totKkAll, totLAll, totPAll, totJiwaAll]);
  sheetRtRw.mergeCells(`A${rTotRtRw.number}:C${rTotRtRw.number}`);
  rTotRtRw.font = { bold: true, size: 10 };
  rTotRtRw.eachCell((cell) => {
    cell.border = BORDER_STYLE;
    cell.alignment = { horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
  });

  sheetRtRw.getColumn(1).width = 8;
  sheetRtRw.getColumn(2).width = 12;
  sheetRtRw.getColumn(3).width = 12;
  sheetRtRw.getColumn(4).width = 16;
  sheetRtRw.getColumn(5).width = 18;
  sheetRtRw.getColumn(6).width = 18;
  sheetRtRw.getColumn(7).width = 18;

  // ==========================================
  // SHEET 3: DATA PENDUDUK (RAW DATA)
  // ==========================================
  const sheetWarga = workbook.addWorksheet('Data Penduduk', {
    views: [{ showGridLines: true }],
  });

  sheetWarga.mergeCells('A1:U1');
  sheetWarga.getCell('A1').value = 'DATA DETAIL INDIVIDUAL PENDUDUK WARGA RT';
  sheetWarga.getCell('A1').font = { bold: true, size: 13, color: { argb: THEME_HEADER_BG } };

  const wargaHeaders = [
    'No',
    'NIK',
    'No. KK',
    'Nama Lengkap',
    'Jenis Kelamin',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Usia',
    'Agama',
    'Pendidikan',
    'Pekerjaan',
    'Status Perkawinan',
    'Status Hubungan',
    'Kewarganegaraan',
    'Nama Ayah',
    'Nama Ibu',
    'Status Warga',
    'Gol. Darah',
    'No. Telp',
    'Alamat KK',
    'RT / RW',
  ];

  const rWargaHead = sheetWarga.addRow(wargaHeaders);
  rWargaHead.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
  rWargaHead.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_HEADER_BG } };
    cell.border = BORDER_STYLE;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let noWarga = 1;
  for (const w of wargaList) {
    const age = calculateAge(w.tanggal_lahir);
    const alamat = w.kartu_keluarga?.alamat || '';
    const rtRw = `RT ${w.kartu_keluarga?.rt || '003'} / RW ${w.kartu_keluarga?.rw || '003'}`;

    const row = sheetWarga.addRow([
      noWarga++,
      w.nik,
      w.no_kk,
      w.nama_lengkap,
      w.jenis_kelamin,
      w.tempat_lahir,
      w.tanggal_lahir,
      age,
      w.agama,
      w.pendidikan,
      w.pekerjaan,
      w.status_perkawinan,
      w.status_hubungan,
      w.kewarganegaraan || 'WNI',
      w.nama_ayah || '-',
      w.nama_ibu || '-',
      w.status_warga || 'Aktif',
      w.golongan_darah || '-',
      w.no_telp || '-',
      alamat,
      rtRw,
    ]);

    row.font = { size: 9 };
    row.eachCell((cell, colNum) => {
      cell.border = BORDER_STYLE;
      if (colNum === 1 || colNum === 5 || colNum === 7 || colNum === 8 || colNum === 17) {
        cell.alignment = { horizontal: 'center' };
      }
      if (colNum === 2 || colNum === 3) {
        cell.numFmt = '@';
      }
      if (noWarga % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_ZEBRA_BG } };
      }
    });
  }

  sheetWarga.columns = [
    { width: 6 },  // No
    { width: 20 }, // NIK
    { width: 20 }, // No KK
    { width: 26 }, // Nama
    { width: 14 }, // JK
    { width: 16 }, // Tempat Lahir
    { width: 14 }, // Tgl Lahir
    { width: 8 },  // Usia
    { width: 12 }, // Agama
    { width: 16 }, // Pendidikan
    { width: 22 }, // Pekerjaan
    { width: 16 }, // Status Kawin
    { width: 18 }, // Hubungan
    { width: 10 }, // Kewarganegaraan
    { width: 18 }, // Ayah
    { width: 18 }, // Ibu
    { width: 12 }, // Status
    { width: 10 }, // Gol Darah
    { width: 14 }, // Telp
    { width: 26 }, // Alamat
    { width: 16 }, // RT/RW
  ];

  // ==========================================
  // SHEET 4: DATA KARTU KELUARGA (RAW DATA)
  // ==========================================
  const sheetKk = workbook.addWorksheet('Data Kartu Keluarga', {
    views: [{ showGridLines: true }],
  });

  sheetKk.mergeCells('A1:N1');
  sheetKk.getCell('A1').value = 'DATA MASTER KARTU KELUARGA (KK) RT';
  sheetKk.getCell('A1').font = { bold: true, size: 13, color: { argb: THEME_HEADER_BG } };

  const kkHeaders = [
    'No',
    'Nomor Kartu Keluarga',
    'Kepala Keluarga',
    'Alamat Lengkap',
    'RT',
    'RW',
    'Kelurahan/Desa',
    'Kecamatan',
    'Kabupaten/Kota',
    'Provinsi',
    'Kode Pos',
    'Status Hunian',
    'Tgl Dikeluarkan',
    'Jumlah Jiwa Aktif',
  ];

  const rKkHead = sheetKk.addRow(kkHeaders);
  rKkHead.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
  rKkHead.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_HEADER_BG } };
    cell.border = BORDER_STYLE;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let noKk = 1;
  for (const kk of kkList) {
    const aktifCount = kk.anggota?.filter((a: any) => a.status_warga === 'Aktif').length || kk.anggota?.length || 0;

    const row = sheetKk.addRow([
      noKk++,
      kk.no_kk,
      kk.kepala_keluarga,
      kk.alamat,
      kk.rt,
      kk.rw,
      kk.kelurahan,
      kk.kecamatan,
      kk.kabupaten_kota,
      kk.provinsi,
      kk.kode_pos || '-',
      kk.status_hunian || 'Tetap',
      kk.tgl_dikeluarkan || '-',
      aktifCount,
    ]);

    row.font = { size: 9 };
    row.eachCell((cell, colNum) => {
      cell.border = BORDER_STYLE;
      if (colNum === 1 || colNum === 5 || colNum === 6 || colNum === 12 || colNum === 14) {
        cell.alignment = { horizontal: 'center' };
      }
      if (colNum === 2) {
        cell.numFmt = '@';
      }
      if (noKk % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_ZEBRA_BG } };
      }
    });
  }

  sheetKk.columns = [
    { width: 6 },  // No
    { width: 22 }, // No KK
    { width: 24 }, // Kepala KK
    { width: 28 }, // Alamat
    { width: 8 },  // RT
    { width: 8 },  // RW
    { width: 18 }, // Kelurahan
    { width: 18 }, // Kecamatan
    { width: 18 }, // Kota
    { width: 18 }, // Provinsi
    { width: 10 }, // Kode Pos
    { width: 14 }, // Hunian
    { width: 16 }, // Tgl Keluar
    { width: 16 }, // Jumlah Jiwa
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate Template Excel Resmi untuk Import Penduduk & KK
 */
export async function generateImportTemplateExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem RT 003 / RW 003';

  // Sheet 1: Format Data Siap Isi
  const sheetData = workbook.addWorksheet('Data Penduduk', {
    views: [{ showGridLines: true }],
  });

  const headers = [
    'NO',
    'NO_KK',
    'KEPALA_KELUARGA',
    'ALAMAT',
    'RT',
    'RW',
    'STATUS_HUNIAN',
    'NIK',
    'NAMA_LENGKAP',
    'JENIS_KELAMIN',
    'TEMPAT_LAHIR',
    'TANGGAL_LAHIR',
    'AGAMA',
    'PENDIDIKAN',
    'PEKERJAAN',
    'STATUS_PERKAWINAN',
    'STATUS_HUBUNGAN',
    'KEWARGANEGARAAN',
    'NAMA_AYAH',
    'NAMA_IBU',
    'GOLONGAN_DARAH',
    'NO_TELP',
    'STATUS_WARGA',
  ];

  const rHead = sheetData.addRow(headers);
  rHead.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
  rHead.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_HEADER_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_STYLE;
  });

  const sample1 = sheetData.addRow([
    1,
    '3302200302209999',
    'BUDI SANTOSO',
    'JL. FLAMBOYAN NO. 12',
    '003',
    '003',
    'Tetap',
    '3302200101809991',
    'BUDI SANTOSO',
    'LAKI-LAKI',
    'BANYUMAS',
    '1980-01-01',
    'ISLAM',
    'S1',
    'KARYAWAN SWASTA',
    'KAWIN',
    'KEPALA KELUARGA',
    'WNI',
    'SUDIRMAN',
    'SUMIATI',
    'O',
    '081234567890',
    'Aktif',
  ]);

  const sample2 = sheetData.addRow([
    2,
    '3302200302209999',
    'BUDI SANTOSO',
    'JL. FLAMBOYAN NO. 12',
    '003',
    '003',
    'Tetap',
    '3302204505859992',
    'SITI AMINAH',
    'PEREMPUAN',
    'PURWOKERTO',
    '1985-05-15',
    'ISLAM',
    'SMA/SMK',
    'IBU RUMAH TANGGA',
    'KAWIN',
    'ISTRI',
    'WNI',
    'AHMAD',
    'KARTINI',
    'A',
    '081234567891',
    'Aktif',
  ]);

  [sample1, sample2].forEach((row) => {
    row.font = { size: 9 };
    row.eachCell((cell, colNum) => {
      cell.border = BORDER_STYLE;
      if (colNum === 2 || colNum === 8) {
        cell.numFmt = '@';
      }
    });
  });

  sheetData.columns = [
    { width: 6 },  // NO
    { width: 22 }, // NO_KK
    { width: 22 }, // KEPALA_KELUARGA
    { width: 24 }, // ALAMAT
    { width: 8 },  // RT
    { width: 8 },  // RW
    { width: 14 }, // STATUS_HUNIAN
    { width: 22 }, // NIK
    { width: 24 }, // NAMA_LENGKAP
    { width: 14 }, // JENIS_KELAMIN
    { width: 16 }, // TEMPAT_LAHIR
    { width: 16 }, // TANGGAL_LAHIR
    { width: 12 }, // AGAMA
    { width: 16 }, // PENDIDIKAN
    { width: 22 }, // PEKERJAAN
    { width: 16 }, // STATUS_PERKAWINAN
    { width: 18 }, // STATUS_HUBUNGAN
    { width: 12 }, // KEWARGANEGARAAN
    { width: 16 }, // NAMA_AYAH
    { width: 16 }, // NAMA_IBU
    { width: 12 }, // GOL_DARAH
    { width: 16 }, // NO_TELP
    { width: 12 }, // STATUS_WARGA
  ];

  // Sheet 2: Petunjuk & Aturan Isian
  const sheetPanduan = workbook.addWorksheet('Petunjuk Pengisian', {
    views: [{ showGridLines: true }],
  });

  sheetPanduan.getCell('A1').value = 'PANDUAN & KETENTUAN PENGISIAN DATA EXCEL RT';
  sheetPanduan.getCell('A1').font = { bold: true, size: 13, color: { argb: THEME_HEADER_BG } };

  const panduanRows = [
    ['No', 'Nama Kolom', 'Ketentuan Format', 'Pilihan Nilai Valid / Contoh'],
    ['1', 'NO_KK', 'Wajib 16 Digit angka Kartu Keluarga', 'Contoh: 3302200302200004'],
    ['2', 'KEPALA_KELUARGA', 'Nama Kepala Keluarga sesuai KK', 'Contoh: BUDI SANTOSO'],
    ['3', 'ALAMAT', 'Nama jalan / dusun / nomor rumah', 'Contoh: JL. FLAMBOYAN NO. 12'],
    ['4', 'RT & RW', 'Format 3 digit angka', '003'],
    ['5', 'STATUS_HUNIAN', 'Pilihan status tempat tinggal', 'Tetap, Kontrak, Kos'],
    ['6', 'NIK', 'Wajib 16 Digit angka unik identitas kependudukan', 'Contoh: 3302200101800001'],
    ['7', 'NAMA_LENGKAP', 'Nama lengkap warga huruf kapital', 'Contoh: SITI AMINAH'],
    ['8', 'JENIS_KELAMIN', 'Pilihan jenis kelamin', 'LAKI-LAKI atau PEREMPUAN'],
    ['9', 'TEMPAT_LAHIR', 'Nama kota / kabupaten tempat lahir', 'Contoh: BANYUMAS'],
    ['10', 'TANGGAL_LAHIR', 'Format Standar: YYYY-MM-DD', 'Contoh: 1985-05-15'],
    ['11', 'AGAMA', 'Pilihan agama resmi', 'ISLAM, KRISTEN, KATOLIK, HINDU, BUDDHA, KHONGHUCU, LAINNYA'],
    ['12', 'PENDIDIKAN', 'Jenjang pendidikan terakhir', 'SD, SMP, SMA/SMK, D3, S1, S2, S3, TIDAK/BELUM SEKOLAH'],
    ['13', 'PEKERJAAN', 'Jenis pekerjaan', 'PNS, KARYAWAN SWASTA, WIRASWASTA, PETANI, IBU RUMAH TANGGA, PELAJAR/MAHASISWA, dll.'],
    ['14', 'STATUS_PERKAWINAN', 'Status perkawinan', 'BELUM KAWIN, KAWIN, CERAI HIDUP, CERAI MATI'],
    ['15', 'STATUS_HUBUNGAN', 'Kedudukan dalam susunan KK', 'KEPALA KELUARGA, SUAMI, ISTRI, ANAK, MENANTU, CUCU, ORANG TUA, MERTUA, FAMILI LAIN, dll.'],
    ['16', 'STATUS_WARGA', 'Status kependudukan aktif', 'Aktif, Meninggal, Pindah'],
  ];

  panduanRows.forEach((r, idx) => {
    const row = sheetPanduan.addRow(r);
    if (idx === 0) {
      row.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
      row.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_HEADER_BG } };
        c.border = BORDER_STYLE;
        c.alignment = { horizontal: 'center' };
      });
    } else {
      row.font = { size: 9 };
      row.eachCell((c) => {
        c.border = BORDER_STYLE;
      });
    }
  });

  sheetPanduan.getColumn(1).width = 6;
  sheetPanduan.getColumn(2).width = 22;
  sheetPanduan.getColumn(3).width = 35;
  sheetPanduan.getColumn(4).width = 45;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ======================================================================
// IMPORT ENGINE: PARSER, VALIDATOR, COMPARATOR & VISUAL DIFF
// ======================================================================

export interface DiffField {
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

export interface WargaImportItem {
  id: string; // unique key for UI
  nik: string;
  no_kk: string;
  nama_lengkap: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  status_perkawinan: string;
  status_hubungan: string;
  kewarganegaraan: string;
  nama_ayah: string;
  nama_ibu: string;
  golongan_darah: string;
  no_telp: string;
  status_warga: string;
  status: 'BARU' | 'SAMA' | 'DIPERBARUI' | 'KONFLIK' | 'TIDAK_DITEMUKAN';
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'KEEP';
  diffs: DiffField[];
  conflictReason?: string;
  isExistingInDb?: boolean;
}

export interface KKImportItem {
  no_kk: string;
  kepala_keluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  status_hunian: string;
  status: 'BARU' | 'SAMA' | 'DIPERBARUI' | 'KONFLIK';
  action: 'CREATE' | 'UPDATE' | 'SKIP';
  diffs: DiffField[];
  conflictReason?: string;
  members: WargaImportItem[];
}

export interface ImportAnalysisResult {
  filename: string;
  totalRows: number;
  totalKK: number;
  summary: {
    newCount: number;
    sameCount: number;
    updatedCount: number;
    conflictCount: number;
    missingCount: number;
  };
  kkItems: KKImportItem[];
  validationErrors: string[];
}

/**
 * Normalisasi format tanggal apapun dari Excel ke string YYYY-MM-DD
 */
export function normalizeDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
  }
  return str;
}

function cleanCellString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val.text) return String(val.text).trim();
    if (val.result) return String(val.result).trim();
  }
  return String(val).trim();
}

/**
 * Parse & Analisis file Excel/CSV, lalu bandingkan dengan Database
 */
export async function analyzeImportSpreadsheet(
  fileBuffer: Buffer,
  filename: string,
  existingKKs: any[],
  existingWargas: any[]
): Promise<ImportAnalysisResult> {
  const workbook = new ExcelJS.Workbook();
  const isCsv = filename.toLowerCase().endsWith('.csv');

  if (isCsv) {
    const { Readable } = await import('stream');
    const stream = Readable.from(fileBuffer);
    await workbook.csv.read(stream);
  } else {
    await workbook.xlsx.load(fileBuffer as any);
  }

  let worksheet = workbook.getWorksheet('Data Penduduk');
  if (!worksheet) {
    worksheet = workbook.worksheets[0];
  }

  if (!worksheet) {
    throw new Error('Lembar kerja (sheet) tidak ditemukan pada berkas yang diunggah.');
  }

  let headerRowIndex = -1;
  const colIndexMap: Record<string, number> = {};

  worksheet.eachRow((row, rowNumber) => {
    if (headerRowIndex !== -1) return;
    row.eachCell((cell, colNumber) => {
      const val = cleanCellString(cell.value).toUpperCase().replace(/[\s_]/g, '');
      if (val === 'NOKK' || val === 'NOMORKK' || val === 'KARTUKELUARGA') colIndexMap['NO_KK'] = colNumber;
      if (val === 'KEPALAKELUARGA' || val === 'NAMAKEPALAKELUARGA') colIndexMap['KEPALA_KELUARGA'] = colNumber;
      if (val === 'ALAMAT' || val === 'ALAMATLENGKAP') colIndexMap['ALAMAT'] = colNumber;
      if (val === 'RT') colIndexMap['RT'] = colNumber;
      if (val === 'RW') colIndexMap['RW'] = colNumber;
      if (val === 'STATUSHUNIAN' || val === 'HUNIAN') colIndexMap['STATUS_HUNIAN'] = colNumber;
      if (val === 'NIK' || val === 'NOMORINDUKKEPENDUDUKAN') colIndexMap['NIK'] = colNumber;
      if (val === 'NAMALENGKAP' || val === 'NAMA') colIndexMap['NAMA_LENGKAP'] = colNumber;
      if (val === 'JENISKELAMIN' || val === 'JK') colIndexMap['JENIS_KELAMIN'] = colNumber;
      if (val === 'TEMPATLAHIR') colIndexMap['TEMPAT_LAHIR'] = colNumber;
      if (val === 'TANGGALLAHIR' || val === 'TGLLAHIR') colIndexMap['TANGGAL_LAHIR'] = colNumber;
      if (val === 'AGAMA') colIndexMap['AGAMA'] = colNumber;
      if (val === 'PENDIDIKAN') colIndexMap['PENDIDIKAN'] = colNumber;
      if (val === 'PEKERJAAN') colIndexMap['PEKERJAAN'] = colNumber;
      if (val === 'STATUSPERKAWINAN' || val === 'STATUSKAWIN') colIndexMap['STATUS_PERKAWINAN'] = colNumber;
      if (val === 'STATUSHUBUNGAN' || val === 'HUBUNGANKELUARGA' || val === 'SHDK') colIndexMap['STATUS_HUBUNGAN'] = colNumber;
      if (val === 'KEWARGANEGARAAN') colIndexMap['KEWARGANEGARAAN'] = colNumber;
      if (val === 'NAMAAYAH' || val === 'AYAH') colIndexMap['NAMA_AYAH'] = colNumber;
      if (val === 'NAMAIBU' || val === 'IBU') colIndexMap['NAMA_IBU'] = colNumber;
      if (val === 'GOLONGANDARAH' || val === 'GOLDARAH' || val === 'GOL') colIndexMap['GOLONGAN_DARAH'] = colNumber;
      if (val === 'NOTELP' || val === 'TELEPON' || val === 'HP' || val === 'NOHP') colIndexMap['NO_TELP'] = colNumber;
      if (val === 'STATUSWARGA' || val === 'STATUS') colIndexMap['STATUS_WARGA'] = colNumber;
    });

    if (colIndexMap['NO_KK'] && colIndexMap['NIK']) {
      headerRowIndex = rowNumber;
    }
  });

  if (headerRowIndex === -1 || !colIndexMap['NO_KK'] || !colIndexMap['NIK']) {
    throw new Error(
      'Format tabel tidak valid. Pastikan berkas memiliki kolom "NO_KK" dan "NIK" sesuai format template resmi.'
    );
  }

  const dbKkMap = new Map<string, any>();
  existingKKs.forEach((k) => dbKkMap.set(k.no_kk, k));

  const dbWargaMap = new Map<string, any>();
  existingWargas.forEach((w) => dbWargaMap.set(w.nik, w));

  const validationErrors: string[] = [];
  const parsedRows: any[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return;

    const noKkRaw = cleanCellString(row.getCell(colIndexMap['NO_KK'] || 2).value).replace(/\D/g, '');
    const nikRaw = cleanCellString(row.getCell(colIndexMap['NIK'] || 8).value).replace(/\D/g, '');

    if (!noKkRaw && !nikRaw) return;

    if (noKkRaw.length !== 16) {
      validationErrors.push(`Baris ${rowNumber}: Format Nomor KK (${noKkRaw || 'Kosong'}) tidak 16 digit.`);
    }
    if (nikRaw.length !== 16) {
      validationErrors.push(`Baris ${rowNumber}: Format NIK (${nikRaw || 'Kosong'}) tidak 16 digit.`);
    }

    const tglLahirRaw = row.getCell(colIndexMap['TANGGAL_LAHIR'] || 12).value;
    const tglLahirClean = normalizeDate(tglLahirRaw);

    const rowObj = {
      rowNumber,
      no_kk: noKkRaw,
      kepala_keluarga: cleanCellString(row.getCell(colIndexMap['KEPALA_KELUARGA'] || 3).value).toUpperCase(),
      alamat: cleanCellString(row.getCell(colIndexMap['ALAMAT'] || 4).value).toUpperCase(),
      rt: cleanCellString(row.getCell(colIndexMap['RT'] || 5).value) || '003',
      rw: cleanCellString(row.getCell(colIndexMap['RW'] || 6).value) || '003',
      status_hunian: cleanCellString(row.getCell(colIndexMap['STATUS_HUNIAN'] || 7).value) || 'Tetap',
      nik: nikRaw,
      nama_lengkap: cleanCellString(row.getCell(colIndexMap['NAMA_LENGKAP'] || 9).value).toUpperCase(),
      jenis_kelamin: cleanCellString(row.getCell(colIndexMap['JENIS_KELAMIN'] || 10).value).toUpperCase(),
      tempat_lahir: cleanCellString(row.getCell(colIndexMap['TEMPAT_LAHIR'] || 11).value).toUpperCase(),
      tanggal_lahir: tglLahirClean,
      agama: cleanCellString(row.getCell(colIndexMap['AGAMA'] || 13).value).toUpperCase() || 'ISLAM',
      pendidikan: cleanCellString(row.getCell(colIndexMap['PENDIDIKAN'] || 14).value).toUpperCase() || 'TIDAK/BELUM SEKOLAH',
      pekerjaan: cleanCellString(row.getCell(colIndexMap['PEKERJAAN'] || 15).value).toUpperCase() || 'BELUM/TIDAK BEKERJA',
      status_perkawinan: cleanCellString(row.getCell(colIndexMap['STATUS_PERKAWINAN'] || 16).value).toUpperCase() || 'BELUM KAWIN',
      status_hubungan: cleanCellString(row.getCell(colIndexMap['STATUS_HUBUNGAN'] || 17).value).toUpperCase() || 'KEPALA KELUARGA',
      kewarganegaraan: cleanCellString(row.getCell(colIndexMap['KEWARGANEGARAAN'] || 18).value).toUpperCase() || 'WNI',
      nama_ayah: cleanCellString(row.getCell(colIndexMap['NAMA_AYAH'] || 19).value).toUpperCase(),
      nama_ibu: cleanCellString(row.getCell(colIndexMap['NAMA_IBU'] || 20).value).toUpperCase(),
      golongan_darah: cleanCellString(row.getCell(colIndexMap['GOLONGAN_DARAH'] || 21).value).toUpperCase() || '-',
      no_telp: cleanCellString(row.getCell(colIndexMap['NO_TELP'] || 22).value),
      status_warga: cleanCellString(row.getCell(colIndexMap['STATUS_WARGA'] || 23).value) || 'Aktif',
    };

    parsedRows.push(rowObj);
  });

  const kkGroupMap = new Map<string, any[]>();
  for (const row of parsedRows) {
    if (!kkGroupMap.has(row.no_kk)) {
      kkGroupMap.set(row.no_kk, []);
    }
    kkGroupMap.get(row.no_kk)!.push(row);
  }

  const resultKKItems: KKImportItem[] = [];
  let summaryNew = 0;
  let summarySame = 0;
  let summaryUpdated = 0;
  let summaryConflict = 0;
  let summaryMissing = 0;

  for (const [noKk, rows] of Array.from(kkGroupMap.entries())) {
    const dbKK = dbKkMap.get(noKk);
    const firstRow = rows[0];

    let kkStatus: 'BARU' | 'SAMA' | 'DIPERBARUI' | 'KONFLIK' = 'BARU';
    const kkDiffs: DiffField[] = [];
    let kkAction: 'CREATE' | 'UPDATE' | 'SKIP' = 'CREATE';
    let kkConflictReason: string | undefined = undefined;

    if (noKk.length !== 16) {
      kkStatus = 'KONFLIK';
      kkAction = 'SKIP';
      kkConflictReason = 'Nomor KK tidak 16 digit.';
      summaryConflict++;
    } else if (!dbKK) {
      kkStatus = 'BARU';
      kkAction = 'CREATE';
    } else {
      const checkFields = [
        { key: 'kepala_keluarga', label: 'Kepala Keluarga' },
        { key: 'alamat', label: 'Alamat KK' },
        { key: 'rt', label: 'RT' },
        { key: 'rw', label: 'RW' },
        { key: 'status_hunian', label: 'Status Hunian' },
      ];

      for (const cf of checkFields) {
        const oldVal = String(dbKK[cf.key] || '').trim().toUpperCase();
        const newVal = String(firstRow[cf.key] || '').trim().toUpperCase();
        if (newVal && oldVal !== newVal) {
          kkDiffs.push({
            field: cf.key,
            fieldLabel: cf.label,
            oldValue: dbKK[cf.key] || '-',
            newValue: firstRow[cf.key] || '-',
          });
        }
      }

      if (kkDiffs.length > 0) {
        kkStatus = 'DIPERBARUI';
        kkAction = 'UPDATE';
      } else {
        kkStatus = 'SAMA';
        kkAction = 'SKIP';
      }
    }

    const memberItems: WargaImportItem[] = [];
    const processedNiksInImport = new Set<string>();

    for (const row of rows) {
      processedNiksInImport.add(row.nik);
      const dbWarga = dbWargaMap.get(row.nik);

      let wStatus: 'BARU' | 'SAMA' | 'DIPERBARUI' | 'KONFLIK' | 'TIDAK_DITEMUKAN' = 'BARU';
      let wAction: 'CREATE' | 'UPDATE' | 'SKIP' | 'KEEP' = 'CREATE';
      const wDiffs: DiffField[] = [];
      let wConflict: string | undefined = undefined;

      if (row.nik.length !== 16) {
        wStatus = 'KONFLIK';
        wAction = 'SKIP';
        wConflict = 'Format NIK tidak 16 digit';
        summaryConflict++;
      } else if (!dbWarga) {
        wStatus = 'BARU';
        wAction = 'CREATE';
        summaryNew++;
      } else if (dbWarga.no_kk !== row.no_kk) {
        wStatus = 'KONFLIK';
        wAction = 'SKIP';
        wConflict = `NIK sudah terdaftar pada No. KK lain: ${dbWarga.no_kk} (Nama: ${dbWarga.nama_lengkap}).`;
        summaryConflict++;
      } else {
        const wargaFields = [
          { key: 'nama_lengkap', label: 'Nama Lengkap' },
          { key: 'jenis_kelamin', label: 'Jenis Kelamin' },
          { key: 'tempat_lahir', label: 'Tempat Lahir' },
          { key: 'tanggal_lahir', label: 'Tanggal Lahir' },
          { key: 'agama', label: 'Agama' },
          { key: 'pendidikan', label: 'Pendidikan' },
          { key: 'pekerjaan', label: 'Pekerjaan' },
          { key: 'status_perkawinan', label: 'Status Perkawinan' },
          { key: 'status_hubungan', label: 'Status Hubungan' },
          { key: 'kewarganegaraan', label: 'Kewarganegaraan' },
          { key: 'nama_ayah', label: 'Nama Ayah' },
          { key: 'nama_ibu', label: 'Nama Ibu' },
          { key: 'golongan_darah', label: 'Gol. Darah' },
          { key: 'no_telp', label: 'No. Telepon' },
          { key: 'status_warga', label: 'Status Warga' },
        ];

        for (const wf of wargaFields) {
          let oldVal = String(dbWarga[wf.key] || '').trim().toUpperCase();
          let newVal = String(row[wf.key] || '').trim().toUpperCase();

          if (wf.key === 'tanggal_lahir') {
            oldVal = normalizeDate(dbWarga.tanggal_lahir);
            newVal = normalizeDate(row.tanggal_lahir);
          }

          if (newVal && oldVal !== newVal) {
            wDiffs.push({
              field: wf.key,
              fieldLabel: wf.label,
              oldValue: dbWarga[wf.key] || '-',
              newValue: row[wf.key] || '-',
            });
          }
        }

        if (wDiffs.length > 0) {
          wStatus = 'DIPERBARUI';
          wAction = 'UPDATE';
          summaryUpdated++;
        } else {
          wStatus = 'SAMA';
          wAction = 'SKIP';
          summarySame++;
        }
      }

      memberItems.push({
        id: `row-${row.rowNumber}-${row.nik}`,
        nik: row.nik,
        no_kk: row.no_kk,
        nama_lengkap: row.nama_lengkap,
        jenis_kelamin: row.jenis_kelamin,
        tempat_lahir: row.tempat_lahir,
        tanggal_lahir: row.tanggal_lahir,
        agama: row.agama,
        pendidikan: row.pendidikan,
        pekerjaan: row.pekerjaan,
        status_perkawinan: row.status_perkawinan,
        status_hubungan: row.status_hubungan,
        kewarganegaraan: row.kewarganegaraan,
        nama_ayah: row.nama_ayah,
        nama_ibu: row.nama_ibu,
        golongan_darah: row.golongan_darah,
        no_telp: row.no_telp,
        status_warga: row.status_warga,
        status: wStatus,
        action: wAction,
        diffs: wDiffs,
        conflictReason: wConflict,
        isExistingInDb: !!dbWarga,
      });
    }

    if (dbKK && Array.isArray(dbKK.anggota)) {
      for (const existingMember of dbKK.anggota) {
        if (!processedNiksInImport.has(existingMember.nik)) {
          summaryMissing++;
          memberItems.push({
            id: `missing-${existingMember.nik}`,
            nik: existingMember.nik,
            no_kk: existingMember.no_kk,
            nama_lengkap: existingMember.nama_lengkap,
            jenis_kelamin: existingMember.jenis_kelamin,
            tempat_lahir: existingMember.tempat_lahir,
            tanggal_lahir: existingMember.tanggal_lahir,
            agama: existingMember.agama,
            pendidikan: existingMember.pendidikan,
            pekerjaan: existingMember.pekerjaan,
            status_perkawinan: existingMember.status_perkawinan,
            status_hubungan: existingMember.status_hubungan,
            kewarganegaraan: existingMember.kewarganegaraan,
            nama_ayah: existingMember.nama_ayah,
            nama_ibu: existingMember.nama_ibu,
            golongan_darah: existingMember.golongan_darah,
            no_telp: existingMember.no_telp,
            status_warga: existingMember.status_warga,
            status: 'TIDAK_DITEMUKAN',
            action: 'KEEP',
            diffs: [],
            conflictReason:
              'Data warga ini tercatat di database pada KK ini, tetapi tidak tercantum pada berkas import. Sistem TIDAK menghapusnya secara otomatis.',
            isExistingInDb: true,
          });
        }
      }
    }

    resultKKItems.push({
      no_kk: noKk,
      kepala_keluarga: firstRow.kepala_keluarga,
      alamat: firstRow.alamat,
      rt: firstRow.rt,
      rw: firstRow.rw,
      status_hunian: firstRow.status_hunian,
      status: kkStatus,
      action: kkAction,
      diffs: kkDiffs,
      conflictReason: kkConflictReason,
      members: memberItems,
    });
  }

  return {
    filename,
    totalRows: parsedRows.length,
    totalKK: resultKKItems.length,
    summary: {
      newCount: summaryNew,
      sameCount: summarySame,
      updatedCount: summaryUpdated,
      conflictCount: summaryConflict,
      missingCount: summaryMissing,
    },
    kkItems: resultKKItems,
    validationErrors,
  };
}
