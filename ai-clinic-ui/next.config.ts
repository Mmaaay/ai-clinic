import "./env.mjs"; // Validation happens here!

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: {
    root: ".",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};
export default nextConfig;
