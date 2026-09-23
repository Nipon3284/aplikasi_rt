import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractKKFromImage } from '@/lib/gemini-ocr';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const scans = await prisma.scanQueue.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ success: true, data: scans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const isSample = formData.get('isSample') === 'true';

    let imageUrl = '/sample-kk.jpg';
    let filename = 'sample-kk.jpg';
    let base64 = '';
    let mimeType = 'image/jpeg';

    if (file && !isSample) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      base64 = buffer.toString('base64');
      mimeType = file.type || 'image/jpeg';

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.name) || '.jpg';
      filename = `kk-${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);
      imageUrl = `/uploads/${filename}`;
    }

    // Jalankan ekstraksi OCR / AI dengan Graceful Fallback jika kuota habis/error
    let extracted: any = null;
    let ocrErrorMsg: string | null = null;

    try {
      extracted = await extractKKFromImage(base64, mimeType);
    } catch (ocrErr: any) {
      console.warn('[Scan Route] AI OCR gagal, memicu Graceful Fallback:', ocrErr?.message || ocrErr);
      ocrErrorMsg = ocrErr?.message || 'Gagal mengekstrak teks otomatis';

      // Fallback draft agar foto KK tetap tersimpan dan tidak hilang
      extracted = {
        no_kk: '',
        kepala_keluarga: '',
        alamat: '',
        rt: '003',
        rw: '003',
        kelurahan: '',
        kecamatan: '',
        kabupaten_kota: '',
        provinsi: '',
        kode_pos: '',
        tgl_dikeluarkan: '',
        confidence_score: 0.1,
        warnings: [
          `AI OCR ditunda: ${ocrErrorMsg}. Berkas tersimpan aman dan dapat diverifikasi/dianalisis ulang.`
        ],
        anggota: [],
      };
    }

    // Simpan dokumen dan draf ke antrean verifikasi
    const scanRecord = await prisma.scanQueue.create({
      data: {
        image_url: imageUrl,
        filename: filename,
        status: ocrErrorMsg ? 'PENDING_OCR' : 'PENDING',
        extracted_json: JSON.stringify(extracted),
        confidence_score: extracted.confidence_score || 0.1,
      },
    });

    return NextResponse.json({
      success: true,
      message: ocrErrorMsg
        ? 'Dokumen berhasil diunggah ke antrean (analisis AI ditunda karena kuota habis)'
        : 'Dokumen berhasil dipindai dan masuk antrean verifikasi',
      data: scanRecord,
      ocrPending: !!ocrErrorMsg,
    });
  } catch (error: any) {
    console.error('Fatal error scanning KK:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
