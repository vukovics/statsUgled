import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface SalesTrendData {
  period: string;
  total_revenue: number;
  total_quantity: number;
  sale_count: number;
  avg_price: number;
}

interface YearOverYearData {
  period: string;
  current_year: number;
  previous_year: number;
  growth_percent: number;
  current_revenue: number;
  previous_revenue: number;
}

interface MovingAverageData {
  date: string;
  daily_revenue: number;
  ma_7day: number;
  ma_30day: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly, yearly
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate period
    const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { success: false, error: 'Invalid period. Must be: daily, weekly, monthly, or yearly' },
        { status: 400 }
      );
    }

    // Build date filter - dates in DB are DD.MM.YYYY format
    // We convert them to YYYY-MM-DD for proper comparison using SUBSTR
    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = `WHERE
        SUBSTR(datum_az, 7, 4) || '-' || SUBSTR(datum_az, 4, 2) || '-' || SUBSTR(datum_az, 1, 2) >= ?
        AND
        SUBSTR(datum_az, 7, 4) || '-' || SUBSTR(datum_az, 4, 2) || '-' || SUBSTR(datum_az, 1, 2) <= ?`;
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = `WHERE
        SUBSTR(datum_az, 7, 4) || '-' || SUBSTR(datum_az, 4, 2) || '-' || SUBSTR(datum_az, 1, 2) >= ?`;
      params.push(startDate);
    } else if (endDate) {
      dateFilter = `WHERE
        SUBSTR(datum_az, 7, 4) || '-' || SUBSTR(datum_az, 4, 2) || '-' || SUBSTR(datum_az, 1, 2) <= ?`;
      params.push(endDate);
    }

    // Prepare aggregation query based on period
    // Note: datum_az is in DD.MM.YYYY format, so we extract parts using SUBSTR
    let groupBy = '';
    let periodSelect = '';

    switch (period) {
      case 'daily':
        periodSelect = 'datum AS period';
        groupBy = 'datum';
        break;
      case 'weekly':
        // Group by year and week number
        // Convert DD.MM.YYYY to YYYY-MM-DD for strftime
        periodSelect = `strftime('%Y-W%W',
          SUBSTR(datum_az, 7, 4) || '-' || SUBSTR(datum_az, 4, 2) || '-' || SUBSTR(datum_az, 1, 2)
        ) AS period`;
        groupBy = `strftime('%Y-W%W',
          SUBSTR(datum_az, 7, 4) || '-' || SUBSTR(datum_az, 4, 2) || '-' || SUBSTR(datum_az, 1, 2)
        )`;
        break;
      case 'monthly':
        // Extract year-month: YYYY-MM
        periodSelect = "SUBSTR(datum_az, 7, 4) || '-' || SUBSTR(datum_az, 4, 2) AS period";
        groupBy = "SUBSTR(datum_az, 7, 4) || '-' || SUBSTR(datum_az, 4, 2)";
        break;
      case 'yearly':
        // Extract year: YYYY
        periodSelect = "SUBSTR(datum_az, 7, 4) AS period";
        groupBy = "SUBSTR(datum_az, 7, 4)";
        break;
    }

    // Main aggregation query
    const trendsQuery = `
      SELECT
        ${periodSelect},
        SUM(revenue) AS total_revenue,
        SUM(kolicina) AS total_quantity,
        COUNT(*) AS sale_count,
        AVG(cena) AS avg_price
      FROM sales
      ${dateFilter}
      GROUP BY ${groupBy}
      ORDER BY period ASC
    `;

    const trends = await query<SalesTrendData>(trendsQuery, params);

    // Year-over-year comparison (only for monthly/yearly)
    let yoyComparison: YearOverYearData[] = [];

    if (period === 'monthly' || period === 'yearly') {
      // Get data grouped by period and year for comparison
      const yoyQuery = `
        SELECT
          CASE
            WHEN ? = 'monthly' THEN SUBSTR(datum_az, 4, 2)
            ELSE 'year'
          END AS period,
          SUBSTR(datum_az, 7, 4) AS year,
          SUM(revenue) AS revenue,
          SUM(kolicina) AS quantity
        FROM sales
        ${dateFilter}
        GROUP BY period, year
        ORDER BY period, year
      `;

      const yoyData = await query<any>(yoyQuery, [period, ...params]);

      // Calculate year-over-year growth
      const yoyMap = new Map<string, any[]>();

      yoyData.forEach((row: any) => {
        if (!yoyMap.has(row.period)) {
          yoyMap.set(row.period, []);
        }
        yoyMap.get(row.period)!.push(row);
      });

      yoyComparison = Array.from(yoyMap.entries()).flatMap(([period, years]) => {
        const comparisons: YearOverYearData[] = [];

        // Sort by year
        years.sort((a, b) => parseInt(a.year) - parseInt(b.year));

        // Compare consecutive years
        for (let i = 1; i < years.length; i++) {
          const current = years[i];
          const previous = years[i - 1];

          const growthPercent = previous.revenue > 0
            ? ((current.revenue - previous.revenue) / previous.revenue) * 100
            : 0;

          comparisons.push({
            period: period === 'year' ? current.year : `${current.year}-${period.padStart(2, '0')}`,
            current_year: parseInt(current.year),
            previous_year: parseInt(previous.year),
            growth_percent: growthPercent,
            current_revenue: current.revenue,
            previous_revenue: previous.revenue
          });
        }

        return comparisons;
      });
    }

    // Moving averages (only for daily)
    let movingAverages: MovingAverageData[] = [];

    if (period === 'daily') {
      // Get daily revenue
      const dailyQuery = `
        SELECT
          datum_az AS date,
          SUM(revenue) AS daily_revenue
        FROM sales
        ${dateFilter}
        GROUP BY datum_az
        ORDER BY datum_az ASC
      `;

      const dailyData = await query<{ date: string; daily_revenue: number }>(dailyQuery, params);

      // Calculate moving averages
      movingAverages = dailyData.map((row, index, arr) => {
        // 7-day moving average
        const start7 = Math.max(0, index - 6);
        const slice7 = arr.slice(start7, index + 1);
        const ma_7day = slice7.reduce((sum, r) => sum + r.daily_revenue, 0) / slice7.length;

        // 30-day moving average
        const start30 = Math.max(0, index - 29);
        const slice30 = arr.slice(start30, index + 1);
        const ma_30day = slice30.reduce((sum, r) => sum + r.daily_revenue, 0) / slice30.length;

        return {
          date: row.date,
          daily_revenue: row.daily_revenue,
          ma_7day,
          ma_30day
        };
      });
    }

    // Calculate summary statistics
    const totalRevenue = trends.reduce((sum, t) => sum + t.total_revenue, 0);
    const totalQuantity = trends.reduce((sum, t) => sum + t.total_quantity, 0);
    const avgRevenue = trends.length > 0 ? totalRevenue / trends.length : 0;

    return NextResponse.json({
      success: true,
      period,
      data: trends,
      yoyComparison,
      movingAverages,
      summary: {
        total_revenue: totalRevenue,
        total_quantity: totalQuantity,
        avg_revenue_per_period: avgRevenue,
        periods_count: trends.length
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sales trends',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
