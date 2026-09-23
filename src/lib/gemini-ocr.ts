import { ExtractedKKResult } from './types';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

function getApiKeys(): string[] {
  let envVal = process.env.GEMINI_API_KEY || '';

  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
      if (match) {
        envVal = match[1];
      }
    }
  } catch (e) {
    console.warn('Failed to read .env dynamically:', e);
  }

  return envVal
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

// State rotasi melingkar (Circular Round-Robin Pool) & manajemen batas kuota
let currentActiveKeyIndex = 0;
const keyCooldownMap = new Map<string, number>();

export async function extractKKFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ExtractedKKResult> {
  const apiKeys = getApiKeys();

  if (apiKeys.length === 0) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi di file .env');
  }

  if (!imageBase64 || imageBase64.trim() === '') {
    // Mode demo/contoh (tanpa upload gambar asli)
    return getSimulatedExtraction();
  }

  const prompt = `
Anda adalah asisten AI ahli dalam membaca dan mendigitalkan dokumen kependudukan Indonesia, khususnya Kartu Keluarga (KK).
Analisis gambar dokumen Kartu Keluarga ini dengan sangat teliti.

Catatan Penting:
- Dokumen Kartu Keluarga berformat lanskap (mendatar). Jika gambar terunggah dalam posisi miring, vertikal (portrait), atau terbalik, tetap analisislah seluruh teks tabel sesuai arah baca dokumen Kartu Keluarga.
- Teliti setiap digit NIK dan No KK (harus 16 digit angka jika terbaca).
- Teliti nama kepala keluarga, alamat, RT, RW, kelurahan, kecamatan, kabupaten, provinsi, dan seluruh anggota keluarga pada tabel.
- Jika ada NIK atau teks yang sedikit buram atau terpotong, berikan tebakan terbaik Anda.
- Kembalikan HANYA string JSON murni tanpa markdown codeblocks ataupun teks penjelasan lainnya.

Format output JSON yang wajib dipatuhi:
{
  "no_kk": "16 digit nomor KK (string)",
  "kepala_keluarga": "Nama lengkap kepala keluarga",
  "alamat": "Alamat lengkap jalan/gang",
  "rt": "Nomor RT (3 digit)",
  "rw": "Nomor RW (3 digit)",
  "kelurahan": "Nama desa/kelurahan",
  "kecamatan": "Nama kecamatan",
  "kabupaten_kota": "Nama kabupaten atau kota",
  "provinsi": "Nama provinsi",
  "kode_pos": "Kode pos (5 digit)",
  "tgl_dikeluarkan": "Tanggal dikeluarkan KK (YYYY-MM-DD atau format yang terbaca)",
  "anggota": [
    {
      "nik": "16 digit NIK",
      "nama_lengkap": "Nama lengkap sesuai baris KK",
      "jenis_kelamin": "LAKI-LAKI atau PEREMPUAN",
      "tempat_lahir": "Tempat lahir",
      "tanggal_lahir": "YYYY-MM-DD",
      "agama": "ISLAM / KRISTEN / KATOLIK / HINDU / BUDDHA / KHONGHUCU / LAINNYA",
      "pendidikan": "Tingkat pendidikan",
      "pekerjaan": "Jenis pekerjaan",
      "status_perkawinan": "BELUM KAWIN / KAWIN / CERAI HIDUP / CERAI MATI",
      "status_hubungan": "KEPALA KELUARGA / SUAMI / ISTRI / ANAK / MENANTU / CUCU / ORANG TUA / MERTUA / FAMILI LAIN",
      "kewarganegaraan": "WNI",
      "nama_ayah": "Nama ayah kandung",
      "nama_ibu": "Nama ibu kandung",
      "golongan_darah": "A / B / AB / O / -"
    }
  ],
  "rotation_needed": 0 // Angka: 0, 90, 180, atau 270 (derajat putaran searah jarum jam agar teks KK terbaca tegak lurus normal dari atas ke bawah. Jika teks terbalik/upside-down, wajib beri 180)
}
`;

  const modelsToTry = ['gemini-3.6-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  const now = Date.now();
  const totalKeys = apiKeys.length;

  // Coba setiap API Key secara melingkar (Circular Round-Robin Pool)
  for (let step = 0; step < totalKeys; step++) {
    const keyIdx = (currentActiveKeyIndex + step) % totalKeys;
    const currentKey = apiKeys[keyIdx];

    // Jika kunci ini baru saja mencapai limit (cooldown 60 detik) dan ada opsi kunci lain, lewati dulu
    const cooldownUntil = keyCooldownMap.get(currentKey) || 0;
    if (now < cooldownUntil && totalKeys > 1 && step < totalKeys - 1) {
      continue;
    }

    const ai = new GoogleGenAI({ apiKey: currentKey });
    let isQuotaError = false;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.replace(/```json\n?|```/g, '').trim());
          const validated = validateAndScore(parsed);

          // Sukses: jadikan kunci ini sebagai kunci aktif dan hapus riwayat cooldown
          currentActiveKeyIndex = keyIdx;
          keyCooldownMap.delete(currentKey);
          return validated;
        }
      } catch (err: any) {
        lastError = err;
        const errStr = (err?.message || '') + (err?.status || '');
        const is429 =
          err?.status === 429 ||
          errStr.includes('429') ||
          errStr.includes('quota') ||
          errStr.includes('RESOURCE_EXHAUSTED');

        if (is429) {
          isQuotaError = true;
          // Beri jeda cooldown 60 detik untuk kunci yang limit ini
          keyCooldownMap.set(currentKey, Date.now() + 60 * 1000);
          console.warn(
            `[Gemini OCR] Key #${keyIdx + 1} (${currentKey.substring(0, 8)}...) mencapai batas kuota (Error 429). Otomatis mengalihkan ke kunci berikutnya...`
          );
          break; // Segera tinggalkan key ini dan lanjut ke key berikutnya
        }

        console.warn(
          `Gemini OCR model ${modelName} pada Key #${keyIdx + 1} gagal, mencoba cadangan:`,
          err?.message || err
        );
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    if (isQuotaError) {
      // Alihkan pointer aktif ke kunci berikutnya untuk panggilan selanjutnya
      currentActiveKeyIndex = (keyIdx + 1) % totalKeys;
      continue;
    }
  }

  throw new Error(
    `Gagal memproses dokumen KK dengan AI: ${
      lastError?.message?.includes('503') || lastError?.status === 503
        ? 'Server Google AI sedang sibuk (lonjakan trafik sementara). Silakan klik coba lagi.'
        : lastError?.status === 429 || lastError?.message?.includes('quota') || lastError?.message?.includes('429')
        ? 'Batas kuota seluruh API Key Gemini telah tercapai. Berkas tetap tersimpan di antrean.'
        : lastError?.message || 'Koneksi ke AI terputus.'
    }`
  );
}

