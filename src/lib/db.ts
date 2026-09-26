import { PrismaClient } from '@prisma/client';

function sanitizeDbUrl(raw?: string): string {
  const fallback = 'postgresql://postgres.cgfljoyxdvgxncebwype:WargaIstimewa2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  if (!raw) return fallback;
  
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
    return fallback;
  }

  return str;
}

const cleanedUrl = sanitizeDbUrl(process.env.DATABASE_URL);
process.env.DATABASE_URL = cleanedUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: cleanedUrl,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
