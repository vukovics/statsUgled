'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProductPerformance {
  sifra_art: string;
  naziv_art: string;
  total_quantity: number;
  total_revenue: number;
  sale_count: number;
  avg_price: number;
  first_sale_date: string;
  last_sale_date: string;
  days_on_market: number | null;
  avg_monthly_quantity: number | null;
  velocity_score: number;
}

interface SlowMovingProduct {
  sifra_art: string;
  naziv_art: string;
  total_quantity: number;
  total_revenue: number;
  last_sale_date: string;
  days_since_last_sale: number;
  avg_monthly_quantity: number | null;
  recommendation: 'discontinue' | 'discount' | 'monitor';
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

interface OverviewData {
  total_products: number;
  total_revenue: number;
  total_quantity: number;
  total_transactions: number;
  top_20_products_count: number;
  top_20_percentage: number;
  total_unique_products: number;
}

type ViewMode = 'overview' | 'best-sellers' | 'slow-movers' | 'seasonal';

export default function ProductAnalyticsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [startDate, setStartDate] = useState<string>('2021-02-01');
  const [endDate, setEndDate] = useState<string>('2024-10-31');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [bestSellers, setBestSellers] = useState<ProductPerformance[]>([]);
  const [slowMovers, setSlowMovers] = useState<SlowMovingProduct[]>([]);
  const [seasonalData, setSeasonalData] = useState<SeasonalPattern[]>([]);

  useEffect(() => {
    fetchData();
  }, [viewMode, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: viewMode,
        startDate,
        endDate,
        limit: '50',
        minSales: '10'
      });

      const response = await fetch(`/api/product-analytics?${params}`);
      const result = await response.json();

