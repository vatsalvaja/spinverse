/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // Only set custom distDir when NEXT_DIST_DIR is explicitly passed
  // (prevents Vercel output directory conflicts where distDir='.next' causes deployment errors)
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};
export default nextConfig;
