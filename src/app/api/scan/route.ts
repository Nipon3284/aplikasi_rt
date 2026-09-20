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

    // Jalankan ekstraksi OCR / AI
    const extracted = await extractKKFromImage(base64, mimeType);

    // Simpan ke antrean verifikasi
    const scanRecord = await prisma.scanQueue.create({
      data: {
        image_url: imageUrl,
        filename: filename,
        status: 'PENDING',
        extracted_json: JSON.stringify(extracted),
        confidence_score: extracted.confidence_score,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil dipindai dan masuk antrean verifikasi',
      data: scanRecord,
    });
  } catch (error: any) {
    console.error('Error scanning KK:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
