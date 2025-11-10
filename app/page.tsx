import Link from 'next/link';
import SeasonalPatternsChart from '@/components/SeasonalPatternsChart';
import BestSellersChart from '@/components/BestSellersChart';
import SalesTrendsChart from '@/components/SalesTrendsChart';
import TodayTrendsChart from '@/components/TodayTrendsChart';
import LogoutButton from '@/components/LogoutButton';

export default async function Home() {

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <main className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl md:text-4xl font-bold text-black dark:text-white">
              Kontrolna tabla prodaje
            </h1>
            <LogoutButton />
          </div>
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
            <Link
              href="/product-analytics"
              className="px-3 py-2 md:px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm md:text-base text-center"
            >
              Analitika
            </Link>
            <Link
              href="/sales-trends"
              className="px-3 py-2 md:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm md:text-base text-center"
            >
              Trendovi
            </Link>
            <Link
              href="/top-items"
              className="px-3 py-2 md:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm md:text-base text-center"
            >
              Top artikli
            </Link>
            <Link
              href="/suggestions"
              className="px-3 py-2 md:px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm md:text-base text-center"
            >
              Preporuke
            </Link>
          </div>
        </div>

        {/* Dashboard Charts */}
        <div className="mb-6 md:mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <SeasonalPatternsChart />
          <BestSellersChart />
        </div>

        <div className="mb-6 md:mb-8">
          <SalesTrendsChart />
        </div>

        <div className="mb-6 md:mb-8">
          <TodayTrendsChart />
        </div>

        <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-indigo-900 dark:text-indigo-100">Analitika proizvoda</h2>
            <p className="text-indigo-800 dark:text-indigo-200">
              Sezonalnost, najprodavaniji i sporoprometni proizvodi
            </p>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">
              API endpoint: <code className="bg-indigo-100 dark:bg-indigo-800 px-2 py-1 rounded">/api/product-analytics</code>
            </p>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-emerald-900 dark:text-emerald-100">Trendovi prodaje</h2>
            <p className="text-emerald-800 dark:text-emerald-200">
              Analiza prodaje po danima, sedmicama, mjesecima, godinama
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">
              API endpoint: <code className="bg-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded">/api/sales-trends</code>
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-green-900 dark:text-green-100">Najprodavaniji artikli</h2>
            <p className="text-green-800 dark:text-green-200">
              Pregled ukupnih prodaja po artiklu za bilo koji datum
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              API endpoint: <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded">/api/top-items</code>
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-purple-900 dark:text-purple-100">Preporuke za narudžbu</h2>
            <p className="text-purple-800 dark:text-purple-200">
              Preporuke bazirane na 3-4 godine istorijskih podataka
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
              API endpoint: <code className="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">/api/suggestions</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
