import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_COOKIE = 'auth-token';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
