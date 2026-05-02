"use client";

import { SettingsEditor } from "../SettingsEditor";

export function SettingsPanel({ token }: { token: string }) {
  return <SettingsEditor token={token} />;
}
