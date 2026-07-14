/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a minimal self-contained build for Docker deployment.
  // When deployed to Vercel this setting is ignored — Vercel handles its own output.
  output: "standalone",
};

export default nextConfig;
