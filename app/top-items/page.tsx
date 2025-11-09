'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TopItem {
  sifra_art: string;
  naziv_art: string;
  total_quantity: number;
  total_revenue: number;
  sale_count: number;
  avg_price: number;
}

export default function TopItemsPage() {
  const [date, setDate] = useState<string>('');
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set today's date in DD.MM.YYYY format
  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    setDate(`${day}.${month}.${year}`);
  }, []);

  // Fetch data when date changes
  useEffect(() => {
    if (!date) return;

    const fetchTopItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/top-items?date=${encodeURIComponent(date)}&limit=20`);
        const result = await response.json();

        if (result.success) {
          setTopItems(result.data);
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopItems();
  }, [date]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Convert from YYYY-MM-DD (input format) to DD.MM.YYYY (database format)
    const [year, month, day] = inputValue.split('-');
    setDate(`${day}.${month}.${year}`);
  };

  // Convert date from DD.MM.YYYY to YYYY-MM-DD for input value
  const getInputDate = () => {
    if (!date) return '';
    const [day, month, year] = date.split('.');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <main className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white">
            Najprodavaniji artikli
          </h1>
          <div className="flex gap-3">
            <Link
              href="/product-analytics"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Analitika proizvoda
            </Link>
            <Link
              href="/sales-trends"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Trendovi prodaje
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

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="date" className="text-lg font-medium text-black dark:text-white">
            Odaberite datum:
          </label>
          <input
            type="date"
            id="date"
            value={getInputDate()}
            onChange={handleDateChange}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            ({date})
          </span>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Učitavanje...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {!loading && !error && topItems.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              Nije pronađena prodaja za {date}
            </p>
          </div>
        )}

        {!loading && !error && topItems.length > 0 && (
          <>
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Rang</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Šifra artikla</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Naziv artikla</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Ukupna količina</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Ukupan prihod</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Broj prodaja</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Prosječna cijena</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {topItems.map((item, index) => (
                      <tr
                        key={item.sifra_art}
                        className={`hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                          index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {index === 0 && '🏆 '}#{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                          {item.sifra_art}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                          {item.naziv_art}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.total_quantity.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600 dark:text-green-400">
                          {item.total_revenue.toFixed(2)} KM
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                          {item.sale_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                          {item.avg_price.toFixed(2)} KM
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
                Pregled za {date}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">Ukupno artikala</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {topItems.length}
                  </p>
                </div>
                <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">Ukupno prodato</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {topItems.reduce((sum, item) => sum + item.total_quantity, 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">Ukupan prihod</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {topItems.reduce((sum, item) => sum + item.total_revenue, 0).toFixed(2)} KM
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
