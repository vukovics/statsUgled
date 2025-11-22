import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface ProductPerformance {
  sifra_art: string;
  naziv_art: string;
  total_quantity: number;
  total_revenue: number;
  sale_count: number;
  avg_price: number;
  first_sale_date: string;
  last_sale_date: string;
  days_on_market: number;
  avg_monthly_quantity: number;
  velocity_score: number;
}

interface SeasonalPattern {
  month: string;
  month_name: string;
  total_revenue: number;
  total_quantity: number;
  sale_count: number;
  avg_daily_revenue: number;
  year_over_year_growth: number;
}

interface ProductSeasonality {
  sifra_art: string;
  naziv_art: string;
  monthly_patterns: {
    month: string;
    quantity: number;
    revenue: number;
    percentage_of_annual: number;
  }[];
  peak_months: string[];
  low_months: string[];
}

interface SlowMovingProduct {
  sifra_art: string;
  naziv_art: string;
  total_quantity: number;
  total_revenue: number;
  last_sale_date: string;
  days_since_last_sale: number;
  avg_monthly_quantity: number;
  recommendation: 'discontinue' | 'discount' | 'monitor';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const analysisType = searchParams.get('type') || 'overview'; // overview, best-sellers, slow-movers, seasonal
    const startDate = searchParams.get('startDate') || '2021-02-01';
    const endDate = searchParams.get('endDate') || '2024-10-31';
    const limit = parseInt(searchParams.get('limit') || '50');
    const minSales = parseInt(searchParams.get('minSales') || '10');
    const sortBy = searchParams.get('sortBy') || 'quantity'; // quantity or revenue

    // Helper to build date filter
    const dateFilter = `
      WHERE
        SUBSTR(datum_az, 7, 4) || '-' || SUBSTR(datum_az, 4, 2) || '-' || SUBSTR(datum_az, 1, 2) >= ?
        AND
        SUBSTR(datum_az, 7, 4) || '-' || SUBSTR(datum_az, 4, 2) || '-' || SUBSTR(datum_az, 1, 2) <= ?
    `;

    const params = [startDate, endDate];

    if (analysisType === 'best-sellers') {
      // Get best-selling products with performance metrics
      const orderByColumn = sortBy === 'revenue' ? 'total_revenue' : 'total_quantity';
      const bestSellersQuery = `
        SELECT
          sifra_art,
          naziv_art,
          SUM(kolicina) as total_quantity,
          SUM(revenue) as total_revenue,
          COUNT(*) as sale_count,
          AVG(cena) as avg_price,
          MIN(datum_az) as first_sale_date,
          MAX(datum_az) as last_sale_date,
          JULIANDAY(MAX(datum_az)) - JULIANDAY(MIN(datum_az)) + 1 as days_on_market,
          (SUM(kolicina) / ((JULIANDAY(MAX(datum_az)) - JULIANDAY(MIN(datum_az)) + 1) / 30.0)) as avg_monthly_quantity,
          (SUM(revenue) / COUNT(*)) as velocity_score
        FROM sales
        ${dateFilter}
        GROUP BY sifra_art, naziv_art
        HAVING sale_count >= ?
        ORDER BY ${orderByColumn} DESC
        LIMIT ?
      `;

      const bestSellers = await query<ProductPerformance>(
        bestSellersQuery,
        [...params, minSales, limit]
      );

      return NextResponse.json({
        success: true,
        type: 'best-sellers',
        data: bestSellers,
        count: bestSellers.length
      });
    }

