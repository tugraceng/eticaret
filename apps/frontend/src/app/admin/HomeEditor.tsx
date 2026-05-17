"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HomeSection, HomeSectionKind } from "@/lib/settings";
import { AdminImageUpload } from "./AdminImageUpload";
import { adminFetch } from "./api";
import { formatAdminCaughtError } from "./admin-api-error";
import { AdminCard, Field, Icon, Toast } from "./ui";

const KIND_META: Record<
  HomeSectionKind,
  { label: string; emoji: string; desc: string }
> = {
  HERO: {
    label: "Hero slayt",
    emoji: "🎬",
    desc: "Tam genişlik vitrin. Görseller için yatay (ör. 21:9, ~2560×1080) önerilir; kare görseller kırpılabilir.",
  },
  TRUST_STRIP: {
    label: "Güven şeridi",
    emoji: "✅",
    desc: "Üç sütun güven mesajı; boş bırakınca varsayılan metinler, isteğe items ile özelleştirin.",
  },
  CATEGORY_ICONS: {
    label: "Kategori ikonları",
    emoji: "🔲",
    desc: "Kategori ızgarası (ilk 8); başlık alanlarını soldan doldurun.",
  },
  RAIL_BESTSELLERS: {
    label: "Şerit: çok satanlar",
    emoji: "📈",
    desc: "Otomatik en çok satanlar; başlık ve 'tümünü gör' linkini düzenleyin.",
  },
  RAIL_POPULAR: {
    label: "Şerit: popüler",
    emoji: "🔥",
    desc: "Trend ürün listesi; sıralama API’den gelir.",
  },
  RAIL_NEWEST: {
    label: "Şerit: yeni",
    emoji: "✨",
    desc: "Yeni ürün şeridi.",
  },
  STORY_STRIP: {
    label: "Hikâye şeridi",
    emoji: "📱",
    desc: "Yatay ürün şeridi; yalnızca üründe «Öne çıkan» işaretli yayınlı ürünler (görseli olanlar). Başlık/metin panelden.",
  },
  PROMO_BANNER: {
    label: "Promo şeridi",
    emoji: "🎯",
    desc: "Koyu tam genişlik CTA; başlık, gövde, buton.",
  },
  PRODUCT_CATALOG: {
    label: "Ürün vitrini (ızgara)",
    emoji: "🛒",
    desc: "Ana ürün alanı ve filtreler — tek blok yeterli; sırayı buraya göre ayarlayın.",
  },
  BANNERS: { label: "Afişler", emoji: "🖼️", desc: "Kart/grid kampanya afisleri." },
  FEATURED_PRODUCTS: {
    label: "Öne çıkan ürünler",
    emoji: "📦",
    desc: "Yalnızca «Öne çıkan» işaretli yayınlı ürünler; seçim yapmazsanız hepsi, seçerseniz sıra editördeki gibi (işaretsizler gösterilmez).",
  },
  FEATURED_CATEGORIES: {
    label: "Öne çıkan kategoriler",
    emoji: "🗂️",
    desc: "Seçili veya ilk kategoriler.",
  },
  RICH_TEXT: { label: "Metin bloğu", emoji: "📄", desc: "Başlık ve metin." },
  BLOG_TEASER: { label: "Blog özeti", emoji: "✍️", desc: "Son yazilar ozeti." },
  TESTIMONIALS: { label: "Yorumlar", emoji: "💬", desc: "Musteri gorusleri." },
  CTA: { label: "CTA kartı", emoji: "🚀", desc: "Tek çağrı kutusu." },
};

const KIND_GROUPS: { title: string; hint: string; kinds: HomeSectionKind[] }[] = [
  {
    title: "Üst vitrin",
    hint: "Ziyaretçinin ilk gördüğü sıra: hero, güven, listeler, hikâye, promo.",
    kinds: [
      "HERO",
      "TRUST_STRIP",
      "RAIL_BESTSELLERS",
      "RAIL_POPULAR",
      "RAIL_NEWEST",
      "STORY_STRIP",
      "PROMO_BANNER",
    ],
  },
  {
    title: "Ürün alanı",
    hint: "Mağaza ızgarası genelde vitrin bloklarının altında; tek satır ekleyin.",
    kinds: ["PRODUCT_CATALOG"],
  },
  {
    title: "İçerik ve koleksiyonlar",
    hint: "Afişler, metin, blog. (Öne çıkan ürün/kategori ve kategori ikon ızgarası şablonda kapalı; gerekirse aşağıdan ekleyebilirsiniz.)",
    kinds: ["BANNERS", "RICH_TEXT", "BLOG_TEASER"],
  },
  {
    title: "Sosyal kanıt ve kapanış",
    hint: "Yorum şeridi ve genel CTA.",
    kinds: ["TESTIMONIALS", "CTA"],
  },
  {
    title: "İsteğe bağlı ek tipler",
    hint: "Şablonda kullanılmayan; tekrar açmak isterseniz buradan ekleyin.",
    kinds: ["CATEGORY_ICONS", "FEATURED_PRODUCTS", "FEATURED_CATEGORIES"],
  },
];

