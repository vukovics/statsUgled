import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface Suggestion {
  sifra_art: string;
  naziv_art: string;
  avg_daily_quantity: number;
  total_historical_quantity: number;
  suggested_order_quantity: number;
  years_analyzed: number;
  historical_revenue: number;
  avg_price: number;
  confidence: 'high' | 'medium' | 'low';
  yearly_breakdown: {
    year: string;
    quantity: number;
    revenue: number;
  }[];
}

interface HistoricalSale {
  sifra_art: string;
  naziv_art: string;
  total_quantity: number;
  total_revenue: number;
  sale_count: number;
  avg_price: number;
  year: string;
}

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('.').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function getHistoricalDateRanges(startDate: Date, days: number, yearsBack: number): string[][] {
  const ranges: string[][] = [];
  const currentYear = startDate.getFullYear();

  for (let yearOffset = 1; yearOffset <= yearsBack; yearOffset++) {
    const historicalStartDate = new Date(startDate);
    historicalStartDate.setFullYear(currentYear - yearOffset);

    const historicalEndDate = new Date(historicalStartDate);
    historicalEndDate.setDate(historicalEndDate.getDate() + days - 1);

    const startStr = formatDate(historicalStartDate);
    const endStr = formatDate(historicalEndDate);

    ranges.push([startStr, endStr, String(currentYear - yearOffset)]);
  }

  return ranges;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const daysParam = searchParams.get('days') || '10';
    const yearsBackParam = searchParams.get('years') || '4';

    const days = parseInt(daysParam);
    const yearsBack = parseInt(yearsBackParam);

    // Use provided date or today's date
    const startDate = dateParam ? parseDate(dateParam) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);

    // Get historical date ranges for the same period in previous years
    const historicalRanges = getHistoricalDateRanges(startDate, days, yearsBack);

    // Query historical data for each year
    const historicalData: Map<string, HistoricalSale[]> = new Map();

    for (const [startStr, endStr, year] of historicalRanges) {
      // Convert DD.MM.YYYY to YYYY-MM-DD for proper comparison
      const yearData = query<HistoricalSale>(
        `SELECT
          sifra_art,
          naziv_art,
          SUM(kolicina) as total_quantity,
          SUM(revenue) as total_revenue,
          COUNT(*) as sale_count,
          AVG(cena) as avg_price,
          ? as year
        FROM sales
        WHERE
          SUBSTR(datum, 7, 4) || '-' || SUBSTR(datum, 4, 2) || '-' || SUBSTR(datum, 1, 2) >=
          SUBSTR(?, 7, 4) || '-' || SUBSTR(?, 4, 2) || '-' || SUBSTR(?, 1, 2)
          AND
          SUBSTR(datum, 7, 4) || '-' || SUBSTR(datum, 4, 2) || '-' || SUBSTR(datum, 1, 2) <=
          SUBSTR(?, 7, 4) || '-' || SUBSTR(?, 4, 2) || '-' || SUBSTR(?, 1, 2)
        GROUP BY sifra_art, naziv_art`,
        [year, startStr, startStr, startStr, endStr, endStr, endStr]
      );

      if (yearData.length > 0) {
        historicalData.set(year, yearData);
      }
    }

    // Aggregate data across all years
    const productMap: Map<string, {
      sifra_art: string;
      naziv_art: string;
      total_quantity: number;
      total_revenue: number;
      years_found: number;
      prices: number[];
      yearly_data: Map<string, { quantity: number; revenue: number }>;
    }> = new Map();

    for (const [year, yearData] of historicalData.entries()) {
      for (const item of yearData) {
        const key = item.sifra_art;

        if (!productMap.has(key)) {
          productMap.set(key, {
            sifra_art: item.sifra_art,
            naziv_art: item.naziv_art,
            total_quantity: 0,
            total_revenue: 0,
            years_found: 0,
            prices: [],
            yearly_data: new Map()
          });
        }

        const product = productMap.get(key)!;
        product.total_quantity += item.total_quantity;
        product.total_revenue += item.total_revenue;
        product.years_found += 1;
        product.prices.push(item.avg_price);
        product.yearly_data.set(year, {
          quantity: item.total_quantity,
          revenue: item.total_revenue
        });
      }
    }

    // Calculate suggestions with confidence levels
    const suggestions: Suggestion[] = [];

    for (const [_, product] of productMap.entries()) {
      const avgDailyQuantity = product.total_quantity / (days * product.years_found);
      const suggestedOrderQuantity = Math.ceil(avgDailyQuantity * days);
      const avgPrice = product.prices.reduce((sum, p) => sum + p, 0) / product.prices.length;

      // Determine confidence based on how many years we found data
      let confidence: 'high' | 'medium' | 'low';
      if (product.years_found >= 3) {
        confidence = 'high';
      } else if (product.years_found >= 2) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      // Convert yearly data map to array
      const yearly_breakdown = Array.from(product.yearly_data.entries()).map(([year, data]) => ({
        year,
        quantity: data.quantity,
        revenue: data.revenue
      })).sort((a, b) => parseInt(b.year) - parseInt(a.year)); // Sort by year descending

      suggestions.push({
        sifra_art: product.sifra_art,
        naziv_art: product.naziv_art,
        avg_daily_quantity: avgDailyQuantity,
        total_historical_quantity: product.total_quantity,
        suggested_order_quantity: suggestedOrderQuantity,
        years_analyzed: product.years_found,
        historical_revenue: product.total_revenue,
        avg_price: avgPrice,
        confidence: confidence,
        yearly_breakdown: yearly_breakdown
      });
    }

    // Sort by suggested order quantity (highest first)
    suggestions.sort((a, b) => b.suggested_order_quantity - a.suggested_order_quantity);

    return NextResponse.json({
      success: true,
      data: suggestions,
      count: suggestions.length,
      analysis: {
        prediction_start_date: formatDate(startDate),
        prediction_end_date: formatDate(endDate),
        days_predicted: days,
        years_analyzed: yearsBack,
        years_with_data: historicalData.size,
        historical_periods: historicalRanges.map(([start, end, year]) => ({
          year: year,
          start_date: start,
          end_date: end,
          has_data: historicalData.has(year)
        }))
      }
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate suggestions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
