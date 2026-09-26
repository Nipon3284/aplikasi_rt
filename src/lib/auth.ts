import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'si-warga-rt-secret-key-2026-istimewa-rw03-rt03';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const COOKIE_NAME = 'si_warga_token';

// Kredensial Admin Default Sesuai Rancangan
export const DEFAULT_ADMIN = {
  username: process.env.ADMIN_USERNAME || 'kangmasngud',
  password: process.env.ADMIN_PASSWORD || 'kangmasngud123',
  name: 'Kang Mas Ngud (Ketua RT)',
  role: 'ADMIN' as const,
};

export interface TokenPayload {
  username: string;
  role: 'ADMIN' | 'WARGA';
  name: string;
}

/**
 * Membuat JWT session token yang aman (berlaku 7 hari)
 */
export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Memverifikasi validitas token JWT
 */
export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Validasi username dan password admin
 */
export function validateAdminCredentials(username?: string, password?: string): boolean {
  if (!username || !password) return false;
  return (
    username.trim().toLowerCase() === DEFAULT_ADMIN.username.toLowerCase() &&
    password === DEFAULT_ADMIN.password
  );
}
