import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle for small Docker images.
  output: "standalone",
  // In a monorepo, trace files from the repo root so the workspace
  // dependency (@cafe/shared) is included in the standalone output.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
