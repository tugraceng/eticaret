"use client";

import { PaymentsEditor } from "../PaymentsEditor";

export function PaymentsPanel({ token }: { token: string }) {
  return <PaymentsEditor token={token} />;
}
