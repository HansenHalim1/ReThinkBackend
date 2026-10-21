import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/videos/:path*', headers: [
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ] }];
  },
};
export default config;
