import type { NextConfig } from "next";

import("@opennextjs/cloudflare").then((module) =>
  module.initOpenNextCloudflareForDev(),
);

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
