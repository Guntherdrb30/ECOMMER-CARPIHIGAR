/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'carpihogar.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.carpihogar.com',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.carpihogar.com',
          },
        ],
        destination: 'https://carpihogar.com/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
