import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**': [
      './database/**',
      './node_modules/sql.js/dist/**',
    ],
  },
};

export default nextConfig;
