'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
  period: string;
  total_revenue: number;
  total_quantity: number;
  sale_count: number;
  avg_price: number;
}

interface YearData {
  year: number;
  data: TrendData[];
  avgRevenue: number;
}

export default function SalesTrendsChart() {
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const years = [2025, 2024, 2023];
        const results: YearData[] = [];

        for (const year of years) {
          const startDate = `${year}-01-01`;
          const endDate = year === 2025 ? `${year}-10-31` : `${year}-12-31`;

          const params = new URLSearchParams({
            period: 'monthly',
            startDate: startDate,
            endDate: endDate
          });

          const response = await fetch(`/api/sales-trends?${params}`);
          const result = await response.json();

          if (result.success && result.data.length > 0) {
            const totalRevenue = result.data.reduce((sum: number, item: TrendData) => sum + item.total_revenue, 0);
            results.push({
              year,
              data: result.data,
              avgRevenue: totalRevenue / result.data.length
            });
          }
        }

        setYearData(results);
      } catch (error) {
        console.error('Failed to fetch sales trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-black dark:text-white">
          Trendovi prodaje
        </h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  const colors = ['#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {yearData.map((yd, index) => (
        <div key={yd.year} className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-black dark:text-white">
            Trendovi prodaje {yd.year}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Mjesečni prihod ({yd.year}) | Prosječan prihod: {yd.avgRevenue.toFixed(2)} KM
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yd.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="period"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number) => [`${value.toFixed(2)} KM`, 'Prihod']}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line
                type="monotone"
                dataKey="total_revenue"
                stroke={colors[index]}
                strokeWidth={3}
                name="Ukupan prihod"
                dot={{ fill: colors[index], r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
