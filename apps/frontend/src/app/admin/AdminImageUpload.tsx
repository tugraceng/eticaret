"use client";

import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { adminUploadFile } from "./api";
import { formatAdminCaughtError } from "./admin-api-error";

type Props = {
  token: string;
  label: ReactNode;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  hint?: ReactNode;
};

const DEFAULT_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.ico,image/x-icon,image/vnd.microsoft.icon";

export function AdminImageUpload({ token, label, value, onChange, accept, hint }: Props) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const { url } = await adminUploadFile(token, f);
      onChange(url);
    } catch (x) {
      const msg = formatAdminCaughtError(x, String(x));
      if (msg) setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          id={id}
          type="file"
          accept={accept ?? DEFAULT_ACCEPT}
          className="hidden"
          onChange={onFile}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? "Yükleniyor…" : "Dosya seç"}
        </button>
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-10 max-w-[140px] rounded border border-slate-200 object-contain"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Kaldır
            </button>
          </>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
      {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : null}
    </label>
  );
}
