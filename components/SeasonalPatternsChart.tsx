'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SeasonalPattern {
  month: string;
  month_name: string;
  total_revenue: number;
  total_quantity: number;
  sale_count: number;
  avg_daily_revenue: number;
  year_over_year_growth: number;
}

interface YearData {
  year: number;
  data: SeasonalPattern[];
}

export default function SeasonalPatternsChart() {
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const years = [2025, 2024];
        const results: YearData[] = [];

        for (const year of years) {
          const startDate = `${year}-01-01`;
          const endDate = year === 2025 ? `${year}-10-31` : `${year}-12-31`;

          const params = new URLSearchParams({
            type: 'seasonal',
            startDate: startDate,
            endDate: endDate
          });

          const response = await fetch(`/api/product-analytics?${params}`);
          const result = await response.json();

          if (result.success && result.data.length > 0) {
            results.push({
              year,
              data: result.data
            });
          }
        }

        setYearData(results);
      } catch (error) {
        console.error('Failed to fetch seasonal data:', error);
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
          Sezonski obrasci
        </h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const colors = ['#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      {yearData.map((yd, index) => (
        <div key={yd.year} className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-black dark:text-white">
            Sezonski obrasci {yd.year}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Prihod po mjesecima ({yd.year})
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yd.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month_name"
                stroke="#9ca3af"
                angle={-45}
                textAnchor="end"
                height={80}
                style={{ fontSize: '12px' }}
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
              <Bar
                dataKey="total_revenue"
                fill={colors[index]}
                name="Ukupan prihod"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
