import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["xlsx", "@react-pdf/renderer", "unpdf"],
  // El Excel de cocina pesa ~58MB; subimos el límite del body del proxy (default 10MB).
  experimental: {
    proxyClientMaxBodySize: "80mb",
  },
};

export default nextConfig;
