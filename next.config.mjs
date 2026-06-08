/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  output: 'standalone',
    allowedDevOrigins: ['local.domainbags.com'],
};

export default nextConfig;
