import type { Metadata } from "next";
import { CustomerAccountHome } from "@/components/account/CustomerAccountHome";

export const metadata: Metadata = { title: "Hesabım" };

export default function HesapPage() {
  return <CustomerAccountHome />;
}
