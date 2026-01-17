'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Početna', color: 'bg-zinc-800 dark:bg-zinc-700' },
    { href: '/suggestions', label: 'Preporuke', color: 'bg-orange-600' },
    { href: '/product-analytics', label: 'Analitika', color: 'bg-indigo-600' },
    { href: '/sales-trends', label: 'Trendovi', color: 'bg-emerald-600' },
    { href: '/top-items', label: 'Top artikli', color: 'bg-blue-600' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 shadow-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-black dark:text-white hidden md:block">
            Stats Ugled
          </h1>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 md:px-4 text-white rounded-lg transition-colors text-sm md:text-base text-center ${
                    isActive
                      ? `${link.color} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-white/50`
                      : `${link.color} hover:opacity-90`
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
