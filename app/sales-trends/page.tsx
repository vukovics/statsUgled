'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TrendData {
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

interface ApiResponse {
  success: boolean;
  period: string;
  data: TrendData[];
  yoyComparison: YearOverYearData[];
  movingAverages: MovingAverageData[];
  summary: {
    total_revenue: number;
    total_quantity: number;
    avg_revenue_per_period: number;
    periods_count: number;
  };
  error?: string;
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function SalesTrendsPage() {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [startDate, setStartDate] = useState<string>('2021-02-01');
  const [endDate, setEndDate] = useState<string>('2024-10-31');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'trends' | 'yoy' | 'moving'>('trends');

  useEffect(() => {
    fetchTrends();
  }, [period, startDate, endDate]);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        period,
        startDate,
        endDate
      });

      const response = await fetch(`/api/sales-trends?${params}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch sales trends');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} KM`;
  };

  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600 dark:text-green-400';
    if (growth < 0) return 'text-red-600 dark:text-red-400';
    return 'text-zinc-600 dark:text-zinc-400';
  };

  const getGrowthBgColor = (growth: number) => {
    if (growth > 10) return 'bg-green-100 dark:bg-green-900/30';
    if (growth > 0) return 'bg-green-50 dark:bg-green-900/20';
    if (growth < -10) return 'bg-red-100 dark:bg-red-900/30';
    if (growth < 0) return 'bg-red-50 dark:bg-red-900/20';
    return 'bg-zinc-50 dark:bg-zinc-800';
  };

  const getPeriodLabel = (period: PeriodType) => {
    const labels = {
      daily: 'Dnevni',
      weekly: 'Sedmični',
      monthly: 'Mjesečni',
      yearly: 'Godišnji'
    };
    return labels[period];
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <main className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white">
            Trendovi prodaje
          </h1>
          <div className="flex gap-3">
            <Link
              href="/product-analytics"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Analitika proizvoda
            </Link>
            <Link
              href="/top-items"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Najprodavaniji artikli
            </Link>
            <Link
              href="/suggestions"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Preporuke za narudžbu
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
            >
              Kontrolna tabla
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-6 mb-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
            📈 Analiza trendova prodaje
          </h2>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>Dnevni trendovi:</strong> Detaljni pregled prodaje po danima sa pomičnim prosjekom (7 i 30 dana) za uočavanje kratkoročnih trendova.
            </p>
            <p>
              <strong>Sedmični/Mjesečni/Godišnji trendovi:</strong> Agregirani pregled za uočavanje sezonalnosti i dugoročnih obrazaca.
            </p>
            <p>
              <strong>Poređenje godina:</strong> Analizirajte rast ili pad prodaje u odnosu na prethodnu godinu za isti period.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
            Postavke analize
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="period" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Period agregacije
              </label>
              <select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Dnevni</option>
                <option value="weekly">Sedmični</option>
                <option value="monthly">Mjesečni</option>
                <option value="yearly">Godišnji</option>
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Početni datum
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Krajnji datum
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('trends')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'trends'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              {getPeriodLabel(period)} trendovi
            </button>
            {(period === 'monthly' || period === 'yearly') && (
              <button
                onClick={() => setViewMode('yoy')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'yoy'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                }`}
              >
                Poređenje godina
              </button>
            )}
            {period === 'daily' && (
              <button
                onClick={() => setViewMode('moving')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'moving'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                }`}
              >
                Pomični prosjek
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Učitavanje podataka...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Ukupan prihod</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(data.summary.total_revenue)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">Ukupna količina</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatNumber(data.summary.total_quantity)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Prosjek po periodu</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(data.summary.avg_revenue_per_period)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Broj perioda</p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {data.summary.periods_count}
              </p>
            </div>
          </div>
        )}

        {/* Trends Table */}
        {!loading && !error && data && viewMode === 'trends' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-semibold text-black dark:text-white">
                {getPeriodLabel(period)} pregled prodaje
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Ukupan prihod
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Ukupna količina
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Broj transakcija
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Prosječna cijena
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {data.data.map((row, index) => (
                    <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {row.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(row.total_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                        {formatNumber(row.total_quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                        {row.sale_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(row.avg_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Year-over-Year Comparison */}
        {!loading && !error && data && viewMode === 'yoy' && data.yoyComparison.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-semibold text-black dark:text-white">
                Poređenje godina - Rast/Pad prodaje
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Analiza promjene prihoda u odnosu na prethodnu godinu za isti period
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Tekuća godina
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Prethodna godina
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Promjena
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Rast %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {data.yoyComparison.map((row, index) => {
                    const change = row.current_revenue - row.previous_revenue;
                    return (
                      <tr key={index} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800 ${getGrowthBgColor(row.growth_percent)}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {row.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                          <div className="font-semibold">{formatCurrency(row.current_revenue)}</div>
                          <div className="text-xs text-zinc-500">({row.current_year})</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-600 dark:text-zinc-400">
                          <div>{formatCurrency(row.previous_revenue)}</div>
                          <div className="text-xs text-zinc-500">({row.previous_year})</div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${getGrowthColor(change)}`}>
                          {change >= 0 ? '+' : ''}{formatCurrency(change)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getGrowthColor(row.growth_percent)}`}>
                          <span className="flex items-center justify-end gap-1">
                            {row.growth_percent >= 0 ? '↑' : '↓'}
                            {Math.abs(row.growth_percent).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Moving Averages */}
        {!loading && !error && data && viewMode === 'moving' && data.movingAverages.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-semibold text-black dark:text-white">
                Pomični prosjek prihoda
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                7-dnevni i 30-dnevni pomični prosjek pomaže uočiti trendove bez dnevnih fluktuacija
              </p>
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Dnevni prihod
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      MA 7 dana
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      MA 30 dana
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {data.movingAverages.slice(-60).map((row, index) => (
                    <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {row.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(row.daily_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(row.ma_7day)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-600 dark:text-purple-400">
                        {formatCurrency(row.ma_30day)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.movingAverages.length > 60 && (
              <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-200 text-center">
                Prikazanih posljednjih 60 dana od ukupno {data.movingAverages.length} dana
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data && data.data.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
              Nema podataka za odabrani period
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Pokušajte odabrati drugi vremenski raspon ili period agregacije.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
