/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  images: {
    domains: [
      'public.blob.vercel-storage.com',
      'i.pravatar.cc',
      'picsum.photos',
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'public.blob.vercel-storage.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.pravatar.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
};

export default nextConfig;