      if (result.success) {
        if (viewMode === 'overview') {
          setOverviewData(result.data);
        } else if (viewMode === 'best-sellers') {
          setBestSellers(result.data);
        } else if (viewMode === 'slow-movers') {
          setSlowMovers(result.data);
        } else if (viewMode === 'seasonal') {
          setSeasonalData(result.data);
        }
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return `${value.toFixed(2)} KM`;
  };
  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return value.toFixed(2);
  };

  const getRecommendationBadge = (recommendation: string) => {
    const colors = {
      discontinue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      discount: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      monitor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
    const labels = {
      discontinue: 'Ukinuti',
      discount: 'Sniziti',
      monitor: 'Pratiti'
    };
    return { color: colors[recommendation as keyof typeof colors], label: labels[recommendation as keyof typeof labels] };
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 5) return 'text-green-600 dark:text-green-400';
    if (growth > 0) return 'text-green-500 dark:text-green-500';
    if (growth < -5) return 'text-red-600 dark:text-red-400';
    if (growth < 0) return 'text-red-500 dark:text-red-500';
    return 'text-zinc-600 dark:text-zinc-400';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <main className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-black dark:text-white mb-4">
            Analitika proizvoda
          </h1>
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
            <Link
              href="/sales-trends"
              className="px-3 py-2 md:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm md:text-base text-center"
            >
              Trendovi
            </Link>
            <Link
              href="/top-items"
              className="px-3 py-2 md:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm md:text-base text-center"
            >
              Top artikli
            </Link>
            <Link
              href="/suggestions"
              className="px-3 py-2 md:px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm md:text-base text-center"
            >
              Preporuke
            </Link>
            <Link
              href="/"
              className="px-3 py-2 md:px-4 bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors text-sm md:text-base text-center"
            >
              Početna
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 md:p-6 mb-4 md:mb-6 border border-indigo-200 dark:border-indigo-800">
          <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-indigo-900 dark:text-indigo-100">
            📊 Analitika proizvoda i planiranje kampanja
          </h2>
          <div className="text-xs md:text-sm text-indigo-800 dark:text-indigo-200 space-y-1 md:space-y-2">
            <p>
              <strong>Najprodavaniji:</strong> Identifikujte top proizvode kroz vrijeme i planirajte buduće zalihe.
            </p>
            <p>
              <strong>Sezonski obrasci:</strong> Otkrijte kada su prodaje najveće za planiranje promocija i marketing kampanja.
            </p>
            <p>
              <strong>Sporoprometni artikli:</strong> Pronađite proizvode koji se sporije kreću i odlučite o sniženjima ili ukidanju.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-black dark:text-white">
            Postavke analize
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
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
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
                viewMode === 'overview'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              Pregled
            </button>
            <button
              onClick={() => setViewMode('best-sellers')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
                viewMode === 'best-sellers'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              Najprodavaniji
            </button>
            <button
              onClick={() => setViewMode('slow-movers')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
                viewMode === 'slow-movers'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              Sporoprometni
            </button>
            <button
              onClick={() => setViewMode('seasonal')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
                viewMode === 'seasonal'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              Sezonski obrasci
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Učitavanje podataka...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Overview View */}
        {!loading && !error && viewMode === 'overview' && overviewData && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-lg p-3 md:p-6 border border-blue-200 dark:border-blue-800">
                <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300 mb-1">Ukupan prihod</p>
                <p className="text-lg md:text-3xl font-bold text-blue-900 dark:text-blue-100 break-words">
                  {formatCurrency(overviewData.total_revenue)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 rounded-lg p-3 md:p-6 border border-green-200 dark:border-green-800">
                <p className="text-xs md:text-sm text-green-700 dark:text-green-300 mb-1">Jedinstvenih proizvoda</p>
                <p className="text-lg md:text-3xl font-bold text-green-900 dark:text-green-100">
                  {overviewData.total_unique_products}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/20 rounded-lg p-3 md:p-6 border border-purple-200 dark:border-purple-800">
                <p className="text-xs md:text-sm text-purple-700 dark:text-purple-300 mb-1">Ukupne transakcije</p>
                <p className="text-lg md:text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {overviewData.total_transactions.toLocaleString()}
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/20 rounded-lg p-3 md:p-6 border border-amber-200 dark:border-amber-800">
                <p className="text-xs md:text-sm text-amber-700 dark:text-amber-300 mb-1">Top 20% proizvoda</p>
                <p className="text-lg md:text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {overviewData.top_20_products_count}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Generišu 80% prihoda
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4 md:p-6 border border-indigo-200 dark:border-indigo-800">
              <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-indigo-900 dark:text-indigo-100">
                📈 Pareto princip (80/20 pravilo)
              </h3>
              <p className="text-xs md:text-sm text-indigo-800 dark:text-indigo-200 mb-2">
                {overviewData.top_20_percentage.toFixed(1)}% proizvoda generiše 80% ukupnog prihoda
              </p>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${overviewData.top_20_percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                Fokusirajte se na ovih {overviewData.top_20_products_count} proizvoda za maksimalan rezultat
              </p>
            </div>
          </div>
        )}

        {/* Best Sellers View */}
        {!loading && !error && viewMode === 'best-sellers' && bestSellers.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-lg md:text-xl font-semibold text-black dark:text-white">
                Najprodavaniji proizvodi
              </h2>
              <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Sortirano po ukupnom prihodu
              </p>
            </div>
            <div className="overflow-x-auto touch-pan-x">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Rang</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Šifra</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Naziv</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Ukupan prihod</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Količina</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Prodaja</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Prosjek/Mjesec</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Prosj. cijena</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {bestSellers.map((product, index) => (
                    <tr
                      key={product.sifra_art}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                        index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                      }`}
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {index === 0 && '🥇 '}
                        {index === 1 && '🥈 '}
                        {index === 2 && '🥉 '}
                        #{index + 1}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                        {product.sifra_art}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                        {product.naziv_art || '-'}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(product.total_revenue)}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                        {formatNumber(product.total_quantity)}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                        {product.sale_count}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600 dark:text-blue-400">
                        {formatNumber(product.avg_monthly_quantity)}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(product.avg_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Slow Movers View */}
        {!loading && !error && viewMode === 'slow-movers' && slowMovers.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-lg md:text-xl font-semibold text-black dark:text-white">
                Sporoprometni proizvodi
              </h2>
              <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Proizvodi koji se sporije kreću
              </p>
            </div>
            <div className="overflow-x-auto touch-pan-x">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Šifra</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Naziv</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Zadnja prodaja</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Dani od zadnje</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Prosjek/Mjesec</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Ukupan prihod</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Preporuka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {slowMovers.map((product) => {
                    const badge = getRecommendationBadge(product.recommendation);
                    return (
                      <tr key={product.sifra_art} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                          {product.sifra_art}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                          {product.naziv_art || '-'}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                          {product.last_sale_date}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600 dark:text-red-400">
                          {Math.floor(product.days_since_last_sale)} dana
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                          {formatNumber(product.avg_monthly_quantity)}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(product.total_revenue)}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 md:px-6 py-3 md:py-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
              <div className="flex flex-col md:flex-row gap-3 md:gap-6 text-xs md:text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    Ukinuti
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">&gt; 180 dana bez prodaje</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Sniziti
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">90-180 dana bez prodaje</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    Pratiti
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">&lt; 90 dana bez prodaje</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seasonal Patterns View */}
        {!loading && !error && viewMode === 'seasonal' && seasonalData.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-lg md:text-xl font-semibold text-black dark:text-white">
                Sezonski obrasci prodaje
              </h2>
              <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Planiranje kampanja kroz godinu
              </p>
            </div>
            <div className="overflow-x-auto touch-pan-x">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Mjesec</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Ukupan prihod</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Količina</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Broj transakcija</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Prosjek dnevno</th>
                    <th className="px-4 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Rast God/God</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {seasonalData.map((pattern) => {
                    const maxRevenue = Math.max(...seasonalData.map(p => p.total_revenue));
                    const revenuePercent = (pattern.total_revenue / maxRevenue) * 100;
                    const isPeak = revenuePercent > 85;
                    const isLow = revenuePercent < 50;

                    return (
                      <tr
                        key={pattern.month}
                        className={`hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                          isPeak ? 'bg-green-50 dark:bg-green-900/10' :
                          isLow ? 'bg-red-50 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {isPeak && '🔥 '}
                          {isLow && '❄️ '}
                          {pattern.month_name}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(pattern.total_revenue)}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                          {formatNumber(pattern.total_quantity)}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                          {pattern.sale_count}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(pattern.avg_daily_revenue)}
                        </td>
                        <td className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-right font-semibold ${getGrowthColor(pattern.year_over_year_growth)}`}>
                          {pattern.year_over_year_growth >= 0 ? '↑' : '↓'}
                          {Math.abs(pattern.year_over_year_growth).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 md:px-6 py-3 md:py-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
              <h3 className="text-xs md:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Preporuke za planiranje kampanja:
              </h3>
              <ul className="text-xs md:text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>🔥 Vrhunci: Planirajte dodatne zalihe i marketing tokom najboljih mjeseci</li>
                <li>❄️ Nizovi: Organizujte promocije i akcije tokom slabijih mjeseci</li>
                <li>↑ Pozitivan rast: Investirajte više u mjesece sa rastućim trendom</li>
                <li>↓ Negativan rast: Analizirajte razloge pada i prilagodite strategiju</li>
              </ul>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && (
          (viewMode === 'best-sellers' && bestSellers.length === 0) ||
          (viewMode === 'slow-movers' && slowMovers.length === 0) ||
          (viewMode === 'seasonal' && seasonalData.length === 0)
        ) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2 md:mb-3">
              Nema podataka za odabrani period
            </h3>
            <p className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
              Pokušajte odabrati drugi vremenski raspon.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