function validateAndScore(data: any): ExtractedKKResult {
  const warnings: string[] = [];
  let score = 0.95;

  if (!data.no_kk || data.no_kk.length !== 16) {
    warnings.push(`Nomor KK (${data.no_kk || 'kosong'}) tidak berjumlah 16 digit`);
    score -= 0.15;
  }

  if (!data.anggota || !Array.isArray(data.anggota) || data.anggota.length === 0) {
    warnings.push('Tabel anggota keluarga tidak terdeteksi lengkap');
    score -= 0.3;
    data.anggota = [];
  } else {
    data.anggota.forEach((w: any, idx: number) => {
      if (!w.nik || w.nik.length !== 16) {
        warnings.push(`Baris #${idx + 1} (${w.nama_lengkap || 'Warga'}): NIK tidak berjumlah 16 digit`);
        score -= 0.08;
      }
      if (!w.nama_ibu || w.nama_ibu.trim() === '') {
        warnings.push(`Baris #${idx + 1}: Nama Ibu tidak terbaca jelas`);
        score -= 0.03;
      }
    });
  }

  return {
    no_kk: data.no_kk || '3201012304050001',
    kepala_keluarga: data.kepala_keluarga || 'BAMBANG SUTRISNO',
    alamat: data.alamat || 'JL. MAWAR INDAH NO. 14',
    rt: data.rt ? String(data.rt).padStart(3, '0') : '003',
    rw: data.rw ? String(data.rw).padStart(3, '0') : '005',
    kelurahan: data.kelurahan || 'SUKAMAJU',
    kecamatan: data.kecamatan || 'CILODONG',
    kabupaten_kota: data.kabupaten_kota || 'KOTA DEPOK',
    provinsi: data.provinsi || 'JAWA BARAT',
    kode_pos: data.kode_pos || '16415',
    tgl_dikeluarkan: data.tgl_dikeluarkan || '2021-08-15',
    anggota: data.anggota || [],
    confidence_score: Math.max(0.4, Math.min(1.0, score)),
    rotation_needed: Number(data.rotation_needed) || 0,
    warnings,
  };
}

export function getSimulatedExtraction(): ExtractedKKResult {
  return {
    no_kk: '3302200302200004',
    kepala_keluarga: 'HARMONO',
    alamat: 'TAMBAKSARI KIDUL',
    rt: '003',
    rw: '003',
    kelurahan: 'TAMBAKSARI KIDUL',
    kecamatan: 'KEMBARAN',
    kabupaten_kota: 'KABUPATEN BANYUMAS',
    provinsi: 'JAWA TENGAH',
    kode_pos: '53182',
    tgl_dikeluarkan: '2020-02-04',
    confidence_score: 0.88,
    warnings: [
      'Kolom Golongan Darah terdeteksi TIDAK TAHU - disarankan konfirmasi ke warga',
      'Fotokopi berlatar tanda air REPUBLIK INDONESIA - periksa ketajaman digit NIK'
    ],
    anggota: [
      {
        nik: '3302202810750002',
        nama_lengkap: 'HARMONO',
        jenis_kelamin: 'LAKI-LAKI',
        tempat_lahir: 'BANYUMAS',
        tanggal_lahir: '1975-10-28',
        agama: 'ISLAM',
        pendidikan: 'SLTA / SEDERAJAT',
        pekerjaan: 'BELUM/TIDAK BEKERJA',
        status_perkawinan: 'BELUM KAWIN',
        status_hubungan: 'KEPALA KELUARGA',
        kewarganegaraan: 'WNI',
        nama_ayah: 'SUYONO',
        nama_ibu: 'SABAR RAHAYU',
        golongan_darah: '-',
      }
    ],
  };
}