    if (analysisType === 'slow-movers') {
      // Get slow-moving products that might need discounting or discontinuation
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const slowMoversQuery = `
        SELECT
          sifra_art,
          naziv_art,
          SUM(kolicina) as total_quantity,
          SUM(revenue) as total_revenue,
          COUNT(*) as sale_count,
          MAX(datum_az) as last_sale_date,
          (JULIANDAY('${todayStr}') - JULIANDAY(
            SUBSTR(MAX(datum_az), 7, 4) || '-' || SUBSTR(MAX(datum_az), 4, 2) || '-' || SUBSTR(MAX(datum_az), 1, 2)
          )) as days_since_last_sale,
          (SUM(kolicina) / ((JULIANDAY(MAX(datum_az)) - JULIANDAY(MIN(datum_az)) + 1) / 30.0)) as avg_monthly_quantity
        FROM sales
        ${dateFilter}
        GROUP BY sifra_art, naziv_art
        HAVING sale_count >= 3
        ORDER BY days_since_last_sale DESC, avg_monthly_quantity ASC
        LIMIT ?
      `;

      const slowMovers = await query<SlowMovingProduct>(
        slowMoversQuery,
        [...params, limit]
      );

      // Add recommendations
      const slowMoversWithRecs = slowMovers.map(product => ({
        ...product,
        recommendation:
          product.days_since_last_sale > 180 ? 'discontinue' as const :
          product.days_since_last_sale > 90 ? 'discount' as const :
          'monitor' as const
      }));

      return NextResponse.json({
        success: true,
        type: 'slow-movers',
        data: slowMoversWithRecs,
        count: slowMoversWithRecs.length
      });
    }

    if (analysisType === 'seasonal') {
      // Analyze overall seasonal patterns
      const seasonalQuery = `
        SELECT
          SUBSTR(datum_az, 4, 2) as month,
          CASE SUBSTR(datum_az, 4, 2)
            WHEN '01' THEN 'Januar'
            WHEN '02' THEN 'Februar'
            WHEN '03' THEN 'Mart'
            WHEN '04' THEN 'April'
            WHEN '05' THEN 'Maj'
            WHEN '06' THEN 'Juni'
            WHEN '07' THEN 'Juli'
            WHEN '08' THEN 'Avgust'
            WHEN '09' THEN 'Septembar'
            WHEN '10' THEN 'Oktobar'
            WHEN '11' THEN 'Novembar'
            WHEN '12' THEN 'Decembar'
          END as month_name,
          SUM(revenue) as total_revenue,
          SUM(kolicina) as total_quantity,
          COUNT(*) as sale_count,
          (SUM(revenue) / COUNT(DISTINCT datum_az)) as avg_daily_revenue
        FROM sales
        ${dateFilter}
        GROUP BY month, month_name
        ORDER BY month ASC
      `;

      const seasonalData = await query<SeasonalPattern>(seasonalQuery, params);

      // Calculate year-over-year growth for each month
      const monthlyGrowthQuery = `
        SELECT
          SUBSTR(datum_az, 4, 2) as month,
          SUBSTR(datum_az, 7, 4) as year,
          SUM(revenue) as revenue
        FROM sales
        ${dateFilter}
        GROUP BY month, year
        ORDER BY month, year
      `;

      const monthlyByYear = await query<any>(monthlyGrowthQuery, params);

      // Group by month and calculate growth
      const growthByMonth = new Map<string, number>();
      const monthYearMap = new Map<string, any[]>();

      monthlyByYear.forEach(row => {
        const key = row.month;
        if (!monthYearMap.has(key)) {
          monthYearMap.set(key, []);
        }
        monthYearMap.get(key)!.push(row);
      });

      monthYearMap.forEach((years, month) => {
        if (years.length >= 2) {
          years.sort((a, b) => parseInt(a.year) - parseInt(b.year));
          const recent = years[years.length - 1].revenue;
          const previous = years[years.length - 2].revenue;
          const growth = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
          growthByMonth.set(month, growth);
        }
      });

      // Add growth to seasonal data
      const enhancedSeasonalData = seasonalData.map(pattern => ({
        ...pattern,
        year_over_year_growth: growthByMonth.get(pattern.month) || 0
      }));

      return NextResponse.json({
        success: true,
        type: 'seasonal',
        data: enhancedSeasonalData,
        count: enhancedSeasonalData.length
      });
    }

