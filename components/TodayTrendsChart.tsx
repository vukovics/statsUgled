'use client';

import { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface YearData {
  year: number;
  total_revenue: number;
  total_quantity: number;
  sale_count: number;
  avg_per_sale: number;
}

export default function TodayTrendsChart() {
  const [data, setData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setTodayDate(`${day}.${month}`);

        // Get data for today's date for years 2021-2024
        const years = [2021, 2022, 2023, 2024];

        const yearDataPromises = years.map(async (year) => {
          // Format date as DD.MM.YYYY to match database format
          const dateStr = `${day}.${month}.${year}`;
          const response = await fetch(`/api/sales?startDate=${dateStr}&endDate=${dateStr}&limit=10000`);
          const result = await response.json();

          let total_revenue = 0;
          let total_quantity = 0;
          let sale_count = 0;

          if (result.success && result.data.length > 0) {
            result.data.forEach((sale: any) => {
              total_revenue += sale.revenue || 0;
              total_quantity += sale.kolicina || 0;
              sale_count++;
            });
          }

          const avg_per_sale = sale_count > 0 ? total_revenue / sale_count : 0;

          return {
            year,
            total_revenue,
            total_quantity,
            sale_count,
            avg_per_sale
          };
        });

        const yearData = await Promise.all(yearDataPromises);
        setData(yearData);
      } catch (error) {
        console.error('Failed to fetch today trends:', error);
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
          Trendovi za današnji dan
        </h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.total_revenue, 0);
  const totalQuantity = data.reduce((sum, item) => sum + item.total_quantity, 0);
  const totalSales = data.reduce((sum, item) => sum + item.sale_count, 0);
  const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold mb-4 text-black dark:text-white">
        Trendovi za današnji dan ({todayDate})
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        Prihod za današnji dan (2021-2024) | Prosječan prihod: {avgRevenue.toFixed(2)} KM
      </p>

      {/* Total Summary */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 md:p-4">
          <div className="text-xs md:text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
            Ukupan prihod
          </div>
          <div className="text-lg md:text-2xl font-bold text-blue-900 dark:text-blue-100">
            {totalRevenue.toFixed(2)} KM
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 md:p-4">
          <div className="text-xs md:text-sm text-green-600 dark:text-green-400 font-medium mb-1">
            Ukupna količina
          </div>
          <div className="text-lg md:text-2xl font-bold text-green-900 dark:text-green-100">
            {totalQuantity.toFixed(2)}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 md:p-4">
          <div className="text-xs md:text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
            Broj prodaja
          </div>
          <div className="text-lg md:text-2xl font-bold text-purple-900 dark:text-purple-100">
            {totalSales.toFixed(2)}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="year"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            domain={[0, 4000]}
            ticks={[0, 1000, 2000, 3000, 4000]}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'total_revenue') return [`${value.toFixed(2)} KM`, 'Ukupan prihod'];
              if (name === 'total_quantity') return [value.toFixed(2), 'Ukupna količina'];
              if (name === 'sale_count') return [value.toFixed(2), 'Broj prodaja'];
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar
            yAxisId="left"
            dataKey="total_revenue"
            fill="#3b82f6"
            name="Ukupan prihod"
            radius={[8, 8, 0, 0]}
            label={{
              position: 'top',
              formatter: (value: any) => typeof value === 'number' ? `${value.toFixed(2)} KM` : '',
              style: { fontSize: '12px', fill: '#3b82f6', fontWeight: 'bold' }
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
