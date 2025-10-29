import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**': ['./database/**'],
  },
};

export default nextConfig;
