import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/x",
        destination: "https://x.com/NoCapMultiAgent",
        permanent: true,
      },
      {
        source: "/telegram",
        destination: "https://t.me/NoCapAgentBot",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
