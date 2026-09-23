import { NextResponse } from 'next/server';
import { generateImportTemplateExcel } from '@/lib/excel-service';

export async function GET() {
  try {
    const templateBuffer = await generateImportTemplateExcel();
    const filename = 'Template-Import-Data-Warga-RT003-RW003.xlsx';

    return new NextResponse(new Uint8Array(templateBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Template Download Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
