"use client";

import { PaymentsEditor } from "../PaymentsEditor";
import { BankAccountsPanel } from "./BankAccountsPanel";

export function PaymentsPanel({ token }: { token: string }) {
  return (
    <div className="space-y-8">
      <PaymentsEditor token={token} />
      <BankAccountsPanel token={token} />
    </div>
  );
}
