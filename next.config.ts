import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["stripe"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
