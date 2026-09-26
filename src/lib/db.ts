import { PrismaClient as PostgresClient } from '@prisma/client';
import { PrismaClient as SQLiteClient } from '@prisma/client-sqlite';

const isCloud = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  if (isCloud) {
    const fallback =
      'postgresql://postgres.cgfljoyxdvgxncebwype:WargaIstimewa2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const dbUrl = process.env.DATABASE_URL || fallback;
    return new PostgresClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: ['error'],
    });
  } else {
    // Local SQLite database
    return new SQLiteClient({
      log: ['error'],
    });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
