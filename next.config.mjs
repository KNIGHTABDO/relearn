/** @type {import('next').NextConfig} */
const isTauriBuild = process.env.TAURI_ENV_PLATFORM !== undefined;

const nextConfig = {
  // Static export only when building for Tauri (no API routes needed)
  ...(isTauriBuild ? { output: "export" } : {}),
  images: {
    unoptimized: isTauriBuild,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  // Skip API routes when building for Tauri
  ...(isTauriBuild ? {
    experimental: {
      // Exclude server-only code from static export
    },
  } : {}),
};
export default nextConfig;
