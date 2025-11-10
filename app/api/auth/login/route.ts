import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CORRECT_PIN = '1182';
const AUTH_COOKIE = 'auth-token';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (pin === CORRECT_PIN) {
      // Set secure cookie
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid PIN' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
