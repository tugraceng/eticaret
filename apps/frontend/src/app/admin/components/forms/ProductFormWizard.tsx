"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch, adminUploadFile } from "../../api";
import { AdminCard, Field, Icon } from "../../ui";
import { parseTryToCents, parseTryToCentsOptional } from "../../utils/money";
import { slugifyTr } from "../../utils/slug";

type Cat = { id: string; name: string; slug: string };

type VariantDraft = {
  label: string;
  sku: string;
  priceTry: string;
  stock: string;
  trackStock: boolean;
  active: boolean;
};

const STEPS = ["Temel bilgiler", "Fiyat ve stok", "Görseller", "Varyantlar", "SEO", "Yayınlama"] as const;

export type ProductFormWizardProps = {
  token: string;
  categories: Cat[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onFinished: () => void;
};

export function ProductFormWizard({ token, categories, onSuccess, onError, onFinished }: ProductFormWizardProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const slugTouched = useRef(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  const [priceTry, setPriceTry] = useState("99,99");
  const [compareTry, setCompareTry] = useState("");
  const [stockStr, setStockStr] = useState("10");
  const [sku, setSku] = useState("");
  const [trackStock, setTrackStock] = useState(true);
  const [showPublicStockCount, setShowPublicStockCount] = useState(true);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [firstImageAlt, setFirstImageAlt] = useState("");

  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [variantLabel, setVariantLabel] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [variantPriceTry, setVariantPriceTry] = useState("");
  const [variantStock, setVariantStock] = useState("0");
  const [variantTrack, setVariantTrack] = useState(true);
  const [variantActive, setVariantActive] = useState(true);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const dirty =
    name.trim() !== "" ||
    slug.trim() !== "" ||
    description.trim() !== "" ||
    imageFiles.length > 0 ||
    variants.length > 0 ||
    variantLabel.trim() !== "";

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty || submitting) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, submitting]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [imagePreviews]);

  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched.current) setSlug(slugifyTr(v));
  };

  const onSlugChange = (v: string) => {
    slugTouched.current = true;
    setSlug(v);
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    setImageFiles((prev) => [...prev, ...arr]);
    setImagePreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
  }, []);

  const removeImageAt = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => {
      const u = prev[idx];
      if (u) URL.revokeObjectURL(u);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const addVariantRow = () => {
    if (!variantLabel.trim()) {
      onError("Varyant için en az etiket girin (örn. renk veya beden).");
      return;
    }
    const st = Math.max(0, parseInt(variantStock, 10) || 0);
    setVariants((prev) => [
      ...prev,
      {
        label: variantLabel.trim(),
        sku: variantSku.trim(),
        priceTry: variantPriceTry.trim(),
        stock: String(st),
        trackStock: variantTrack,
        active: variantActive,
      },
    ]);
    setVariantLabel("");
    setVariantSku("");
    setVariantPriceTry("");
    setVariantStock("0");
    setVariantTrack(true);
    setVariantActive(true);
  };

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!name.trim()) {
        onError("Ürün adı zorunludur.");
        return false;
      }
      if (!slug.trim() || slug.trim().length < 2) {
        onError("Adres (slug) en az 2 karakter olmalıdır.");
        return false;
      }
    }
    if (s === 2) {
      const p = parseTryToCents(priceTry);
      if (!p.ok) {
        onError(p.message);
        return false;
      }
      const c = parseTryToCentsOptional(compareTry);
      if (!c.ok) {
        onError(c.message);
        return false;
      }
      const st = parseInt(stockStr, 10);
      if (!Number.isFinite(st) || st < 0) {
        onError("Stok miktarı negatif olamaz.");
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((x) => Math.min(6, x + 1));
  };

  const goPrev = () => setStep((x) => Math.max(1, x - 1));

  const finish = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      setStep(1);
      return;
    }
    const price = parseTryToCents(priceTry);
    const comp = parseTryToCentsOptional(compareTry);
    if (!price.ok || !comp.ok) return;
    const st = Math.max(0, parseInt(stockStr, 10) || 0);

    setSubmitting(true);
    try {
      const created = (await adminFetch("/products", token, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim() || undefined,
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
          seoKeywords: seoKeywords.trim() || null,
          priceCents: price.cents,
          compareAtCents: comp.cents,
          sku: sku.trim() || null,
          trackStock,
          stock: st,
          categoryId: categoryId || undefined,
          isPublished,
          showPublicStockCount,
          isFeatured,
          isNew,
        }),
      })) as { id: string; slug?: string };

      const id = created?.id;
      if (!id) throw new Error("Ürün oluşturulamadı.");

      const requestedSlug = slug.trim().toLowerCase();
      const finalSlug = (created.slug ?? requestedSlug).trim();

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const { url } = await adminUploadFile(token, file);
        await adminFetch(`/products/${id}/images`, token, {
          method: "POST",
          body: JSON.stringify({
            url,
            alt: i === 0 && firstImageAlt.trim() ? firstImageAlt.trim() : undefined,
          }),
        });
      }

      for (const v of variants) {
        let priceCents: number | undefined;
        const pt = v.priceTry.trim();
        if (pt !== "") {
          const parsed = parseTryToCents(pt);
          if (!parsed.ok) throw new Error(parsed.message);
          priceCents = parsed.cents;
        }
        await adminFetch(`/products/${id}/variants`, token, {
          method: "POST",
          body: JSON.stringify({
            label: v.label,
            ...(v.sku ? { sku: v.sku } : {}),
            ...(priceCents !== undefined ? { priceCents } : {}),
            stock: Math.max(0, parseInt(v.stock, 10) || 0),
            trackStock: v.trackStock,
            isActive: v.active,
          }),
        });
      }

      onSuccess(
        finalSlug !== requestedSlug
          ? `Ürün oluşturuldu. Adres (slug) dolu olduğu için mağazada "${finalSlug}" olarak kaydedildi.`
          : "Ürün başarıyla oluşturuldu.",
      );
      slugTouched.current = false;
      setStep(1);
      setName("");
      setSlug("");
      setCategoryId("");
      setDescription("");
      setPriceTry("99,99");
      setCompareTry("");
      setStockStr("10");
      setSku("");
      setTrackStock(true);
      setShowPublicStockCount(true);
      setImageFiles([]);
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
      setImagePreviews([]);
      setFirstImageAlt("");
      setVariants([]);
      setMetaTitle("");
      setMetaDescription("");
      setSeoKeywords("");
      setIsFeatured(false);
      setIsNew(false);
      onFinished();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Ürün kaydedilirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminCard
      title="Yeni ürün — adım adım"
      description="Her adımı tamamlayın; son adımda ürün oluşturulur, görseller yüklenir ve seçenekler eklenir."
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (n < step) setStep(n);
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-sky-500 bg-sky-50 text-sky-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                  active ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {n}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {step === 1 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ürün adı" hint="Slug otomatik üretilir; isterseniz sonraki alanı kendiniz düzenleyin.">
            <input
              className="input-soft"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Örn. El yapımı anahtarlık"
            />
          </Field>
          <Field label="Adres (slug)">
            <input
              className="input-soft font-mono text-sm"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="el-yapimi-anahtarlik"
            />
          </Field>
          <Field label="Kategori">
            <select className="input-soft" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— Seçin —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Kısa açıklama">
              <textarea
                className="input-soft min-h-[100px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Müşterinin göreceği kısa tanım (isteğe bağlı)."
              />
            </Field>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Satış fiyatı (TRY)" hint="Virgül veya nokta kullanabilirsiniz.">
            <input className="input-soft" value={priceTry} onChange={(e) => setPriceTry(e.target.value)} />
          </Field>
          <Field label="İndirim öncesi / karşılaştırma fiyatı" hint="Boş bırakılabilir. İndirim gösterimi için kullanılır.">
            <input className="input-soft" value={compareTry} onChange={(e) => setCompareTry(e.target.value)} placeholder="Örn. 249,00" />
          </Field>
          <Field label="Stok adedi">
            <input
              className="input-soft"
              type="number"
              min={0}
              step={1}
              value={stockStr}
              onChange={(e) => setStockStr(e.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
          <Field label="SKU" hint="Depo / barkod kodu (isteğe bağlı).">
            <input className="input-soft font-mono text-sm" value={sku} onChange={(e) => setSku(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={trackStock}
              onChange={(e) => setTrackStock(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Stok takibi açık (satışta stok düşer)
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={showPublicStockCount}
              onChange={(e) => setShowPublicStockCount(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
            />
            <span>
              Mağazada stok <strong className="font-semibold text-slate-800">adedini</strong> göster
            </span>
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Görselleri sürükleyip bırakın veya dosya seçin. İlk görsel vitrinde öne çıkar; ilk görsel için alt metin önerilir.
          </p>
          <div
            className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="wiz-img"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <label htmlFor="wiz-img" className="cursor-pointer text-sm font-semibold text-sky-800 hover:underline">
              Dosya seç
            </label>
            <p className="mt-2 text-xs text-slate-500">PNG, JPG, WebP — birkaç görsel ekleyebilirsiniz.</p>
          </div>
          {imagePreviews.length > 0 ? (
            <ul className="flex flex-wrap gap-3">
              {imagePreviews.map((src, idx) => (
                <li key={src} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-24 w-24 rounded-xl object-cover ring-1 ring-slate-200" />
                  <button
                    type="button"
                    className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-rose-600 text-xs text-white shadow"
                    onClick={() => removeImageAt(idx)}
                    aria-label="Kaldır"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <Field label="İlk görsel alt metni (erişilebilirlik)" hint="İlk yüklenen görsele uygulanır.">
            <input className="input-soft" value={firstImageAlt} onChange={(e) => setFirstImageAlt(e.target.value)} />
          </Field>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Renk, beden veya model gibi seçenekler ekleyin. Boş bırakırsanız tek varyantlı ürün olarak kalır.
          </p>
          {variants.length > 0 ? (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {variants.map((v, i) => (
                <li key={`${v.label}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-900">{v.label}</span>
                  <span className="text-xs text-slate-500">
                    Stok {v.stock}
                    {v.priceTry.trim() ? ` · ${v.priceTry} ₺` : ""}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-600"
                    onClick={() => setVariants((prev) => prev.filter((_, j) => j !== i))}
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Henüz seçenek eklenmedi — atlayabilirsiniz.</p>
          )}
          <div className="rounded-xl border border-dashed border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Seçenek ekle</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Etiket">
                <input
                  className="input-soft text-sm"
                  value={variantLabel}
                  onChange={(e) => setVariantLabel(e.target.value)}
                  placeholder="Örn. L — Siyah"
                />
              </Field>
              <Field label="SKU">
                <input className="input-soft text-sm" value={variantSku} onChange={(e) => setVariantSku(e.target.value)} />
              </Field>
              <Field label="Fiyat (boş = taban fiyat)">
                <input className="input-soft text-sm" value={variantPriceTry} onChange={(e) => setVariantPriceTry(e.target.value)} />
              </Field>
              <Field label="Stok">
                <input
                  className="input-soft text-sm"
                  type="number"
                  min={0}
                  value={variantStock}
                  onChange={(e) => setVariantStock(e.target.value.replace(/[^\d]/g, ""))}
                />
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input type="checkbox" checked={variantTrack} onChange={(e) => setVariantTrack(e.target.checked)} className="rounded border-slate-300" />
                Stok takip
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input type="checkbox" checked={variantActive} onChange={(e) => setVariantActive(e.target.checked)} className="rounded border-slate-300" />
                Aktif
              </label>
              <button type="button" onClick={addVariantRow} className="btn-ghost !py-1.5 !px-3 text-xs">
                <Icon.Plus /> Listeye ekle
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Boş bıraktığınız alanlarda mağaza, ürün adı ve açıklamadan otomatik özet üretir. Anahtar kelimeleri
            virgülle ayırın.
          </p>
          <Field label="Meta başlık (isteğe bağlı)" hint="Arama sonuçlarında görünen başlık; önerilen en fazla ~60 karakter.">
            <input
              className="input-soft"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Boşsa ürün adı kullanılır"
              maxLength={200}
            />
          </Field>
          <Field label="Meta açıklama (isteğe bağlı)" hint="Arama snippet&apos;i; önerilen ~150–160 karakter.">
            <textarea
              className="input-soft min-h-[88px] resize-y"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Boşsa ürün açıklamasının kısaltması kullanılır"
              maxLength={8000}
            />
          </Field>
          <Field label="Ek anahtar kelimeler (isteğe bağlı)" hint="Virgülle ayırın. Örn. el yapımı, hediye, doğal ahşap">
            <input
              className="input-soft"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="örn. hediye, el yapımı"
              maxLength={4000}
            />
          </Field>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Ürün yayında olsun (işaretli değilse taslak olarak kaydedilir)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Öne çıkan rozeti (katalog / vitrin filtrelerinde kullanılabilir)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Yeni ürün rozeti
          </label>
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Ana sayfa vitrin blokları ayrıca <strong className="text-slate-800">Ana sayfa vitrini</strong> düzeninden yönetilir;
            rozetler ürün kartlarında ve filtrelerde görünür.
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
        <div className="flex gap-2">
          {step > 1 ? (
            <button type="button" onClick={goPrev} className="btn-ghost" disabled={submitting}>
              ← Geri
            </button>
          ) : null}
        </div>
        <div className="flex gap-2">
          {step < 6 ? (
            <button type="button" onClick={goNext} className="btn-primary" disabled={submitting}>
              İleri
            </button>
          ) : (
            <button type="button" onClick={() => void finish()} className="btn-primary" disabled={submitting}>
              {submitting ? "Kaydediliyor…" : "Ürünü oluştur"}
            </button>
          )}
        </div>
      </div>
    </AdminCard>
  );
}
