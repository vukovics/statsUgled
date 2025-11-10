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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let sql = 'SELECT * FROM sales';
    const params: any[] = [];

    // Add date filtering if provided
    if (startDate && endDate) {
      sql += ' WHERE datum >= ? AND datum <= ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      sql += ' WHERE datum >= ?';
      params.push(startDate);
    } else if (endDate) {
      sql += ' WHERE datum <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY datum DESC LIMIT ?';
    params.push(parseInt(limit));

    const sales = await query<Sale>(sql, params);

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
