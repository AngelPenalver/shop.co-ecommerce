import type { NextConfig } from "next";

const linksImages = [
  "img2.kenayhome.com",
  "img1.kenayhome.com",
  "img3.kenayhome.com",
];

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
