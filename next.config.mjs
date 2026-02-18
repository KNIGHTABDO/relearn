/** @type {import('next').NextConfig} */
const isTauriBuild = process.env.TAURI_ENV_PLATFORM !== undefined;

const nextConfig = {
  // Static export only when building for Tauri
  ...(isTauriBuild ? { output: "export" } : {}),
  // Skip ESLint during builds (run separately in dev)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript type checking during builds (faster CI)
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
