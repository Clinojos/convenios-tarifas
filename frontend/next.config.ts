import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["192.168.202.18", "192.168.0.81"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
