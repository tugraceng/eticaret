"use client";

import { ReturnsModerator } from "../ReturnsModerator";

export function ReturnsPanel({ token }: { token: string }) {
  return <ReturnsModerator token={token} />;
}
