"use client";

import { Field } from "@/app/admin/ui";

export type SeoFormValues = {
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string;
  seoCanonicalUrl: string;
  seoOgImageUrl: string;
  seoNoIndex: boolean;
};

export const emptySeoFormValues = (): SeoFormValues => ({
  metaTitle: "",
  metaDescription: "",
  seoKeywords: "",
  seoCanonicalUrl: "",
  seoOgImageUrl: "",
  seoNoIndex: false,
});

export type SeoApiFields = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  seoKeywords?: string | null;
  seoCanonicalUrl?: string | null;
  seoOgImageUrl?: string | null;
  seoNoIndex?: boolean;
};

export function seoFormFromApi(row?: SeoApiFields | null): SeoFormValues {
  return {
    metaTitle: row?.metaTitle ?? "",
    metaDescription: row?.metaDescription ?? "",
    seoKeywords: row?.seoKeywords ?? "",
    seoCanonicalUrl: row?.seoCanonicalUrl ?? "",
    seoOgImageUrl: row?.seoOgImageUrl ?? "",
    seoNoIndex: Boolean(row?.seoNoIndex),
  };
}

/** API'ye gönderilecek normalize edilmiş SEO alanları. */
export function seoFormToApi(values: SeoFormValues): SeoApiFields {
  return {
    metaTitle: values.metaTitle.trim() || null,
    metaDescription: values.metaDescription.trim() || null,
    seoKeywords: values.seoKeywords.trim() || null,
    seoCanonicalUrl: values.seoCanonicalUrl.trim() || null,
    seoOgImageUrl: values.seoOgImageUrl.trim() || null,
    seoNoIndex: values.seoNoIndex,
  };
}

type Props = {
  values: SeoFormValues;
  onChange: (patch: Partial<SeoFormValues>) => void;
  titleHint?: string;
  descriptionHint?: string;
};

/** Ürün, kategori ve CMS sayfalarında ortak SEO formu. */
export function SeoFieldsForm({
  values,
  onChange,
  titleHint = "Boşsa sayfa/ürün adı kullanılır.",
  descriptionHint = "Boşsa açıklama metninin kısaltılmış hali kullanılır.",
}: Props) {
  return (
    <div className="space-y-4">
      <Field label="SEO başlık" hint={titleHint}>
        <input
          className="input-soft"
          value={values.metaTitle}
          onChange={(e) => onChange({ metaTitle: e.target.value })}
          maxLength={200}
        />
      </Field>
      <Field label="SEO açıklama" hint={descriptionHint}>
        <textarea
          className="input-soft min-h-[88px] resize-y"
          value={values.metaDescription}
          onChange={(e) => onChange({ metaDescription: e.target.value })}
          maxLength={8000}
        />
      </Field>
      <Field label="Anahtar kelimeler" hint="Virgülle ayırın.">
        <input
          className="input-soft"
          value={values.seoKeywords}
          onChange={(e) => onChange({ seoKeywords: e.target.value })}
          maxLength={4000}
        />
      </Field>
      <Field label="Canonical URL" hint="Boşsa sayfanın varsayılan adresi kullanılır.">
        <input
          className="input-soft font-mono text-sm"
          value={values.seoCanonicalUrl}
          onChange={(e) => onChange({ seoCanonicalUrl: e.target.value })}
          placeholder="https://…"
        />
      </Field>
      <Field label="OG görsel URL" hint="Boşsa ürün ana görseli veya site varsayılanı.">
        <input
          className="input-soft font-mono text-sm"
          value={values.seoOgImageUrl}
          onChange={(e) => onChange({ seoOgImageUrl: e.target.value })}
          placeholder="/uploads/… veya https://…"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          checked={values.seoNoIndex}
          onChange={(e) => onChange({ seoNoIndex: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300"
        />
        Arama motorlarında indexleme (noindex — işaretliyse sayfa indexlenmez)
      </label>
    </div>
  );
}
