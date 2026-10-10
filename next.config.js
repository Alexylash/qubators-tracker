/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
  // better-auth dynamic chunks break under pnpm + dev bundling — keep server-side.
  experimental: { serverComponentsExternalPackages: ['better-auth', 'kysely'] }
};
module.exports = nextConfig;