function kindMeta(k: HomeSectionKind) {
  return KIND_META[k];
}

type ProductLite = { id: string; name: string; slug: string };
type CategoryLite = { id: string; name: string; slug: string };
type HeroSlideDraft = {
  title: string;
  subtitle: string;
  body: string;
  mediaUrl: string;
  ctaLabel: string;
  ctaHref: string;
};

function emptyHeroSlide(): HeroSlideDraft {
  return {
    title: "",
    subtitle: "",
    body: "",
    mediaUrl: "",
    ctaLabel: "",
    ctaHref: "",
  };
}

type Draft = {
  id?: string;
  kind: HomeSectionKind;
  title: string;
  subtitle: string;
  body: string;
  mediaUrl: string;
  ctaLabel: string;
  ctaHref: string;
  isVisible: boolean;
  sortOrder: number;
  productIds: string[];
  categoryIds: string[];
  heroSlides: HeroSlideDraft[];
};

function emptyDraft(): Draft {
  return {
    kind: "RICH_TEXT",
    title: "",
    subtitle: "",
    body: "",
    mediaUrl: "",
    ctaLabel: "",
    ctaHref: "",
    isVisible: true,
    sortOrder: 0,
    productIds: [],
    categoryIds: [],
    heroSlides: [emptyHeroSlide()],
  };
}

