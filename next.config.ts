import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the sandboxed preview origin to reach the dev server.
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
