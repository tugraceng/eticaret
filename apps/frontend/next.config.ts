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

/** API kökü — /uploads rewrite ve remotePatterns için */
function apiOriginForRewrites(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  return raw.trim().replace(/\/api\/?$/i, "").replace(/\/+$/, "");
}

const nextConfig: NextConfig = {
  /**
   * next/image optimizer göreli /uploads/... isteğini Next ( :3000 ) üzerinden yapar.
   * Rewrite olmazsa 127.0.0.1:3000/uploads → 404 → 400 Bad Request.
   */
  async rewrites() {
    const origin = apiOriginForRewrites();
    return [
      {
        source: "/uploads/:path*",
        destination: `${origin}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "*.amazonaws.com", pathname: "/**" },
      ...uploadPatterns,
    ],
  },
};

export default nextConfig;
