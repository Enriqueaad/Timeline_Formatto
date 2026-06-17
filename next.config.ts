import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["xlsx", "@react-pdf/renderer", "unpdf"],
};

export default nextConfig;
