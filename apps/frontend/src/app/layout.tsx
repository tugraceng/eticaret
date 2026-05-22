import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { getSiteSettings } from "@/lib/settings";
import { absoluteFromSite, getMetadataBase } from "@/lib/site-url";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const name = settings.siteName;
  const title = settings.defaultMetaTitle?.trim() || name;
  const description =
    settings.defaultMetaDesc?.trim() || `${name} — ürünler, hizmetler ve iletişim.`;
  const og = absoluteFromSite(settings.ogImageUrl ?? undefined);
  return {
    metadataBase: getMetadataBase(),
    title: { default: title, template: `%s · ${name}` },
    description,
    applicationName: name,
    icons: settings.faviconUrl?.trim()
      ? { icon: settings.faviconUrl, apple: settings.faviconUrl }
      : { icon: [{ url: "/favicon.ico", type: "image/x-icon", sizes: "any" }] },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: name,
      locale: "tr_TR",
      ...(og ? { images: [{ url: og }] } : {}),
    },
    twitter: {
      card: og ? "summary_large_image" : "summary",
      title,
      description,
      ...(og ? { images: [og] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    formatDetection: { telephone: true, address: false, email: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const cssVars = {
    "--brand-primary": settings.primaryColor,
    "--brand-secondary": settings.secondaryColor,
    ...(settings.accentColor ? { "--brand-accent": settings.accentColor } : {}),
  } as React.CSSProperties;
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} bg-[#121212]`}
    >
      <body className="min-h-screen bg-[#121212] font-sans antialiased" style={cssVars}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
