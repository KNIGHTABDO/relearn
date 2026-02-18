/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Tauri desktop app
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  webpack: (config) => {
    // Handle canvas dependency for pdf.js (not needed in browser)
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};
export default nextConfig;
