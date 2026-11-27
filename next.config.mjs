/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  async redirects() {
    return [
      { source: "/admin", destination: "/super-admin", permanent: false },
      { source: "/admin/transactions", destination: "/super-admin/transactions?tab=ledger", permanent: false },
      { source: "/admin/users", destination: "/super-admin/users", permanent: false },
      { source: "/admin/users/:id", destination: "/super-admin/users/:id", permanent: false },
      { source: "/admin/games", destination: "/super-admin/games", permanent: false },
      { source: "/admin/analytics", destination: "/super-admin/analytics", permanent: false },
      { source: "/admin/reports", destination: "/super-admin/reports", permanent: false },
      { source: "/admin/settings", destination: "/super-admin/settings", permanent: false },
      { source: "/admin/game-management", destination: "/super-admin/game-management", permanent: false },
      { source: "/admin/game-management/:path*", destination: "/super-admin/game-management/:path*", permanent: false },
    ];
  },
  // Only set custom distDir when NEXT_DIST_DIR is explicitly passed
  // (prevents Vercel output directory conflicts where distDir='.next' causes deployment errors)
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};
export default nextConfig;
