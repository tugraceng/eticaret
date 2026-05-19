import type { NextConfig } from "next";

function uploadPatternFromBase(raw: string | undefined):
  | { protocol: "http" | "https"; hostname: string; pathname: string }
  | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim().replace(/\/+$/, ""));
    const protocol = u.protocol === "https:" ? "https" : "http";
    return { protocol, hostname: u.hostname, pathname: "/uploads/**" };
  } catch {
    return null;
  }
}

function apiUploadPattern() {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  const base = api.replace(/\/api\/?$/i, "");
  return uploadPatternFromBase(base) ?? uploadPatternFromBase(api);
}

function siteUploadPattern() {
  return uploadPatternFromBase(process.env.NEXT_PUBLIC_SITE_URL);
}

const uploadPatterns = [apiUploadPattern(), siteUploadPattern()].filter(
  (p): p is NonNullable<typeof p> => p != null,
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.amazonaws.com", pathname: "/**" },
      ...uploadPatterns,
    ],
  },
};

export default nextConfig;
