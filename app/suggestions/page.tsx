'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Suggestion {
  sifra_art: string;
  naziv_art: string;
  avg_daily_quantity: number;
  total_historical_quantity: number;
  suggested_order_quantity: number;
  years_analyzed: number;
  historical_revenue: number;
  avg_price: number;
  confidence: 'high' | 'medium' | 'low';
  yearly_breakdown: {
    year: string;
    quantity: number;
    revenue: number;
  }[];
}

interface HistoricalPeriod {
  year: string;
  start_date: string;
  end_date: string;
  has_data: boolean;
}

interface Analysis {
  prediction_start_date: string;
  prediction_end_date: string;
  days_predicted: number;
  years_analyzed: number;
  years_with_data: number;
  historical_periods: HistoricalPeriod[];
}

interface ApiResponse {
  success: boolean;
  data: Suggestion[];
  count: number;
  analysis: Analysis;
  error?: string;
}

export default function SuggestionsPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [days, setDays] = useState<number>(10);
  const [yearsBack, setYearsBack] = useState<number>(4);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minConfidence, setMinConfidence] = useState<'all' | 'high' | 'medium'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Set today's date
  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    setStartDate(`${day}.${month}.${year}`);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (!startDate) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/suggestions?date=${encodeURIComponent(startDate)}&days=${days}&years=${yearsBack}`
        );
        const result: ApiResponse = await response.json();

        if (result.success) {
          setSuggestions(result.data);
          setAnalysis(result.analysis);
        } else {
          setError(result.error || 'Failed to fetch suggestions');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [startDate, days, yearsBack]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const [year, month, day] = inputValue.split('-');
    setStartDate(`${day}.${month}.${year}`);
  };

  const getInputDate = () => {
    if (!startDate) return '';
    const [day, month, year] = startDate.split('.');
    return `${year}-${month}-${day}`;
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[confidence as keyof typeof colors] || colors.low;
  };

  const filteredSuggestions = suggestions.filter(item => {
    if (minConfidence === 'all') return true;
    if (minConfidence === 'high') return item.confidence === 'high';
    if (minConfidence === 'medium') return item.confidence === 'high' || item.confidence === 'medium';
    return true;
  });

  const totalSuggestedQuantity = filteredSuggestions.reduce(
    (sum, item) => sum + item.suggested_order_quantity,
    0
  );

  const totalEstimatedCost = filteredSuggestions.reduce(
    (sum, item) => sum + (item.suggested_order_quantity * item.avg_price),
    0
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <main className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white">
            Preporuke za narudžbu
          </h1>
          <div className="flex gap-3">
            <Link
              href="/top-items"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Najprodavaniji artikli
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
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-800">
          <h2 className="text-lg font-semibold mb-3 text-purple-900 dark:text-purple-100">
            📊 Kako ovo funkcioniše - Predviđanje budućih narudžbi
          </h2>
          <div className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
            <p>
              <strong>Korak 1:</strong> Odaberite DANAŠNJI DATUM (ili bilo koji budući datum) i broj dana za predviđanje (npr. danas + narednih 10 dana).
            </p>
            <p>
              <strong>Korak 2:</strong> Sistem traži ISTI kalendarski period u PRETHODNIM godinama. Na primjer:
              <br/>• Ako odaberete 29. oktobar 2025. za 10 dana → sistem analizira 29. okt - 7. nov u godinama 2024, 2023, 2022, 2021
            </p>
            <p>
              <strong>Korak 3:</strong> Sistem izračunava šta je prodato u tim prošlim periodima i prosjek dnevnih količina.
            </p>
            <p>
              <strong>Korak 4:</strong> Na osnovu istorijskih obrazaca, predlaže koliko trebate naručiti za odabrani budući period.
            </p>
            <div className="text-xs mt-3 bg-amber-100 dark:bg-amber-900/30 p-2 rounded border border-amber-300 dark:border-amber-700">
              <strong>⚠️ Važno:</strong> Baza podataka sadrži podatke o prodaji od <strong>1. februar 2021. do 31. oktobar 2024</strong>.
              <br/>• Najbolji rezultati: Odaberite datume gdje postoje istorijski podaci (npr. periodi februar-oktobar)
              <br/>• Djelimični rezultati: Neke godine mogu nedostajati ako raspon datuma prelazi 31. oktobar
            </div>
            <p className="text-xs mt-2 text-purple-700 dark:text-purple-300">
              💡 <strong>Savjet:</strong> Kliknite na bilo koji red da vidite raščlambu po godinama istorijskih podataka o prodaji.
            </p>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
            Postavke predviđanja
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Početni datum
              </label>
              <input
                type="date"
                id="startDate"
                value={getInputDate()}
                onChange={handleDateChange}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="days" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Broj dana za predviđanje
              </label>
              <input
                type="number"
                id="days"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="yearsBack" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Godine za analizu
              </label>
              <input
                type="number"
                id="yearsBack"
                min="1"
                max="5"
                value={yearsBack}
                onChange={(e) => setYearsBack(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confidence" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Min. pouzdanost
              </label>
              <select
                id="confidence"
                value={minConfidence}
                onChange={(e) => setMinConfidence(e.target.value as 'all' | 'high' | 'medium')}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Svi</option>
                <option value="medium">Srednji+</option>
                <option value="high">Samo visoki</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        {analysis && !loading && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Pregled analize
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Period predviđanja</p>
                <p className="text-lg font-bold text-black dark:text-white">
                  {analysis.prediction_start_date}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-500">do {analysis.prediction_end_date}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Ukupno artikala</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredSuggestions.length}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Ukupno jedinica za naručiti</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalSuggestedQuantity.toFixed(0)}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Procijenjeni trošak</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totalEstimatedCost.toFixed(2)} KM
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Analizirani istorijski periodi ({analysis.years_with_data} od {analysis.years_analyzed} godina ima podatke):
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.historical_periods.map((period) => (
                  <span
                    key={period.year}
                    className={`px-3 py-1 rounded-full text-sm ${
                      period.has_data
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {period.has_data ? '✓' : '✗'} {period.year}: {period.start_date} - {period.end_date}
                  </span>
                ))}
              </div>
              {analysis.years_with_data < analysis.years_analyzed && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                  ⚠️ Neke godine nemaju podatke za ovaj period. To se može desiti ako raspon datuma prelazi dostupne podatke (baza ima podatke do 31. oktobra 2024).
                </p>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Analiza istorijskih podataka...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Suggestions Table */}
        {!loading && !error && filteredSuggestions.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Šifra artikla</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Naziv artikla</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Preporučena narudžba</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Prosjek/Dan</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Prosječna cijena</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Procijenjeni trošak</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Godine</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Pouzdanost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {filteredSuggestions.map((item, index) => (
                    <>
                      <tr
                        key={item.sifra_art}
                        className={`hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer ${
                          index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                        }`}
                        onClick={() => setExpandedRow(expandedRow === item.sifra_art ? null : item.sifra_art)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                          <span className="text-lg">{expandedRow === item.sifra_art ? '▼' : '▶'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {index === 0 && '🥇 '}
                          {index === 1 && '🥈 '}
                          {index === 2 && '🥉 '}
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                          {item.sifra_art}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                          {item.naziv_art}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600 dark:text-green-400">
                          {item.suggested_order_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-600 dark:text-zinc-400">
                          {item.avg_daily_quantity.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-zinc-100">
                          {item.avg_price.toFixed(2)} KM
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-600 dark:text-purple-400">
                          {(item.suggested_order_quantity * item.avg_price).toFixed(2)} KM
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-zinc-900 dark:text-zinc-100">
                          {item.years_analyzed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceBadge(item.confidence)}`}>
                            {item.confidence.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      {expandedRow === item.sifra_art && (
                        <tr key={`${item.sifra_art}-details`} className="bg-blue-50 dark:bg-blue-900/10">
                          <td colSpan={10} className="px-6 py-4">
                            <div className="text-sm">
                              <h4 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
                                Raščlamba istorijskih podataka (Isti period od {days} dana u prethodnim godinama)
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {item.yearly_breakdown.map((yearData) => (
                                  <div
                                    key={yearData.year}
                                    className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                                  >
                                    <div className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                                      Godina {yearData.year}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-zinc-600 dark:text-zinc-400">Količina:</span>
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                          {yearData.quantity.toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-zinc-600 dark:text-zinc-400">Prihod:</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                          {yearData.revenue.toFixed(2)} KM
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-zinc-600 dark:text-zinc-400">Dnevni prosjek:</span>
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                          {(yearData.quantity / days).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                                Kliknite red ponovo da zatvorite
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && filteredSuggestions.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
              Nema dostupnih preporuka za odabrani period
            </h3>
            <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
              <p>
                Ovo se obično dešava kada odabrani raspon datuma nema istorijske podatke u prethodnim godinama.
              </p>
              <p className="font-medium mt-3">Pokušajte ove datume za najbolje rezultate:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Datumi između februara i oktobra (bilo koja godina)</li>
                <li>Držite dane predviđanja ≤ 10 da ne prelazite 31. oktobar</li>
                <li>Primjer: Odaberite 20. okt 2024. sa 10 dana → dobijate podatke iz 2020-2023</li>
              </ul>
              <p className="mt-3 text-xs">
                <strong>Raspon baze podataka:</strong> 1. februar 2021. do 31. oktobar 2024.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
