import type { Metadata } from "next";
import { AdminLoginClient } from "./AdminLoginClient";

export const metadata: Metadata = {
  title: "Yönetim girişi",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}
