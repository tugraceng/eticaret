"use client";

import { DiscountsEditor } from "../DiscountsEditor";

export function DiscountsPanel({ token }: { token: string }) {
  return <DiscountsEditor token={token} />;
}
