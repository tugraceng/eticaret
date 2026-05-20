"use client";

import { useState } from "react";
import { apiUrl, formatApiErrorPayload } from "@/lib/api";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(formatApiErrorPayload(text, res.status) || res.statusText);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mesaj gönderilemedi");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="si-page-card flex h-full min-h-[280px] flex-col justify-center p-6 text-center sm:p-8">
        <p className="text-lg font-semibold text-emerald-400">Mesajınız alındı</p>
        <p className="si-body mt-2">En kısa sürede size dönüş yapacağız.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="si-page-card flex h-full flex-col p-6 sm:p-8">
      <h2 className="si-heading text-lg sm:text-xl">Mesaj gönderin</h2>
      <p className="si-body mt-1 text-sm">Formu doldurun, en kısa sürede yanıtlayalım.</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="si-kicker !text-[10px]" htmlFor="contact-name">
            Ad Soyad
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            className="input-soft mt-2"
            placeholder="Adınız ve soyadınız"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            minLength={2}
          />
        </div>
        <div>
          <label className="si-kicker !text-[10px]" htmlFor="contact-email">
            E-posta
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            className="input-soft mt-2"
            placeholder="ornek@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="contact-message">
            Mesaj
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            className="input-soft mt-2 min-h-[120px] resize-y"
            placeholder="Mesajınız…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
          />
        </div>
      </div>
      {error ? (
        <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="si-btn-primary mt-6 w-full sm:w-auto">
        {busy ? "Gönderiliyor…" : "Gönder"}
      </button>
    </form>
  );
}
