import { query } from '@/lib/db';
import Link from 'next/link';

interface Sale {
  id: number;
  import_id: string;
  import_timestamp: string;
  sifra_art: string;
  naziv_art: string;
  kolicina: number;
  cena: number;
  datum: string;
  datum_az: string;
  revenue: number;
}

export default async function Home() {
  const sales = await query<Sale>('SELECT * FROM sales ORDER BY datum DESC LIMIT 10');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <main className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white">
            Kontrolna tabla prodaje
          </h1>
          <div className="flex gap-3">
            <Link
              href="/sales-trends"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
            >
              Trendovi prodaje
            </Link>
            <Link
              href="/top-items"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Najprodavaniji artikli
            </Link>
            <Link
              href="/suggestions"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
            >
              Preporuke za narudžbu
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Šifra artikla</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Naziv artikla</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Količina</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Cijena</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Prihod</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">{sale.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">{sale.sifra_art}</td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">{sale.naziv_art}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">{sale.kolicina}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">{sale.cena.toFixed(2)} KM</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">{sale.revenue.toFixed(2)} KM</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">{sale.datum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">Nedavne prodaje</h2>
            <p className="text-blue-800 dark:text-blue-200">
              Prikazano {sales.length} najnovijih prodaja iz baze podataka
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              API endpoint: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">/api/sales</code>
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
