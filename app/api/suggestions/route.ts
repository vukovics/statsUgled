import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface Suggestion {
  sifra_art: string;
  naziv_art: string;
  avg_daily_quantity: number;
  total_historical_quantity: number;
  suggested_order_quantity: number;
  safety_stock: number;
  final_order_quantity: number;
  years_analyzed: number;
  historical_revenue: number;
  avg_price: number;
  confidence: 'high' | 'medium' | 'low';
  abc_category: 'A' | 'B' | 'C';
  trend_percentage: number;
  trend_direction: 'growing' | 'stable' | 'declining';
  weekend_factor: number;
  yearly_breakdown: {
    year: string;
    quantity: number;
    revenue: number;
    weight: number;
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

interface DayOfWeekSale {
  sifra_art: string;
  day_of_week: number;
  total_quantity: number;
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

// Calculate year weights - more recent years get higher weight
function getYearWeight(year: number, currentYear: number): number {
  const yearsAgo = currentYear - year;
  // Weights: 1 year ago = 50%, 2 years = 30%, 3 years = 15%, 4+ years = 5%
  const weights: { [key: number]: number } = {
    1: 0.50,
    2: 0.30,
    3: 0.15,
    4: 0.05
  };
  return weights[yearsAgo] || 0.05;
}

// Calculate trend percentage based on year-over-year changes
function calculateTrend(yearlyData: Map<string, { quantity: number; revenue: number }>): { percentage: number; direction: 'growing' | 'stable' | 'declining' } {
  const years = Array.from(yearlyData.keys()).map(Number).sort((a, b) => a - b);

  if (years.length < 2) {
    return { percentage: 0, direction: 'stable' };
  }

  // Calculate average year-over-year growth
  let totalGrowth = 0;
  let growthCount = 0;

  for (let i = 1; i < years.length; i++) {
    const prevYear = yearlyData.get(String(years[i - 1]));
    const currYear = yearlyData.get(String(years[i]));

    if (prevYear && currYear && prevYear.quantity > 0) {
      const growth = ((currYear.quantity - prevYear.quantity) / prevYear.quantity) * 100;
      totalGrowth += growth;
      growthCount++;
    }
  }

  const avgGrowth = growthCount > 0 ? totalGrowth / growthCount : 0;

  let direction: 'growing' | 'stable' | 'declining';
  if (avgGrowth > 5) {
    direction = 'growing';
  } else if (avgGrowth < -5) {
    direction = 'declining';
  } else {
    direction = 'stable';
  }

  return { percentage: avgGrowth, direction };
}

// Calculate standard deviation for safety stock
function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

  return Math.sqrt(avgSquaredDiff);
}

// Count weekend days in a date range
function countWeekendDays(startDate: Date, days: number): { weekendDays: number; weekDays: number } {
  let weekendDays = 0;
  let weekDays = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    } else {
      weekDays++;
    }
  }

  return { weekendDays, weekDays };
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

    const currentYear = startDate.getFullYear();

    // Count weekend vs weekday distribution in target period
    const { weekendDays, weekDays } = countWeekendDays(startDate, days);

    // Get historical date ranges for the same period in previous years
    const historicalRanges = getHistoricalDateRanges(startDate, days, yearsBack);

    // Query historical data for each year
    const historicalData: Map<string, HistoricalSale[]> = new Map();

    for (const [startStr, endStr, year] of historicalRanges) {
      const yearData = await query<HistoricalSale>(
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

    // Get day-of-week patterns for products (last 2 years)
    const dayOfWeekData = await query<DayOfWeekSale>(
      `SELECT
        sifra_art,
        CAST(strftime('%w', SUBSTR(datum, 7, 4) || '-' || SUBSTR(datum, 4, 2) || '-' || SUBSTR(datum, 1, 2)) AS INTEGER) as day_of_week,
        SUM(kolicina) as total_quantity
      FROM sales
      WHERE SUBSTR(datum, 7, 4) >= '2023'
      GROUP BY sifra_art, day_of_week`
    );

    // Build weekend factor map per product
    const weekendFactorMap: Map<string, number> = new Map();
    const productDayData: Map<string, { weekend: number; weekday: number }> = new Map();

    for (const row of dayOfWeekData) {
      if (!productDayData.has(row.sifra_art)) {
        productDayData.set(row.sifra_art, { weekend: 0, weekday: 0 });
      }
      const data = productDayData.get(row.sifra_art)!;

      if (row.day_of_week === 0 || row.day_of_week === 6) {
        data.weekend += row.total_quantity;
      } else {
        data.weekday += row.total_quantity;
      }
    }

    for (const [sifra, data] of productDayData.entries()) {
      // Calculate average per day type
      const avgWeekend = data.weekend / 2; // 2 weekend days
      const avgWeekday = data.weekday / 5; // 5 weekdays

      // Weekend factor: how much more/less sells on weekend vs weekday
      if (avgWeekday > 0) {
        weekendFactorMap.set(sifra, avgWeekend / avgWeekday);
      } else {
        weekendFactorMap.set(sifra, 1);
      }
    }

    // Aggregate data across all years with weights
    const productMap: Map<string, {
      sifra_art: string;
      naziv_art: string;
      weighted_quantity: number;
      total_quantity: number;
      total_revenue: number;
      total_weight: number;
      years_found: number;
      prices: number[];
      quantities: number[];
      yearly_data: Map<string, { quantity: number; revenue: number; weight: number }>;
    }> = new Map();

    for (const [year, yearData] of historicalData.entries()) {
      const yearNum = parseInt(year);
      const weight = getYearWeight(yearNum, currentYear);

      for (const item of yearData) {
        const key = item.sifra_art;

        if (!productMap.has(key)) {
          productMap.set(key, {
            sifra_art: item.sifra_art,
            naziv_art: item.naziv_art,
            weighted_quantity: 0,
            total_quantity: 0,
            total_revenue: 0,
            total_weight: 0,
            years_found: 0,
            prices: [],
            quantities: [],
            yearly_data: new Map()
          });
        }

        const product = productMap.get(key)!;
        product.weighted_quantity += item.total_quantity * weight;
        product.total_quantity += item.total_quantity;
        product.total_revenue += item.total_revenue;
        product.total_weight += weight;
        product.years_found += 1;
        product.prices.push(item.avg_price);
        product.quantities.push(item.total_quantity);
        product.yearly_data.set(year, {
          quantity: item.total_quantity,
          revenue: item.total_revenue,
          weight: weight
        });
      }
    }

    // Calculate total revenue for ABC classification
    const totalRevenueAll = Array.from(productMap.values())
      .reduce((sum, p) => sum + p.total_revenue, 0);

    // Sort products by revenue for ABC classification
    const productsByRevenue = Array.from(productMap.entries())
      .sort((a, b) => b[1].total_revenue - a[1].total_revenue);

    // Assign ABC categories
    let cumulativeRevenue = 0;
    const abcCategories: Map<string, 'A' | 'B' | 'C'> = new Map();

    for (const [key, product] of productsByRevenue) {
      cumulativeRevenue += product.total_revenue;
      const revenuePercentage = (cumulativeRevenue / totalRevenueAll) * 100;

      if (revenuePercentage <= 80) {
        abcCategories.set(key, 'A');
      } else if (revenuePercentage <= 95) {
        abcCategories.set(key, 'B');
      } else {
        abcCategories.set(key, 'C');
      }
    }

    // Calculate suggestions with all improvements
    const suggestions: Suggestion[] = [];

    for (const [key, product] of productMap.entries()) {
      // 1. Weighted average daily quantity
      const weightedAvgDailyQuantity = product.weighted_quantity / (days * product.total_weight);

      // 2. Calculate trend
      const trend = calculateTrend(product.yearly_data);

      // Apply trend adjustment (cap at +/- 30%)
      const trendMultiplier = 1 + Math.max(-0.30, Math.min(0.30, trend.percentage / 100));

      // 3. Calculate safety stock based on standard deviation
      const stdDev = calculateStdDev(product.quantities);
      const avgQuantity = product.total_quantity / product.years_found;
      const coefficientOfVariation = avgQuantity > 0 ? stdDev / avgQuantity : 0;

      // Safety stock: higher for more variable products
      // A items: 1.0 std dev, B items: 1.5 std dev, C items: 2.0 std dev
      const abcCategory = abcCategories.get(key) || 'C';
      const safetyMultiplier = abcCategory === 'A' ? 1.0 : abcCategory === 'B' ? 1.5 : 2.0;
      const safetyStock = Math.ceil(coefficientOfVariation * weightedAvgDailyQuantity * days * safetyMultiplier);

      // 4. Weekend factor adjustment
      const weekendFactor = weekendFactorMap.get(key) || 1;
      const normalDailyQuantity = weightedAvgDailyQuantity;

      // Adjust for actual weekend/weekday distribution in target period
      // If weekendFactor > 1, product sells more on weekends
      const adjustedQuantity = normalDailyQuantity * (
        (weekDays / days) + (weekendDays / days) * weekendFactor
      );

      // Base order quantity with trend
      const baseOrderQuantity = Math.ceil(adjustedQuantity * days * trendMultiplier);

      // Final order = base + safety stock
      const finalOrderQuantity = baseOrderQuantity + safetyStock;

      const avgPrice = product.prices.reduce((sum, p) => sum + p, 0) / product.prices.length;

      // Determine confidence
      let confidence: 'high' | 'medium' | 'low';
      if (product.years_found >= 3) {
        confidence = 'high';
      } else if (product.years_found >= 2) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      // Convert yearly data to array
      const yearly_breakdown = Array.from(product.yearly_data.entries()).map(([year, data]) => ({
        year,
        quantity: data.quantity,
        revenue: data.revenue,
        weight: data.weight
      })).sort((a, b) => parseInt(b.year) - parseInt(a.year));

      suggestions.push({
        sifra_art: product.sifra_art,
        naziv_art: product.naziv_art,
        avg_daily_quantity: weightedAvgDailyQuantity,
        total_historical_quantity: product.total_quantity,
        suggested_order_quantity: baseOrderQuantity,
        safety_stock: safetyStock,
        final_order_quantity: finalOrderQuantity,
        years_analyzed: product.years_found,
        historical_revenue: product.total_revenue,
        avg_price: avgPrice,
        confidence: confidence,
        abc_category: abcCategory,
        trend_percentage: trend.percentage,
        trend_direction: trend.direction,
        weekend_factor: weekendFactor,
        yearly_breakdown: yearly_breakdown
      });
    }

    // Sort by final order quantity (highest first)
    suggestions.sort((a, b) => b.final_order_quantity - a.final_order_quantity);

    return NextResponse.json({
      success: true,
      data: suggestions,
      count: suggestions.length,
      analysis: {
        prediction_start_date: formatDate(startDate),
        prediction_end_date: formatDate(endDate),
        days_predicted: days,
        weekend_days: weekendDays,
        week_days: weekDays,
        years_analyzed: yearsBack,
        years_with_data: historicalData.size,
        historical_periods: historicalRanges.map(([start, end, year]) => ({
          year: year,
          start_date: start,
          end_date: end,
          has_data: historicalData.has(year),
          weight: getYearWeight(parseInt(year), currentYear)
        })),
        abc_summary: {
          a_count: suggestions.filter(s => s.abc_category === 'A').length,
          b_count: suggestions.filter(s => s.abc_category === 'B').length,
          c_count: suggestions.filter(s => s.abc_category === 'C').length
        }
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
