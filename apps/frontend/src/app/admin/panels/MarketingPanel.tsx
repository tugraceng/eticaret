"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "../api";
import { AdminButton } from "../components/ui/AdminButton";
import { AdminCard } from "../ui";
import { AdminInput } from "../components/ui/AdminInput";
import { AdminSelect } from "../components/ui/AdminSelect";
import { AdminTextarea } from "../components/ui/AdminTextarea";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";

const AUDIENCES: Array<{ id: string; label: string }> = [
  { id: "ALL_OPT_IN", label: "Kampanya izni + KVKK onayı olan tüm müşteriler" },
  { id: "LAST_30_SHOPPERS", label: "Son 30 günde alışveriş yapanlar (izinli)" },
  { id: "NEVER_ORDERED", label: "Hiç sipariş vermemişler (izinli)" },
  {
    id: "ABANDONED",
    label: "Sepeti terk edenler: üye + checkout e-postası veren misafir (izinli, +1 saat hareketsiz)",
  },
  { id: "BIRTHDAY_7D", label: "Doğum günü 7 gün içinde (izinli)" },
];

const CHANNELS: Array<{ id: string; label: string }> = [
  { id: "EMAIL", label: "E-posta" },
  { id: "WHATSAPP_LINK", label: "E-posta + WhatsApp bağlantısı" },
  { id: "SMS_READY", label: "E-posta (SMS altyapısı için hazır)" },
  { id: "SMS", label: "SMS (NetGSM — üye cep telefonu)" },
];

type CampaignRow = {
  id: string;
  title: string;
  audience: string;
  channel: string;
  status: string;
  recipientCount: number;
  successCount: number;
  failCount: number;
  createdAt: string;
  sentAt: string | null;
  discountCode: { code: string } | null;
};

type DiscountRow = { id: string; code: string };

type AbandonedRow = {
  id: string;
  userId: string;
  totalCents: number;
  itemCount: number;
  lastActivityAt: string;
  user: { email: string; name: string | null; surname: string | null; marketingOptIn: boolean };
};

type GuestAbandonedRow = {
  id: string;
  email: string;
  marketingOptIn: boolean;
  totalCents: number;
  itemCount: number;
  lastActivityAt: string;
};