    if (analysisType === 'product-seasonality') {
      // Get top products and their seasonal patterns
      const productCode = searchParams.get('productCode');

      if (!productCode) {
        return NextResponse.json(
          { success: false, error: 'productCode parameter is required for product-seasonality analysis' },
          { status: 400 }
        );
      }

      const productSeasonalQuery = `
        SELECT
          sifra_art,
          naziv_art,
          SUBSTR(datum_az, 4, 2) as month,
          CASE SUBSTR(datum_az, 4, 2)
            WHEN '01' THEN 'Januar'
            WHEN '02' THEN 'Februar'
            WHEN '03' THEN 'Mart'
            WHEN '04' THEN 'April'
            WHEN '05' THEN 'Maj'
            WHEN '06' THEN 'Juni'
            WHEN '07' THEN 'Juli'
            WHEN '08' THEN 'Avgust'
            WHEN '09' THEN 'Septembar'
            WHEN '10' THEN 'Oktobar'
            WHEN '11' THEN 'Novembar'
            WHEN '12' THEN 'Decembar'
          END as month_name,
          SUM(kolicina) as quantity,
          SUM(revenue) as revenue
        FROM sales
        ${dateFilter}
        AND sifra_art = ?
        GROUP BY sifra_art, naziv_art, month, month_name
        ORDER BY month ASC
      `;

      const monthlyData = await query<any>(
        productSeasonalQuery,
        [...params, productCode]
      );

      if (monthlyData.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No data found for this product'
        }, { status: 404 });
      }

      const totalQuantity = monthlyData.reduce((sum: number, m: any) => sum + m.quantity, 0);

      const patterns = monthlyData.map((m: any) => ({
        month: m.month_name,
        quantity: m.quantity,
        revenue: m.revenue,
        percentage_of_annual: (m.quantity / totalQuantity) * 100
      }));

      // Find peak and low months
      const sorted = [...patterns].sort((a, b) => b.quantity - a.quantity);
      const peakMonths = sorted.slice(0, 3).map(p => p.month);
      const lowMonths = sorted.slice(-3).map(p => p.month);

      const result: ProductSeasonality = {
        sifra_art: monthlyData[0].sifra_art,
        naziv_art: monthlyData[0].naziv_art,
        monthly_patterns: patterns,
        peak_months: peakMonths,
        low_months: lowMonths
      };

      return NextResponse.json({
        success: true,
        type: 'product-seasonality',
        data: result
      });
    }

    // Default: Overview
    const overviewQuery = `
      SELECT
        COUNT(DISTINCT sifra_art) as total_products,
        SUM(revenue) as total_revenue,
        SUM(kolicina) as total_quantity,
        COUNT(*) as total_transactions
      FROM sales
      ${dateFilter}
    `;

    const overview = await query<any>(overviewQuery, params);

    // Get distribution metrics
    const distributionQuery = `
      SELECT
        sifra_art,
        SUM(revenue) as revenue,
        SUM(kolicina) as quantity
      FROM sales
      ${dateFilter}
      GROUP BY sifra_art
      ORDER BY revenue DESC
    `;

    const distribution = await query<any>(distributionQuery, params);

    // Calculate 80/20 rule metrics
    const totalRevenue = distribution.reduce((sum: number, p: any) => sum + p.revenue, 0);
    let cumulativeRevenue = 0;
    let top20Count = 0;

    for (const product of distribution) {
      cumulativeRevenue += product.revenue;
      top20Count++;
      if (cumulativeRevenue >= totalRevenue * 0.8) {
        break;
      }
    }

    const top20Percentage = (top20Count / distribution.length) * 100;

    return NextResponse.json({
      success: true,
      type: 'overview',
      data: {
        ...overview[0],
        top_20_products_count: top20Count,
        top_20_percentage: top20Percentage,
        total_unique_products: distribution.length
      }
    });

  } catch (error) {
    console.error('Product analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