function draftFromSection(s: HomeSection): Draft {
  const cfg = (s.config ?? {}) as Record<string, unknown>;
  const productIds = Array.isArray(cfg.productIds)
    ? (cfg.productIds as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const categoryIds = Array.isArray(cfg.categoryIds)
    ? (cfg.categoryIds as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const heroSlidesFromConfig = Array.isArray(cfg.slides)
    ? (cfg.slides as unknown[])
        .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map((x) => ({
          title: typeof x.title === "string" ? x.title : "",
          subtitle: typeof x.eyebrow === "string" ? x.eyebrow : "",
          body: typeof x.body === "string" ? x.body : "",
          mediaUrl: typeof x.image === "string" ? x.image : "",
          ctaLabel: typeof x.ctaLabel === "string" ? x.ctaLabel : "",
          ctaHref: typeof x.cta === "string" ? x.cta : "",
        }))
    : [];
  const heroSlides =
    heroSlidesFromConfig.length > 0
      ? heroSlidesFromConfig
      : [
          {
            title: s.title ?? "",
            subtitle: s.subtitle ?? "",
            body: s.body ?? "",
            mediaUrl: s.mediaUrl ?? "",
            ctaLabel: s.ctaLabel ?? "",
            ctaHref: s.ctaHref ?? "",
          },
        ];
  const kind: HomeSectionKind = s.kind;
  return {
    id: s.id,
    kind,
    title: s.title ?? "",
    subtitle: s.subtitle ?? "",
    body: s.body ?? "",
    mediaUrl: s.mediaUrl ?? "",
    ctaLabel: s.ctaLabel ?? "",
    ctaHref: s.ctaHref ?? "",
    isVisible: s.isVisible,
    sortOrder: s.sortOrder,
    productIds,
    categoryIds,
    heroSlides,
  };
}

function buildConfig(d: Draft): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  if (d.kind === "HERO") {
    const slides = d.heroSlides
      .map((s) => ({
        title: s.title.trim(),
        eyebrow: s.subtitle.trim(),
        body: s.body.trim(),
        image: s.mediaUrl.trim(),
        ctaLabel: s.ctaLabel.trim() || "Keşfet",
        cta: s.ctaHref.trim() || "/shop",
      }))
      .filter((s) => s.title && s.image);
    if (slides.length > 0) base.slides = slides;
  }
  if (d.kind === "FEATURED_PRODUCTS") base.productIds = d.productIds;
  if (d.kind === "FEATURED_CATEGORIES") base.categoryIds = d.categoryIds;
  return base;
}

export function HomeEditor({ token }: { token: string }) {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [productSearch, setProductSearch] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [secs, prods, cats] = await Promise.all([
        adminFetch("/home-sections/admin", token) as Promise<HomeSection[]>,
        adminFetch("/products/admin", token) as Promise<ProductLite[]>,
        adminFetch("/categories", token) as Promise<CategoryLite[]>,
      ]);
      setSections(Array.isArray(secs) ? secs : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      const msg = formatAdminCaughtError(e, "İşlem başarısız");
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const ordered = useMemo(
    () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [sections],
  );

  const submitDraft = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const payloadBase = {
        title: draft.title.trim() || null,
        subtitle: draft.subtitle.trim() || null,
        body: draft.body.trim() || null,
        mediaUrl: draft.mediaUrl.trim() || null,
        ctaLabel: draft.ctaLabel.trim() || null,
        ctaHref: draft.ctaHref.trim() || null,
        config: Object.keys(buildConfig(draft)).length > 0 ? buildConfig(draft) : undefined,
        isVisible: draft.isVisible,
        sortOrder: draft.sortOrder,
      };
      const heroAnchor = draft.kind === "HERO" ? draft.heroSlides[0] ?? emptyHeroSlide() : null;
      const payload = {
        ...payloadBase,
        ...(heroAnchor
          ? {
              title: heroAnchor.title.trim() || null,
              subtitle: heroAnchor.subtitle.trim() || null,
              body: heroAnchor.body.trim() || null,
              mediaUrl: heroAnchor.mediaUrl.trim() || null,
              ctaLabel: heroAnchor.ctaLabel.trim() || null,
              ctaHref: heroAnchor.ctaHref.trim() || null,
            }
          : {}),
      };
      if (draft.id) {
        await adminFetch(`/home-sections/${draft.id}`, token, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/home-sections", token, {
          method: "POST",
          body: JSON.stringify({ kind: draft.kind, ...payload }),
        });
      }
      setDraft(emptyDraft());
      await load();
    } catch (e) {
      const msg = formatAdminCaughtError(e, "İşlem başarısız");
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }, [draft, token, load]);

  const edit = useCallback((s: HomeSection) => {
    setDraft(draftFromSection(s));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const remove = useCallback(
    async (id: string) => {
      if (!window.confirm("Bölüm silinsin mi?")) return;
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/home-sections/${id}`, token, { method: "DELETE" });
        await load();
      } catch (e) {
        const msg = formatAdminCaughtError(e, "İşlem başarısız");
        if (msg) setError(msg);
      } finally {
        setBusy(false);
      }
    },
    [token, load],
  );

  const toggleVisible = useCallback(
    async (s: HomeSection) => {
      setBusy(true);
      setError(null);
      try {
        await adminFetch(`/home-sections/${s.id}`, token, {
          method: "PATCH",
          body: JSON.stringify({ isVisible: !s.isVisible }),
        });
        await load();
      } catch (e) {
        const msg = formatAdminCaughtError(e, "İşlem başarısız");
        if (msg) setError(msg);
      } finally {
        setBusy(false);
      }
    },
    [token, load],
  );

  const move = useCallback(
    async (id: string, dir: -1 | 1) => {
      const ids = ordered.map((s) => s.id);
      const idx = ids.indexOf(id);
      if (idx < 0) return;
      const target = idx + dir;
      if (target < 0 || target >= ids.length) return;
      const next = [...ids];
      [next[idx], next[target]] = [next[target], next[idx]];
      setBusy(true);
      setError(null);
      try {
        await adminFetch("/home-sections/reorder", token, {
          method: "PATCH",
          body: JSON.stringify({ ids: next }),
        });
        await load();
      } catch (e) {
        const msg = formatAdminCaughtError(e, "İşlem başarısız");
        if (msg) setError(msg);
      } finally {
        setBusy(false);
      }
    },
    [ordered, token, load],
  );

  const togglePick = (list: string[], id: string, setter: (ids: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }, [products, productSearch]);

  const currentKindMeta = kindMeta(draft.kind);
  const updateHeroSlide = (index: number, patch: Partial<HeroSlideDraft>) => {
    setDraft((d) => ({
      ...d,
      heroSlides: d.heroSlides.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  return (
    <div className="space-y-6">
      {error && <Toast kind="error">{error}</Toast>}

      <AdminCard
        title={
          <span className="inline-flex items-center gap-2">
            {draft.id ? (
              <>
                <Icon.Pencil /> Bölümü düzenle
              </>
            ) : (
              <>
                <Icon.Plus /> Yeni bölüm
              </>
            )}
          </span>
        }
        description={`${currentKindMeta.emoji} ${currentKindMeta.label} — ${currentKindMeta.desc}`}
      >
        <div className="space-y-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Bölüm tipi
          </p>
          {KIND_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{group.hint}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {group.kinds.map((value) => {
                  const k = kindMeta(value);
                  const active = draft.kind === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, kind: value }))}
                      className={`group flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all duration-200 ease-smooth ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xl" aria-hidden>
                        {k.emoji}
                      </span>
                      <span className="text-sm font-semibold">{k.label}</span>
                      <span
                        className={`text-[10px] ${active ? "text-slate-300" : "text-slate-500"}`}
                      >
                        {k.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Field label="Üst etiket / alt başlık">
            <input
              className="input-soft"
              value={draft.subtitle}
              onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
              placeholder="Örn. Yeni sezon"
            />
          </Field>
          <Field label="Sıra">
            <input
              type="number"
              className="input-soft"
              value={draft.sortOrder}
              onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) || 0 }))}
            />
          </Field>
        </div>

        {draft.kind === "HERO" ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Hero slaytları ({draft.heroSlides.length})
              </p>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setDraft((d) => ({ ...d, heroSlides: [...d.heroSlides, emptyHeroSlide()] }))}
              >
                <Icon.Plus /> Slayt ekle
              </button>
            </div>
            {draft.heroSlides.map((slide, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">Slayt #{idx + 1}</p>
                  {draft.heroSlides.length > 1 ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-700 hover:text-rose-800"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          heroSlides: d.heroSlides.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      Sil
                    </button>
                  ) : null}
                </div>
                <Field label="Başlık">
                  <input
                    className="input-soft"
                    value={slide.title}
                    onChange={(e) => updateHeroSlide(idx, { title: e.target.value })}
                    placeholder="Görünen başlık"
                  />
                </Field>
                <Field label="Üst etiket" className="mt-3">
                  <input
                    className="input-soft"
                    value={slide.subtitle}
                    onChange={(e) => updateHeroSlide(idx, { subtitle: e.target.value })}
                    placeholder="Örn. Yeni sezon"
                  />
                </Field>
                <Field label="Gövde metni" className="mt-3">
                  <textarea
                    className="input-soft resize-y"
                    rows={3}
                    value={slide.body}
                    onChange={(e) => updateHeroSlide(idx, { body: e.target.value })}
                  />
                </Field>
                <AdminImageUpload
                  token={token}
                  label="Slayt görseli"
                  value={slide.mediaUrl}
                  onChange={(url) => updateHeroSlide(idx, { mediaUrl: url })}
                  hint="Önerilen oran 48:23 (≈2,09:1), örn. 1920×920, 2400×1150 veya 3840×1840. Masaüstünde arka plan üstten hizalı: logo/önemli detay üstte kalsın; hafif oran farkında kırpma alta gider. 16:9 veya 21:9 kullanırsanız ürünü orta–sağa yerleştirin. Kare/dikeyde üst-orta güvenli bölge kullanın."
                />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Field label="CTA etiketi">
                    <input
                      className="input-soft"
                      value={slide.ctaLabel}
                      onChange={(e) => updateHeroSlide(idx, { ctaLabel: e.target.value })}
                      placeholder="Örn. Şimdi keşfet"
                    />
                  </Field>
                  <Field label="CTA bağlantı">
                    <input
                      className="input-soft"
                      value={slide.ctaHref}
                      onChange={(e) => updateHeroSlide(idx, { ctaHref: e.target.value })}
                      placeholder="/shop"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <Field label="Başlık" className="mt-3">
              <input
                className="input-soft"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Görünen başlık"
              />
            </Field>

            <Field label="Gövde metni" className="mt-3">
              <textarea
                className="input-soft resize-y"
                rows={4}
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              />
            </Field>

            <AdminImageUpload
              token={token}
              label="Medya (isteğe bağlı)"
              value={draft.mediaUrl}
              onChange={(url) => setDraft((d) => ({ ...d, mediaUrl: url }))}
              hint="Bölüm tipine göre arka plan veya görsel."
            />

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="CTA etiketi">
                <input
                  className="input-soft"
                  value={draft.ctaLabel}
                  onChange={(e) => setDraft((d) => ({ ...d, ctaLabel: e.target.value }))}
                  placeholder="Örn. Şimdi keşfet"
                />
              </Field>
              <Field label="CTA bağlantı">
                <input
                  className="input-soft"
                  value={draft.ctaHref}
                  onChange={(e) => setDraft((d) => ({ ...d, ctaHref: e.target.value }))}
                  placeholder="/#urunler"
                />
              </Field>
            </div>
          </>
        )}

        {draft.kind !== "HERO" ? null : (
          <p className="mt-2 text-xs text-slate-500">
            Not: Hero için geçerli içerik slayt listesinden alınır; tek bir hero bölümünde birden fazla slayt ekleyebilirsiniz. Arka plan: 48:23 (ör. 3840×1840) ideal; diğer oranlarda kırpma olabilir.
          </p>
        )}

        {draft.kind === "FEATURED_PRODUCTS" && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Ürünler ({draft.productIds.length} seçili)
              </p>
              <input
                className="input-soft !w-48"
                placeholder="Ürün ara…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            <div className="mt-3 max-h-64 overflow-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              {filteredProducts.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">
                  {products.length === 0 ? "Önce ürün ekleyin." : "Sonuç yok."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredProducts.map((p) => {
                    const on = draft.productIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          togglePick(draft.productIds, p.id, (ids) =>
                            setDraft((d) => ({ ...d, productIds: ids })),
                          )
                        }
                        className="chip"
                        data-active={on || undefined}
                      >
                        {on && <Icon.Check className="h-3 w-3" />}
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {draft.kind === "FEATURED_CATEGORIES" && (
          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Kategoriler ({draft.categoryIds.length} seçili)
            </p>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              {categories.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">Önce kategori ekleyin.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const on = draft.categoryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          togglePick(draft.categoryIds, c.id, (ids) =>
                            setDraft((d) => ({ ...d, categoryIds: ids })),
                          )
                        }
                        className="chip"
                        data-active={on || undefined}
                      >
                        {on && <Icon.Check className="h-3 w-3" />}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <label className="mt-6 inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={draft.isVisible}
            onChange={(e) => setDraft((d) => ({ ...d, isVisible: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300"
          />
          Yayında
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitDraft()}
            className="btn-primary disabled:opacity-50"
          >
            <Icon.Check /> {draft.id ? "Güncelle" : "Oluştur"}
          </button>
          {draft.id && (
            <button
              type="button"
              onClick={() => setDraft(emptyDraft())}
              className="btn-ghost"
            >
              İptal
            </button>
          )}
        </div>
      </AdminCard>

      <AdminCard
        title="Bölüm sırası"
        description="Yukarıdan aşağıya anasayfa akışı. Ürün ızgarası (PRODUCT_CATALOG) yoksa, vitrin eski düzende öne çıkan bloklardan hemen önce otomatik eklenir."
      >
        {ordered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
            Henüz bölüm yok. Yukarıdan ilk bölümü ekleyin.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {ordered.map((s, i) => {
              const meta = kindMeta(s.kind);
              return (
                <li
                  key={s.id}
                  className="group flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition-all duration-200 ease-smooth hover:border-slate-300 hover:shadow-sm"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-xl"
                    aria-hidden
                  >
                    {meta.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">#{i + 1}</span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] uppercase text-slate-600">
                        {s.kind}
                      </span>
                      {!s.isVisible && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                          <Icon.EyeOff className="h-3 w-3" /> gizli
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-0.5 truncate text-sm font-semibold ${
                        s.isVisible ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {s.title ?? "(başlıksız)"}
                    </p>
                    {s.subtitle && (
                      <p className="truncate text-xs text-slate-500">{s.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void move(s.id, -1)}
                      disabled={i === 0}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                      aria-label="Yukarı"
                    >
                      <Icon.ArrowUp />
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(s.id, 1)}
                      disabled={i === ordered.length - 1}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                      aria-label="Aşağı"
                    >
                      <Icon.ArrowDown />
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleVisible(s)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {s.isVisible ? (
                        <>
                          <Icon.EyeOff /> Gizle
                        </>
                      ) : (
                        <>
                          <Icon.Eye /> Göster
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => edit(s)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-sky-600 px-2 text-xs font-semibold text-white hover:bg-sky-700"
                    >
                      <Icon.Pencil /> Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(s.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      <Icon.Trash /> Sil
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
