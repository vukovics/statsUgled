import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface Sale {
  id: number;
  import_id: string;
  import_timestamp: string;
  sifra_art: string;
  naziv_art: string;
  kolicina: number;
  cena: number;
  datum: string;
  datum_az: string;
  revenue: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10';

    const sales = await query<Sale>(
      'SELECT * FROM sales ORDER BY datum DESC LIMIT ?',
      [parseInt(limit)]
    );

    return NextResponse.json({
      success: true,
      data: sales,
      count: sales.length
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sales data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
