import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET;
if (!JWT_SECRET_STRING) {
  console.error('PERINGATAN KEAMANAN: JWT_SECRET belum dikonfigurasi di environment variable!');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING || 'FALLBACK_NOT_SECURE_CHANGE_ME');

export const COOKIE_NAME = 'si_warga_token';

// Kredensial Admin wajib diset melalui Environment Variable
export const DEFAULT_ADMIN = {
  username: process.env.ADMIN_USERNAME || '',
  password: process.env.ADMIN_PASSWORD || '',
  name: process.env.ADMIN_USERNAME ? `${process.env.ADMIN_USERNAME} (admin)` : 'Admin RT',
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

  // Pastikan kredensial admin sudah dikonfigurasi
  if (!DEFAULT_ADMIN.username || !DEFAULT_ADMIN.password) {
    console.error(
      'PERINGATAN KEAMANAN: ADMIN_USERNAME dan ADMIN_PASSWORD belum dikonfigurasi di environment variable! Login tidak dapat dilakukan.'
    );
    return false;
  }

  return (
    username.trim().toLowerCase() === DEFAULT_ADMIN.username.toLowerCase() &&
    password === DEFAULT_ADMIN.password
  );
}
