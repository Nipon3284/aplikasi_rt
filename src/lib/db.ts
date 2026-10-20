import { PrismaClient as PostgresClient } from '@prisma/client';
import { PrismaClient as SQLiteClient } from '@prisma/client-sqlite';

const isCloud = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_PUBLIC_WEB === 'true';

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function sanitizeDbUrl(raw?: string): string {
  if (!raw) {
    throw new Error(
      'DATABASE_URL / DIRECT_URL belum dikonfigurasi di environment variable. ' +
      'Pastikan file .env atau .env.local berisi variabel database yang benar.'
    );
  }

  let str = raw.trim();

  // If multi-line (e.g. user pasted with # comments), extract the connection string line
  const lines = str.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes('postgresql://') || trimmed.includes('postgres://')) {
      str = trimmed;
      break;
    }
  }

  // If user pasted 'DATABASE_URL=...'
  if (str.includes('=')) {
    const eqIdx = str.indexOf('=');
    const keyPart = str.slice(0, eqIdx).trim().toUpperCase();
    if (keyPart.includes('DATABASE_URL') || keyPart.includes('DIRECT_URL')) {
      str = str.slice(eqIdx + 1).trim();
    }
  }

  // Strip surrounding quotes
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }

  // Ensure it starts with postgresql:// or postgres://
  if (!str.startsWith('postgresql://') && !str.startsWith('postgres://')) {
    throw new Error(
      'DATABASE_URL tidak valid: harus diawali postgresql:// atau postgres://'
    );
  }

  return str;
}

if (isCloud) {
  const cleanedUrl = sanitizeDbUrl(process.env.DATABASE_URL);
  process.env.DATABASE_URL = cleanedUrl;

  const cleanedDirect = sanitizeDbUrl(process.env.DIRECT_URL || process.env.DATABASE_URL);
  process.env.DIRECT_URL = cleanedDirect;
}

function createPrismaClient() {
  if (isCloud) {
    const dbUrl = process.env.DATABASE_URL!;
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
