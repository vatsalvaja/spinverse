/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Lets a verification build run next to a live dev server (NEXT_DIST_DIR=.next-check next build).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
