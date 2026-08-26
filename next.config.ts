import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const worker = process.env.WORKER_API_URL || "http://127.0.0.1:8000";
    return [
      // only paths that truly exist on FastAPI
      { source: "/api/worker/:path*", destination: `${worker}/:path*` },
    ];
  },
};

export default nextConfig;
