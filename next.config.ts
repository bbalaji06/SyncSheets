import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,   // silence the multiple lockfiles warning
  },
  allowedDevOrigins: ["10.2.0.2"],
};

export default nextConfig;
