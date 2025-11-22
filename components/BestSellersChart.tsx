'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProductPerformance {
  sifra_art: string;
  naziv_art: string;
  total_quantity: number;
  total_revenue: number;
  sale_count: number;
  avg_price: number;
}

export default function BestSellersChart() {
  const [data, setData] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue'>('quantity');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/product-analytics?type=best-sellers&limit=40&sortBy=${sortBy}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch best sellers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortBy]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-black dark:text-white">
          Najprodavaniji
        </h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  // Prepare data for chart - shorten product names for display
  const chartData = data.map(item => ({
    ...item,
    displayName: item.naziv_art.length > 20
      ? item.naziv_art.substring(0, 20) + '...'
      : item.naziv_art
  }));

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-black dark:text-white">
          Najprodavaniji
        </h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'quantity' | 'revenue')}
          className="px-3 py-1 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="quantity">Po količini</option>
          <option value="revenue">Po prihodu</option>
        </select>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        Top 40 artikala po {sortBy === 'quantity' ? 'količini' : 'prihodu'} od 2021 do 2024 godine
      </p>
      <div className="overflow-y-auto max-h-[600px]">
        <ResponsiveContainer width="100%" height={1600}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            type="number"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <YAxis
            dataKey="displayName"
            type="category"
            stroke="#9ca3af"
            width={150}
            style={{ fontSize: '10px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'Količina') {
                return [`${value.toFixed(2)}`, name];
              }
              if (name === 'Prihod') {
                return [`${value.toFixed(2)} KM`, name];
              }
              return [value, name];
            }}
            labelFormatter={(label) => {
              const item = data.find(d => d.naziv_art.startsWith(label.replace('...', '')));
              return item?.naziv_art || label;
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar
            dataKey={sortBy === 'quantity' ? 'total_quantity' : 'total_revenue'}
            fill="#10b981"
            name={sortBy === 'quantity' ? 'Količina' : 'Prihod'}
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
