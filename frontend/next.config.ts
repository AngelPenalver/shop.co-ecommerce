import type { NextConfig } from "next";

const linksImages = ["d.media.kavehome.com"];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: linksImages.map((hostname) => ({
      protocol: "https",
      hostname,
      port: "",
      pathname: "/**",
    })),
  },
};

export default nextConfig;
