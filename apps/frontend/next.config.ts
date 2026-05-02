import type { NextConfig } from "next";

function apiUploadPattern():
  | { protocol: "http" | "https"; hostname: string; pathname: string }
  | null {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  try {
    const u = new URL(raw);
    const protocol = u.protocol === "https:" ? "https" : "http";
    return { protocol, hostname: u.hostname, pathname: "/uploads/**" };
  } catch {
    return null;
  }
}

const uploadPat = apiUploadPattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.amazonaws.com", pathname: "/**" },
      ...(uploadPat ? [uploadPat] : []),
    ],
  },
};

export default nextConfig;
