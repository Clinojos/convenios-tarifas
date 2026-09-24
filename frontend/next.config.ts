import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["192.168.202.18", "192.168.0.81"],
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Todas las rutas excepto /login y los assets internos de Next
        source: "/((?!login|_next).*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
