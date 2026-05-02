import type { Metadata } from "next";
import { CustomerReturns } from "@/components/account/CustomerReturns";

export const metadata: Metadata = { title: "İadelerim" };

export default function CustomerReturnsPage() {
  return <CustomerReturns />;
}
