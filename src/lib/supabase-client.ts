import { PrismaClient } from '@prisma/client';

const SUPABASE_FALLBACK =
  'postgresql://postgres.cgfljoyxdvgxncebwype:WargaIstimewa2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

let supabaseClient: PrismaClient | null = null;

export function getSupabaseClient(): PrismaClient {
  if (!supabaseClient) {
    const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DIRECT_URL || SUPABASE_FALLBACK;
    supabaseClient = new PrismaClient({
      datasources: {
        db: {
          url: rawUrl,
        },
      },
      log: ['error'],
    });
  }
  return supabaseClient;
}
