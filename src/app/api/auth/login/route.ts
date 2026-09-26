import { NextResponse } from 'next/server';
import { 
  validateAdminCredentials, 
  createSessionToken, 
  COOKIE_NAME, 
  DEFAULT_ADMIN 
} from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username dan password wajib diisi!' },
        { status: 400 }
      );
    }

    const isValid = validateAdminCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Username atau password salah!' },
        { status: 401 }
      );
    }

    // Buat JWT Token
    const token = await createSessionToken({
      username: DEFAULT_ADMIN.username,
      role: 'ADMIN',
      name: DEFAULT_ADMIN.name,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil!',
      user: {
        username: DEFAULT_ADMIN.username,
        role: 'ADMIN',
        name: DEFAULT_ADMIN.name,
      },
    });

    // Simpan token di HTTP-Only Cookie yang aman
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat login.' },
      { status: 500 }
    );
  }
}
