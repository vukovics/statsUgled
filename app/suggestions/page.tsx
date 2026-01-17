'use client';

import { useState, useEffect } from 'react';

interface Suggestion {
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

interface HistoricalPeriod {
  year: string;
  start_date: string;
  end_date: string;
  has_data: boolean;
  weight: number;
}

interface Analysis {
  prediction_start_date: string;
  prediction_end_date: string;
  days_predicted: number;
  weekend_days: number;
  week_days: number;
  years_analyzed: number;
  years_with_data: number;
  historical_periods: HistoricalPeriod[];
  abc_summary: {
    a_count: number;
    b_count: number;
    c_count: number;
  };
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
  const [abcFilter, setAbcFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');
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

  const getAbcBadge = (category: string) => {
    const colors = {
      A: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      C: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'
    };
    return colors[category as keyof typeof colors] || colors.C;
  };

  const getTrendBadge = (direction: string, percentage: number) => {
    if (direction === 'growing') {
      return {
        color: 'text-green-600 dark:text-green-400',
        icon: '↑',
        text: `+${percentage.toFixed(1)}%`
      };
    } else if (direction === 'declining') {
      return {
        color: 'text-red-600 dark:text-red-400',
        icon: '↓',
        text: `${percentage.toFixed(1)}%`
      };
    }
    return {
      color: 'text-zinc-600 dark:text-zinc-400',
      icon: '→',
      text: 'stabilan'
    };
  };

  const filteredSuggestions = suggestions.filter(item => {
    // Confidence filter
    if (minConfidence === 'high' && item.confidence !== 'high') return false;
    if (minConfidence === 'medium' && item.confidence === 'low') return false;

    // ABC filter
    if (abcFilter !== 'all' && item.abc_category !== abcFilter) return false;

    return true;
  });

  const totalSuggestedQuantity = filteredSuggestions.reduce(
    (sum, item) => sum + item.final_order_quantity,
    0
  );

  const totalEstimatedCost = filteredSuggestions.reduce(
    (sum, item) => sum + (item.final_order_quantity * item.avg_price),
    0
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <main className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-black dark:text-white">
            Preporuke za narudžbu
          </h1>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 md:p-6 mb-4 md:mb-6 border border-purple-200 dark:border-purple-800">
          <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-purple-900 dark:text-purple-100">
            📊 Napredni sistem preporuka
          </h2>
          <div className="text-xs md:text-sm text-purple-800 dark:text-purple-200 space-y-1 md:space-y-2">
            <p>
              <strong>Težinski prosjek:</strong> Noviji podaci imaju veću važnost (2024: 50%, 2023: 30%, 2022: 15%, 2021: 5%)
            </p>
            <p>
              <strong>Trend analiza:</strong> Sistem prepoznaje rastući/opadajući trend i prilagođava preporuke
            </p>
            <p>
              <strong>Safety stock:</strong> Automatski izračunata sigurnosna zaliha na osnovu varijabilnosti prodaje
            </p>
            <p>
              <strong>Vikend faktor:</strong> Prilagođava preporuke za proizvode koji se više/manje prodaju vikendom
            </p>
            <p>
              <strong>ABC kategorije:</strong> A = top 80% prihoda, B = sljedećih 15%, C = preostalih 5%
            </p>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-black dark:text-white">
            Postavke predviđanja
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
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
                Broj dana
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
                Godine unazad
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
                Pouzdanost
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

            <div>
              <label htmlFor="abcFilter" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                ABC kategorija
              </label>
              <select
                id="abcFilter"
                value={abcFilter}
                onChange={(e) => setAbcFilter(e.target.value as 'all' | 'A' | 'B' | 'C')}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Sve</option>
                <option value="A">A (Top)</option>
                <option value="B">B (Srednji)</option>
                <option value="C">C (Ostali)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        {analysis && !loading && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg shadow-lg p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-black dark:text-white">
              Pregled analize
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">Period</p>
                <p className="text-sm md:text-base font-bold text-black dark:text-white">
                  {analysis.prediction_start_date}
                </p>
                <p className="text-xs text-zinc-500">do {analysis.prediction_end_date}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">Artikala</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredSuggestions.length}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">Za naručiti</p>
                <p className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalSuggestedQuantity.toFixed(0)}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">Trošak</p>
                <p className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400 break-words">
                  {totalEstimatedCost.toFixed(2)} KM
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">Vikend/Radni</p>
                <p className="text-lg md:text-xl font-bold text-amber-600 dark:text-amber-400">
                  {analysis.weekend_days}/{analysis.week_days}
                </p>
              </div>
            </div>

            {/* ABC Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 text-center">
                <p className="text-xs text-purple-700 dark:text-purple-300">A kategorija</p>
                <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{analysis.abc_summary.a_count}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-700 dark:text-blue-300">B kategorija</p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{analysis.abc_summary.b_count}</p>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-700 dark:text-zinc-300">C kategorija</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{analysis.abc_summary.c_count}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Analizirani periodi (težine):
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
                    {period.has_data ? '✓' : '✗'} {period.year} ({(period.weight * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
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
            <div className="overflow-x-auto touch-pan-x">
              <table className="w-full">
                <thead className="bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase"></th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase">#</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase">Šifra</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase">Naziv</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase">Narudžba</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase">Safety</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase">Ukupno</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase">Trend</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase">ABC</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase">Vikend</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase">Trošak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {filteredSuggestions.map((item, index) => {
                    const trend = getTrendBadge(item.trend_direction, item.trend_percentage);
                    return (
                      <>
                        <tr
                          key={item.sifra_art}
                          className={`hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer ${
                            item.abc_category === 'A' ? 'bg-purple-50 dark:bg-purple-900/10' : ''
                          }`}
                          onClick={() => setExpandedRow(expandedRow === item.sifra_art ? null : item.sifra_art)}
                        >
                          <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm">
                            <span className="text-lg">{expandedRow === item.sifra_art ? '▼' : '▶'}</span>
                          </td>
                          <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {index + 1}
                          </td>
                          <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                            {item.sifra_art}
                          </td>
                          <td className="px-2 md:px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                            {item.naziv_art}
                          </td>
                          <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm text-right text-zinc-600 dark:text-zinc-400">
                            {item.suggested_order_quantity}
                          </td>
                          <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm text-right text-amber-600 dark:text-amber-400">
                            +{item.safety_stock}
                          </td>
                          <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-green-600 dark:text-green-400">
                            {item.final_order_quantity}
                          </td>
                          <td className={`px-2 md:px-4 py-3 whitespace-nowrap text-sm text-center font-semibold ${trend.color}`}>
                            {trend.icon} {trend.text}
                          </td>
                          <td className="px-2 md:px-4 py-3 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAbcBadge(item.abc_category)}`}>
                              {item.abc_category}
                            </span>
                          </td>
                          <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm text-center text-zinc-600 dark:text-zinc-400">
                            {item.weekend_factor.toFixed(2)}x
                          </td>
                          <td className="px-2 md:px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-purple-600 dark:text-purple-400">
                            {(item.final_order_quantity * item.avg_price).toFixed(2)} KM
                          </td>
                        </tr>
                        {expandedRow === item.sifra_art && (
                          <tr key={`${item.sifra_art}-details`} className="bg-blue-50 dark:bg-blue-900/10">
                            <td colSpan={11} className="px-4 py-4">
                              <div className="text-sm">
                                <h4 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
                                  Detalji za {item.naziv_art}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3">
                                    <p className="text-xs text-zinc-500">Prosjek/dan (težinski)</p>
                                    <p className="font-bold">{item.avg_daily_quantity.toFixed(2)}</p>
                                  </div>
                                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3">
                                    <p className="text-xs text-zinc-500">Prosječna cijena</p>
                                    <p className="font-bold">{item.avg_price.toFixed(2)} KM</p>
                                  </div>
                                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3">
                                    <p className="text-xs text-zinc-500">Istorijski prihod</p>
                                    <p className="font-bold">{item.historical_revenue.toFixed(2)} KM</p>
                                  </div>
                                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3">
                                    <p className="text-xs text-zinc-500">Pouzdanost</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceBadge(item.confidence)}`}>
                                      {item.confidence.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <h5 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Po godinama:</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {item.yearly_breakdown.map((yearData) => (
                                    <div
                                      key={yearData.year}
                                      className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-blue-900 dark:text-blue-100">{yearData.year}</span>
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                          {(yearData.weight * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                      <p className="text-xs text-zinc-500">Količina: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{yearData.quantity.toFixed(2)}</span></p>
                                      <p className="text-xs text-zinc-500">Prihod: <span className="font-semibold text-green-600">{yearData.revenue.toFixed(2)} KM</span></p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && filteredSuggestions.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2 md:mb-3">
              Nema dostupnih preporuka
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Pokušajte promijeniti filtere ili odabrati drugi period.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
