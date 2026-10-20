import { PrismaClient } from '@prisma/client';

let supabaseClient: PrismaClient | null = null;

export function getSupabaseClient(): PrismaClient {
  if (!supabaseClient) {
    const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!rawUrl) {
      throw new Error(
        'Konfigurasi database cloud (SUPABASE_DATABASE_URL / DIRECT_URL / DATABASE_URL) tidak ditemukan. ' +
        'Pastikan file .env atau .env.local berisi variabel database yang benar.'
      );
    }
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
