import type { Metadata } from "next";
import { CustomerRegisterForm } from "@/components/account/CustomerRegisterForm";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Kayıt" };

export default async function CustomerRegisterPage() {
  const settings = await getSiteSettings();
  return <CustomerRegisterForm siteName={settings.siteName} />;
}
