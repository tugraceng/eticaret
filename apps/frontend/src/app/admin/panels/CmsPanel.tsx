"use client";

import { useRef, type Dispatch, type SetStateAction } from "react";
import { adminUploadFile } from "../api";
import { formatAdminCaughtError } from "../admin-api-error";
import { AdminCard, Field, Icon } from "../ui";
import type { BlogPostRow } from "../types";

export function CmsPanel({
  token,
  busy,
  cmsTab,
  setCmsTab,
  editingBlogId,
  blogSlug,
  blogTitle,
  blogExcerpt,
  blogBody,
  blogPublish,
  setBlogSlug,
  setBlogTitle,
  setBlogExcerpt,
  setBlogBody,
  setBlogPublish,
  saveBlogPost,
  cancelBlogEdit,
  openBlogEditor,
  deleteBlogPost,
  svcSlug,
  svcTitle,
  svcSummary,
  svcDesc,
  setSvcSlug,
  setSvcTitle,
  setSvcSummary,
  setSvcDesc,
  createService,
  projSlug,
  projTitle,
  projSummary,
  projDesc,
  projGallery,
  setProjSlug,
  setProjTitle,
  setProjSummary,
  setProjDesc,
  setProjGallery,
  createProject,
  blogPosts,
}: {
  token: string;
  busy: boolean;
  cmsTab: "blog" | "services" | "projects" | "list";
  setCmsTab: Dispatch<SetStateAction<"blog" | "services" | "projects" | "list">>;
  editingBlogId: string | null;
  blogSlug: string;
  blogTitle: string;
  blogExcerpt: string;
  blogBody: string;
  blogPublish: boolean;
  setBlogSlug: Dispatch<SetStateAction<string>>;
  setBlogTitle: Dispatch<SetStateAction<string>>;
  setBlogExcerpt: Dispatch<SetStateAction<string>>;
  setBlogBody: Dispatch<SetStateAction<string>>;
  setBlogPublish: Dispatch<SetStateAction<boolean>>;
  saveBlogPost: () => Promise<void>;
  cancelBlogEdit: () => void;
  openBlogEditor: (id: string) => Promise<void>;
  deleteBlogPost: (id: string, title: string) => Promise<void>;
  svcSlug: string;
  svcTitle: string;
  svcSummary: string;
  svcDesc: string;
  setSvcSlug: Dispatch<SetStateAction<string>>;
  setSvcTitle: Dispatch<SetStateAction<string>>;
  setSvcSummary: Dispatch<SetStateAction<string>>;
  setSvcDesc: Dispatch<SetStateAction<string>>;
  createService: () => Promise<void>;
  projSlug: string;
  projTitle: string;
  projSummary: string;
  projDesc: string;
  projGallery: string;
  setProjSlug: Dispatch<SetStateAction<string>>;
  setProjTitle: Dispatch<SetStateAction<string>>;
  setProjSummary: Dispatch<SetStateAction<string>>;
  setProjDesc: Dispatch<SetStateAction<string>>;
  setProjGallery: Dispatch<SetStateAction<string>>;
  createProject: () => Promise<void>;
  blogPosts: BlogPostRow[];
}) {
  const projGalFileRef = useRef<HTMLInputElement>(null);

  const tabBtn = (id: typeof cmsTab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setCmsTab(id)}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
        cmsTab === id
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Ne eklemek istiyorsunuz?</p>
        <p className="mt-1 text-xs text-slate-500">
          Önce türü seçin; aşağıda yalnızca o form görünür. Blog listesini görmek için son sekmeye geçin.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tabBtn("blog", "Blog yazısı")}
          {tabBtn("services", "Hizmet sayfası")}
          {tabBtn("projects", "Proje / portföy")}
          {tabBtn("list", "Kayıtlı blog yazıları")}
        </div>
      </div>

      {cmsTab === "blog" ? (
        <AdminCard
          title={editingBlogId ? "Blog yazısını düzenle" : "Yeni blog yazısı"}
          description={
            editingBlogId
              ? "Değişiklikleri kaydedin veya iptal ile yeni yazı formuna dönün."
              : "Adres çubuğunda görünecek kısa slug (ör. yeni-sezon) ve içerik. SEO için başlık ve özet doldurun."
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slug" hint="Küçük harf, tire ile kelimeler (ör. yeni-sezon)">
              <input className="input-soft" value={blogSlug} onChange={(e) => setBlogSlug(e.target.value)} />
            </Field>
            <Field label="Başlık">
              <input className="input-soft" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} />
            </Field>
          </div>
          <Field label="Özet" className="mt-3">
            <input
              className="input-soft"
              value={blogExcerpt}
              onChange={(e) => setBlogExcerpt(e.target.value)}
              placeholder="İsteğe bağlı kısa özet"
            />
          </Field>
          <Field label="İçerik" className="mt-3">
            <textarea
              className="input-soft resize-y"
              rows={6}
              value={blogBody}
              onChange={(e) => setBlogBody(e.target.value)}
              placeholder="Markdown veya düz metin"
            />
          </Field>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={blogPublish}
              onChange={(e) => setBlogPublish(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Yayında (işaretli değilse taslak kalır)
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || !blogSlug.trim() || !blogTitle.trim() || !blogBody.trim()}
              onClick={() => void saveBlogPost()}
              className="btn-primary disabled:opacity-50"
            >
              <Icon.Check /> {editingBlogId ? "Değişiklikleri kaydet" : "Yazıyı kaydet"}
            </button>
            {editingBlogId ? (
              <button type="button" disabled={busy} onClick={cancelBlogEdit} className="btn-ghost disabled:opacity-50">
                İptal — yeni yazı
              </button>
            ) : null}
          </div>
        </AdminCard>
      ) : null}

      {cmsTab === "services" ? (
        <AdminCard title="Yeni hizmet sayfası" description="Sitedeki /hizmetler bölümünde listelenir; slug kısa ve benzersiz olsun.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slug">
              <input className="input-soft" value={svcSlug} onChange={(e) => setSvcSlug(e.target.value)} />
            </Field>
            <Field label="Başlık">
              <input className="input-soft" value={svcTitle} onChange={(e) => setSvcTitle(e.target.value)} />
            </Field>
          </div>
          <Field label="Özet" className="mt-3">
            <input className="input-soft" value={svcSummary} onChange={(e) => setSvcSummary(e.target.value)} />
          </Field>
          <Field label="Açıklama" className="mt-3">
            <textarea
              className="input-soft resize-y"
              rows={5}
              value={svcDesc}
              onChange={(e) => setSvcDesc(e.target.value)}
            />
          </Field>
          <div className="mt-4">
            <button
              type="button"
              disabled={busy || !svcSlug.trim() || !svcTitle.trim() || !svcDesc.trim()}
              onClick={() => void createService()}
              className="btn-primary disabled:opacity-50"
            >
              <Icon.Plus /> Hizmeti oluştur
            </button>
          </div>
        </AdminCard>
      ) : null}

      {cmsTab === "projects" ? (
        <AdminCard
          title="Yeni proje"
          description="Galeri için görsel adreslerini satır satır yazın veya dosya yükleyerek URL ekleyin."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slug">
              <input className="input-soft" value={projSlug} onChange={(e) => setProjSlug(e.target.value)} />
            </Field>
            <Field label="Başlık">
              <input className="input-soft" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} />
            </Field>
          </div>
          <Field label="Özet" className="mt-3">
            <input className="input-soft" value={projSummary} onChange={(e) => setProjSummary(e.target.value)} />
          </Field>
          <Field label="Açıklama" className="mt-3">
            <textarea
              className="input-soft resize-y"
              rows={5}
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
            />
          </Field>
          <Field label="Galeri URL'leri" className="mt-3">
            <textarea
              className="input-soft resize-y font-mono text-xs"
              rows={3}
              value={projGallery}
              onChange={(e) => setProjGallery(e.target.value)}
              placeholder="Her satıra bir görsel adresi (yüklenen dosyalar otomatik eklenir)"
            />
          </Field>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              ref={projGalFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.ico,image/x-icon,image/vnd.microsoft.icon"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                void (async () => {
                  try {
                    const { url } = await adminUploadFile(token, f);
                    setProjGallery((g) => (g.trim() ? `${g.trim()}\n` : "") + url);
                  } catch (err) {
                    const msg = formatAdminCaughtError(err, "Yükleme başarısız");
                    if (msg) window.alert(msg);
                  }
                })();
              }}
            />
            <button
              type="button"
              onClick={() => projGalFileRef.current?.click()}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Görsel yükle (listeye ekle)
            </button>
          </div>
          <div className="mt-4">
            <button
              type="button"
              disabled={busy || !projSlug.trim() || !projTitle.trim() || !projDesc.trim()}
              onClick={() => void createProject()}
              className="btn-primary disabled:opacity-50"
            >
              <Icon.Plus /> Projeyi oluştur
            </button>
          </div>
        </AdminCard>
      ) : null}

      {cmsTab === "list" ? (
        <AdminCard
          title="Kayıtlı blog yazıları"
          description={`${blogPosts.length} yazı — düzenlemek veya silmek için satırdaki düğmeleri kullanın.`}
        >
          {blogPosts.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">Kayıt yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {blogPosts.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-900">{p.title}</span>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">{p.slug}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          p.publishedAt ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.publishedAt ? "Yayında" : "Taslak"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void openBlogEditor(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Icon.Pencil className="h-3.5 w-3.5" /> Düzenle
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void deleteBlogPost(p.id, p.title)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Icon.Trash className="h-3.5 w-3.5" /> Sil
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      ) : null}
    </div>
  );
}
