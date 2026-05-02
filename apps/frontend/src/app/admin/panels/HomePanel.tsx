"use client";

import { HomeEditor } from "../HomeEditor";

export function HomePanel({ token }: { token: string }) {
  return <HomeEditor token={token} />;
}
