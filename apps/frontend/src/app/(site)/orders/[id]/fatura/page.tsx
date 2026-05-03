import { InvoiceClient } from "./InvoiceClient";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceClient orderId={id} />;
}
