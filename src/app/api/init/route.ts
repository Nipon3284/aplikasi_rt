import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shouldSeed = searchParams.get('seed') === 'true';

    if (shouldSeed) {
      await seedDatabase();
      return NextResponse.json({ success: true, message: 'Database seeded' });
    }

    return NextResponse.json({ success: true, message: 'Database ready' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
