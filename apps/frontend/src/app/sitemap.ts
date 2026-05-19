import type { MetadataRoute } from "next";
import { apiJsonSafe } from "@/lib/api";
import { getMetadataBase } from "@/lib/site-url";

type Product = { slug: string; updatedAt?: string };
type Category = { slug: string; updatedAt?: string };
type BlogPost = { slug: string; publishedAt?: string | null };

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getMetadataBase().toString().replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/gizlilik`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/teslimat-iade`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${base}/mesafeli-satis-sozlesmesi`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [products, categories, posts] = await Promise.all([
    apiJsonSafe<Product[]>("/products"),
    apiJsonSafe<Category[]>("/categories"),
    apiJsonSafe<BlogPost[]>("/cms/blog"),
  ]);

  const productEntries: MetadataRoute.Sitemap =
    products?.map((p) => ({
      url: `${base}/shop/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    })) ?? [];

  const categoryEntries: MetadataRoute.Sitemap =
    categories?.map((c) => ({
      url: `${base}/shop?category=${encodeURIComponent(c.slug)}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    })) ?? [];

  const blogEntries: MetadataRoute.Sitemap =
    posts
      ?.filter((p) => p.publishedAt)
      .map((p) => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
        changeFrequency: "monthly",
        priority: 0.5,
      })) ?? [];

  return [...staticEntries, ...categoryEntries, ...productEntries, ...blogEntries];
}
