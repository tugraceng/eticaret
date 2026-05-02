import { notFound } from "next/navigation";
import { AdminApp } from "../AdminApp";
import { isValidAdminTab } from "../tabs";

export default async function AdminTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  if (!isValidAdminTab(tab)) notFound();
  return <AdminApp initialTab={tab} />;
}

