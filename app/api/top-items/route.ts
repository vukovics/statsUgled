import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface TopItem {
  sifra_art: string;
  naziv_art: string;
  total_quantity: number;
  total_revenue: number;
  sale_count: number;
  avg_price: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const limit = searchParams.get('limit') || '20';

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Date parameter is required (format: DD.MM.YYYY)'
        },
        { status: 400 }
      );
    }

    const topItems = query<TopItem>(
      `SELECT
        sifra_art,
        naziv_art,
        SUM(kolicina) as total_quantity,
        SUM(revenue) as total_revenue,
        COUNT(*) as sale_count,
        AVG(cena) as avg_price
      FROM sales
      WHERE datum = ?
      GROUP BY sifra_art, naziv_art
      ORDER BY total_quantity DESC
      LIMIT ?`,
      [date, parseInt(limit)]
    );

    return NextResponse.json({
      success: true,
      data: topItems,
      count: topItems.length,
      date: date
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top items',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