export function MarketingPanel({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRow[]>([]);
  const [abandoned, setAbandoned] = useState<AbandonedRow[]>([]);
  const [guestAbandoned, setGuestAbandoned] = useState<GuestAbandonedRow[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("ALL_OPT_IN");
  const [channel, setChannel] = useState("EMAIL");
  const [discountId, setDiscountId] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [couponExpiresAt, setCouponExpiresAt] = useState("");

  const loadAll = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setErr(null);
    try {
      const [c, d, a, g] = await Promise.all([
        adminFetch("/admin/marketing/campaigns", token) as Promise<CampaignRow[]>,
        adminFetch("/discounts", token) as Promise<DiscountRow[]>,
        adminFetch("/admin/marketing/abandoned-carts", token) as Promise<AbandonedRow[]>,
        adminFetch("/admin/marketing/guest-abandoned-carts", token) as Promise<GuestAbandonedRow[]>,
      ]);
      setCampaigns(Array.isArray(c) ? c : []);
      setDiscounts(Array.isArray(d) ? d : []);
      setAbandoned(Array.isArray(a) ? a : []);
      setGuestAbandoned(Array.isArray(g) ? g : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const preview = useCallback(async () => {
    if (!token) return;
    setPreviewCount(null);
    setErr(null);
    try {
      let url = `/admin/marketing/campaigns/preview?audience=${encodeURIComponent(audience)}`;
      if (channel === "SMS") url += "&channel=SMS";
      const res = (await adminFetch(url, token)) as { count: number };
      setPreviewCount(typeof res.count === "number" ? res.count : 0);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [token, audience, channel]);

  const createCampaign = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      await adminFetch("/admin/marketing/campaigns", token, {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          audience,
          channel,
          discountCodeId: discountId || undefined,
          ctaLink: ctaLink || undefined,
          couponExpiresAt: couponExpiresAt || undefined,
        }),
      });
      setMsg("Kampanya taslağı oluşturuldu.");
      setTitle("");
      setBody("");
      await loadAll();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [token, title, body, audience, channel, discountId, ctaLink, couponExpiresAt, loadAll]);

  const sendCampaign = useCallback(
    async (id: string) => {
      if (!token) return;
      if (!window.confirm("Kampanyayı izinli alıcılara göndermek istediğinize emin misiniz?")) return;
      setBusy(true);
      setErr(null);
      setMsg(null);
      try {
        const res = (await adminFetch(`/admin/marketing/campaigns/${id}/send`, token, {
          method: "POST",
        })) as { successCount?: number; failCount?: number };
        setMsg(
          `Gönderim tamamlandı. Başarılı: ${res.successCount ?? 0}, hatalı: ${res.failCount ?? 0}. Bildirimler güncellendi.`,
        );
        await loadAll();
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [token, loadAll],
  );

  const runBirthdayJob = useCallback(async () => {
    if (!token) return;
    if (!window.confirm("Doğum günü otomasyonunu şimdi çalıştırmak istiyor musunuz? (Mağaza ayarında açık olmalı.)")) {
      return;
    }
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = (await adminFetch("/admin/marketing/birthday-run", token, {
        method: "POST",
      })) as {
        skipped?: boolean;
        message?: string;
        sent?: number;
        skippedExisting?: number;
        failed?: number;
        evaluated?: number;
      };
      if (res.skipped) {
        setMsg(res.message ?? "İşlem atlandı.");
      } else {
        setMsg(
          `Doğum günü işi tamamlandı. Değerlendirilen: ${res.evaluated ?? 0}, gönderilen: ${res.sent ?? 0}, zaten gönderilmiş (atlandı): ${res.skippedExisting ?? 0}, hata: ${res.failed ?? 0}.`,
        );
      }
      void loadAll();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [token, loadAll]);

  const remindGuest = useCallback(
    async (guestId: string) => {
      if (!token) return;
      const code = window.prompt("Opsiyonel kupon kodu (boş bırakılabilir):")?.trim();
      setBusy(true);
      setErr(null);
      try {
        await adminFetch(`/admin/marketing/guest-abandoned-carts/${guestId}/remind`, token, {
          method: "POST",
          body: JSON.stringify({ discountCode: code || undefined }),
        });
        setMsg("Misafir hatırlatma e-postası gönderildi (SMTP yapılandırılmışsa).");
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [token],
  );

  const remindAbandoned = useCallback(
    async (userId: string) => {
      if (!token) return;
      const code = window.prompt("Opsiyonel kupon kodu (boş bırakılabilir):")?.trim();
      setBusy(true);
      setErr(null);
      try {
        await adminFetch(`/admin/marketing/abandoned-carts/${userId}/remind`, token, {
          method: "POST",
          body: JSON.stringify({ discountCode: code || undefined }),
        });
        setMsg("Hatırlatma e-postası gönderildi (SMTP yapılandırılmışsa).");
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [token],
  );

  return (
    <div className="space-y-8">
      <AdminCard
        title="Doğum günü kuponları"
        description="Mağaza ayarlarında otomasyon açıksa, önümüzdeki 7 gün içinde doğum günü olan izinli müşterilere yılda bir kez %10 kupon oluşturulur ve e-posta gönderilir. Harici cron bu uç noktayı POST ile çağırabilir."
      >
        <AdminButton type="button" variant="ghost" disabled={busy} onClick={() => void runBirthdayJob()}>
          Doğum günü işini çalıştır
        </AdminButton>
        <p className="mt-2 text-xs text-slate-500">
          Kapalıysa yanıt “İşlem atlandı” olur — önce Ayarlar → Pazarlama — doğum günü otomasyonunu açıp kaydedin.
        </p>
      </AdminCard>

      <AdminCard
        title="Kampanya mesajları"
        description="Yalnızca kampanya izni ve KVKK onayı olan müşterilere gönderilir. Toplu gönderimde hatalı alıcılar atlanır ve loglanır."
      >
        {busy && campaigns.length === 0 ? <LoadingSkeleton className="h-24" /> : null}
        {err ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{err}</p> : null}
        {msg ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{msg}</p> : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Başlık</label>
              <AdminInput className="mt-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Açıklama (HTML değil)</label>
              <AdminTextarea className="mt-1 w-full" value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
              {channel === "SMS" ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  SMS kanalı düz metindir; başlık ve gövde tek mesajda birleştirilir. Yalnızca üye hesabında geçerli 05xx cep
                  telefonu olan izinli müşterilere gider. Önizlemede bu kişiler sayılır. NetGSM ayarları Mağaza ayarlarından yapılır.
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Kitle</label>
              <AdminSelect className="mt-1 w-full" value={audience} onChange={(e) => setAudience(e.target.value)}>
                {AUDIENCES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminButton type="button" variant="ghost" onClick={() => void preview()}>
                Alıcı sayısını önizle
              </AdminButton>
              {previewCount !== null ? (
                <span className="text-sm font-medium text-slate-700">
                  Tahmini alıcı: {previewCount}
                  {channel === "SMS" ? " (cep telefonu kayıtlı)" : ""}
                </span>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Kanal</label>
              <AdminSelect className="mt-1 w-full" value={channel} onChange={(e) => setChannel(e.target.value)}>
                {CHANNELS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">İndirim kodu (opsiyonel)</label>
              <AdminSelect className="mt-1 w-full" value={discountId} onChange={(e) => setDiscountId(e.target.value)}>
                <option value="">—</option>
                {discounts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">CTA linki (opsiyonel)</label>
              <AdminInput className="mt-1 w-full" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Kupon son kullanım (ISO, opsiyonel)</label>
              <AdminInput
                className="mt-1 w-full"
                value={couponExpiresAt}
                onChange={(e) => setCouponExpiresAt(e.target.value)}
                placeholder="2026-12-31"
              />
            </div>
            <AdminButton type="button" disabled={busy || !title.trim() || !body.trim()} onClick={() => void createCampaign()}>
              Taslak oluştur
            </AdminButton>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Son kampanyalar</p>
            {campaigns.length === 0 ? (
              <EmptyState title="Henüz kampanya yok" hint="Soldan taslak oluşturup gönderebilirsiniz." />
            ) : (
              <ul className="max-h-[28rem] space-y-2 overflow-auto pr-1">
                {campaigns.map((c) => (
                  <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
                    <p className="font-semibold text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500">
                      {c.status} · {c.audience} · {new Date(c.createdAt).toLocaleString("tr-TR")}
                    </p>
                    {c.discountCode ? (
                      <p className="text-xs text-slate-600">Kod: {c.discountCode.code}</p>
                    ) : null}
                    {c.status === "DRAFT" ? (
                      <AdminButton type="button" className="mt-2" variant="primary" disabled={busy} onClick={() => void sendCampaign(c.id)}>
                        Gönder
                      </AdminButton>
                    ) : (
                      <p className="mt-1 text-xs text-slate-600">
                        Alıcı: {c.recipientCount} · OK: {c.successCount} · Hata: {c.failCount}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title="Terk edilmiş sepetler (üyeler)"
        description="Giriş yapmış müşteriler; sunucu sepeti güncellenince kayıt yenilenir. Sipariş tamamlanınca silinir."
      >
        {abandoned.length === 0 ? (
          <EmptyState title="Kayıt yok" hint="Sepet bırakan izinli kullanıcılar burada listelenir." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-2">Müşteri</th>
                  <th className="py-2 pr-2">Tutar</th>
                  <th className="py-2 pr-2">Kalem</th>
                  <th className="py-2 pr-2">Son aktivite</th>
                  <th className="py-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {abandoned.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2 pr-2">
                      <div className="font-medium text-slate-900">{r.user.email}</div>
                      <div className="text-xs text-slate-500">
                        {r.user.name ?? ""} {r.user.surname ?? ""} · izin: {r.user.marketingOptIn ? "evet" : "hayır"}
                      </div>
                    </td>
                    <td className="py-2 pr-2">{(r.totalCents / 100).toFixed(2)} TL</td>
                    <td className="py-2 pr-2">{r.itemCount}</td>
                    <td className="py-2 pr-2 text-xs">{new Date(r.lastActivityAt).toLocaleString("tr-TR")}</td>
                    <td className="py-2">
                      <AdminButton
                        type="button"
                        variant="ghost"
                        disabled={busy || !r.user.marketingOptIn}
                        onClick={() => void remindAbandoned(r.userId)}
                      >
                        Hatırlat
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminCard
        title="Terk edilmiş sepetler (misafir)"
        description="Checkout’ta geçerli e-posta ve sepet satırları girildiğinde kayıt oluşur (debounce). Sipariş tamamlanınca silinir. Hatırlatma yalnızca kampanya izni veren misafirlere gönderilir."
      >
        {guestAbandoned.length === 0 ? (
          <EmptyState title="Misafir kaydı yok" hint="Checkout’ta e-posta yazıldığında ve sepet doluyken oluşur." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-2">E-posta</th>
                  <th className="py-2 pr-2">Kampanya izni</th>
                  <th className="py-2 pr-2">Tutar</th>
                  <th className="py-2 pr-2">Kalem</th>
                  <th className="py-2 pr-2">Son aktivite</th>
                  <th className="py-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {guestAbandoned.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2 pr-2 font-medium text-slate-900">{r.email}</td>
                    <td className="py-2 pr-2 text-xs">{r.marketingOptIn ? "evet" : "hayır"}</td>
                    <td className="py-2 pr-2">{(r.totalCents / 100).toFixed(2)} TL</td>
                    <td className="py-2 pr-2">{r.itemCount}</td>
                    <td className="py-2 pr-2 text-xs">{new Date(r.lastActivityAt).toLocaleString("tr-TR")}</td>
                    <td className="py-2">
                      <AdminButton
                        type="button"
                        variant="ghost"
                        disabled={busy || !r.marketingOptIn}
                        onClick={() => void remindGuest(r.id)}
                      >
                        Hatırlat
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
