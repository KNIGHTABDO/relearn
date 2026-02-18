/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export when building for Tauri (API routes get removed by beforeBuildCommand)
  ...(process.env.TAURI_ENV_PLATFORM ? { output: "export" } : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};
export default nextConfig;
