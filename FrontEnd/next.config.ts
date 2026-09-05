import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { hostname: 'placehold.co' },
      { hostname: 'upload.wikimedia.org' },
      { hostname: 'static.todamateria.com.br' },
    ],
  },
  env: {
    NEXT_PUBLIC_ROOT_DOMAIN: 'grupocazua.com.br',
  },
};

export default nextConfig;