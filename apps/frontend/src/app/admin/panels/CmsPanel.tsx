"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { adminFetch, adminUploadFile } from "../api";
import { formatAdminCaughtError } from "../admin-api-error";
import { AdminCard, Field, Icon } from "../ui";
import type { BlogPostRow, CmsProjectRow, CmsServiceRow } from "../types";

const ABOUT_DEFAULT_PILLARS: Array<{ icon: string; title: string; body: string }> = [
  {
    icon: "🎯",
    title: "Misyon",
    body: "Müşterilerimize kaliteli ürünler sunmak ve üstün bir alışveriş deneyimi yaşatmak.",
  },
  {
    icon: "🌱",
    title: "Vizyon",
    body: "Sektörümüzde öncü ve yenilikçi bir marka olarak müşteri memnuniyetini en üst seviyede tutmak.",
  },
  {
    icon: "🤝",
    title: "Değerler",
    body: "Şeffaflık, güvenilirlik ve sürekli iyileşme. Her kararı müşteri değeri üzerinden alıyoruz.",
  },
];

const ABOUT_DEFAULT_BIZ_TITLE = "Ekibimiz ve yaklaşımımız";
const ABOUT_DEFAULT_BIZ_BODY =
  "Deneyimli bir ekiple ürün, tasarım ve operasyonu bir arada düşünüyoruz. Şeffaf iletişim ve ölçülebilir teslimatlarla mağazanızın büyümesine odaklanıyoruz.";

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
  svcIconUrl,
  svcSortOrder,
  setSvcIconUrl,
  setSvcSortOrder,
  createService,
  editingServiceId,
  cancelServiceEdit,
  openServiceEditor,
  deleteService,
  cmsServices,
  projSlug,
  projTitle,
  projSummary,
  projDesc,
  projGallery,
  projCompletedAt,
  setProjCompletedAt,
  setProjSlug,
  setProjTitle,
  setProjSummary,
  setProjDesc,
  setProjGallery,
  createProject,
  editingProjectId,
  cancelProjectEdit,
  openProjectEditor,
  deleteProject,
  cmsProjects,
  blogPosts,
}: {
  token: string;
  busy: boolean;
  cmsTab: "blog" | "about" | "services" | "projects" | "list" | "pages";
  setCmsTab: Dispatch<SetStateAction<"blog" | "about" | "services" | "projects" | "list" | "pages">>;
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
  svcIconUrl: string;
  svcSortOrder: string;
  setSvcSlug: Dispatch<SetStateAction<string>>;
  setSvcTitle: Dispatch<SetStateAction<string>>;
  setSvcSummary: Dispatch<SetStateAction<string>>;
  setSvcDesc: Dispatch<SetStateAction<string>>;
  setSvcIconUrl: Dispatch<SetStateAction<string>>;
  setSvcSortOrder: Dispatch<SetStateAction<string>>;
  createService: () => Promise<void>;
  editingServiceId: string | null;
  cancelServiceEdit: () => void;
  openServiceEditor: (s: CmsServiceRow) => void;
  deleteService: (id: string, title: string) => Promise<void>;
  cmsServices: CmsServiceRow[];
  projSlug: string;
  projTitle: string;
  projSummary: string;
  projDesc: string;
  projGallery: string;
  projCompletedAt: string;
  setProjCompletedAt: Dispatch<SetStateAction<string>>;
  setProjSlug: Dispatch<SetStateAction<string>>;
  setProjTitle: Dispatch<SetStateAction<string>>;
  setProjSummary: Dispatch<SetStateAction<string>>;
  setProjDesc: Dispatch<SetStateAction<string>>;
  setProjGallery: Dispatch<SetStateAction<string>>;
  createProject: () => Promise<void>;
  editingProjectId: string | null;
  cancelProjectEdit: () => void;
  openProjectEditor: (p: CmsProjectRow) => void;
  deleteProject: (id: string, title: string) => Promise<void>;
  cmsProjects: CmsProjectRow[];
  blogPosts: BlogPostRow[];
}) {
  const projGalFileRef = useRef<HTMLInputElement>(null);
  const svcIconFileRef = useRef<HTMLInputElement>(null);

  const [pageBusy, setPageBusy] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [pagePublish, setPagePublish] = useState(true);
  const [aboutLead, setAboutLead] = useState("");
  const [aboutBody, setAboutBody] = useState("");
  const [aboutBizTitle, setAboutBizTitle] = useState(ABOUT_DEFAULT_BIZ_TITLE);
  const [aboutBizBody, setAboutBizBody] = useState(ABOUT_DEFAULT_BIZ_BODY);
  const [pillars, setPillars] = useState(() => ABOUT_DEFAULT_PILLARS.map((p) => ({ ...p })));
  const [svcEyebrow, setSvcEyebrow] = useState("");
  const [svcIntro, setSvcIntro] = useState("");

  useEffect(() => {
    if (!token) return;
    if (cmsTab !== "about" && cmsTab !== "pages") return;
    const slug = cmsTab === "about" ? "about" : "services-index";
    let cancelled = false;
    setPageBusy(true);
    void (async () => {
      try {
        const raw = (await adminFetch(`/cms/admin/pages/${slug}`, token)) as {
          title?: string;
          isPublished?: boolean;
          content?: unknown;
        } | null;
        if (cancelled) return;
        setPageTitle(raw?.title ?? (slug === "about" ? "Hakkımızda" : "Hizmetler"));
        setPagePublish(raw?.isPublished !== false);
        const cr =
          raw?.content && typeof raw.content === "object" && !Array.isArray(raw.content)
            ? (raw.content as Record<string, unknown>)
            : {};
        if (slug === "about") {
          setAboutLead(typeof cr.lead === "string" ? cr.lead : "");
          setAboutBody(typeof cr.body === "string" ? cr.body : "");
          const biz =
            cr.bizKimiz && typeof cr.bizKimiz === "object" && !Array.isArray(cr.bizKimiz)
              ? (cr.bizKimiz as Record<string, unknown>)
              : {};
          setAboutBizTitle(typeof biz.title === "string" ? biz.title : ABOUT_DEFAULT_BIZ_TITLE);
          setAboutBizBody(typeof biz.body === "string" ? biz.body : ABOUT_DEFAULT_BIZ_BODY);
          const arr = Array.isArray(cr.pillars) ? cr.pillars : [];
          setPillars(
            ABOUT_DEFAULT_PILLARS.map((def, i) => {
              const rawP = arr[i];
              const o =
                rawP && typeof rawP === "object" && !Array.isArray(rawP)
                  ? (rawP as Record<string, unknown>)
                  : {};
              return {
                icon: typeof o.icon === "string" ? o.icon : def.icon,
                title: typeof o.title === "string" ? o.title : def.title,
                body: typeof o.body === "string" ? o.body : def.body,
              };
            }),
          );
        } else {
          setSvcEyebrow(typeof cr.eyebrow === "string" ? cr.eyebrow : "");
          setSvcIntro(typeof cr.intro === "string" ? cr.intro : "");
        }
      } catch (e) {
        if (!cancelled) {
          const msg = formatAdminCaughtError(e, "Sayfa yüklenemedi");
          if (msg) window.alert(msg);
        }
      } finally {
        if (!cancelled) setPageBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cmsTab, token]);

  const saveStaticPage = async (slug: "about" | "services-index") => {
    setPageBusy(true);
    try {
      const content =
        slug === "about"
          ? {
              lead: aboutLead.trim(),
              body: aboutBody.trim(),
              bizKimiz: {
                title: aboutBizTitle.trim(),
                body: aboutBizBody.trim(),
              },
              pillars: pillars.map((p) => ({
                icon: p.icon.trim(),
                title: p.title.trim(),
                body: p.body.trim(),
              })),
            }
          : { eyebrow: svcEyebrow.trim(), intro: svcIntro.trim() };
      await adminFetch(`/cms/pages/${slug}`, token, {
        method: "PUT",
        body: JSON.stringify({
          slug,
          title: pageTitle.trim() || (slug === "about" ? "Hakkımızda" : "Hizmetler"),
          content,
          isPublished: pagePublish,
        }),
      });
      window.alert("Sayfa kaydedildi.");
    } catch (e) {
      const msg = formatAdminCaughtError(e, "Kayıt başarısız");
      if (msg) window.alert(msg);
    } finally {
      setPageBusy(false);
    }
  };

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
          Önce türü seçin; aşağıda yalnızca o form görünür. Hakkımızda ve hizmetler vitrin metni ayrı sekmelerdedir.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tabBtn("blog", "Blog yazısı")}
          {tabBtn("about", "Hakkımızda")}
          {tabBtn("services", "Hizmet sayfası")}
          {tabBtn("projects", "Proje / portföy")}
          {tabBtn("pages", "Hizmetler vitrin metni")}
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
        <>
          <AdminCard
            title={editingServiceId ? "Hizmeti düzenle" : "Yeni hizmet"}
            description="Tüm hizmetler sitede tek sayfada alt alta listelenir. Kapak için görsel URL’si veya dosya yükleyin; sıra küçük sayı önce gelir."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Slug">
                <input className="input-soft" value={svcSlug} onChange={(e) => setSvcSlug(e.target.value)} />
              </Field>
              <Field label="Başlık">
                <input className="input-soft" value={svcTitle} onChange={(e) => setSvcTitle(e.target.value)} />
              </Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Sıra" hint="Listede önce göstermek için düşük sayı (örn. 0, 10, 20).">
                <input
                  className="input-soft"
                  type="number"
                  value={svcSortOrder}
                  onChange={(e) => setSvcSortOrder(e.target.value)}
                />
              </Field>
              <Field label="Kapak / ikon URL" hint="İsteğe bağlı; vitrinde geniş görsel olarak kullanılır.">
                <input className="input-soft" value={svcIconUrl} onChange={(e) => setSvcIconUrl(e.target.value)} />
              </Field>
            </div>
            <div className="mt-2">
              <input
                ref={svcIconFileRef}
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
                      setSvcIconUrl(url);
                    } catch (err) {
                      const msg = formatAdminCaughtError(err, "Yükleme başarısız");
                      if (msg) window.alert(msg);
                    }
                  })();
                }}
              />
              <button
                type="button"
                onClick={() => svcIconFileRef.current?.click()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                Kapak görseli yükle
              </button>
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
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !svcSlug.trim() || !svcTitle.trim() || !svcDesc.trim()}
                onClick={() => void createService()}
                className="btn-primary disabled:opacity-50"
              >
                <Icon.Check /> {editingServiceId ? "Değişiklikleri kaydet" : "Hizmeti oluştur"}
              </button>
              {editingServiceId ? (
                <button type="button" disabled={busy} onClick={cancelServiceEdit} className="btn-ghost disabled:opacity-50">
                  İptal — yeni hizmet
                </button>
              ) : null}
            </div>
          </AdminCard>
          <AdminCard
            title="Kayıtlı hizmetler"
            description={`${cmsServices.length} kayıt — düzenlemek veya silmek için satırı kullanın.`}
          >
            {cmsServices.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">Henüz hizmet yok.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {cmsServices.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-900">{s.title}</span>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{s.slug}</span>
                        <span className="text-xs text-slate-400">sıra: {s.sortOrder}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openServiceEditor(s)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Icon.Pencil className="h-3.5 w-3.5" /> Düzenle
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void deleteService(s.id, s.title)}
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
        </>
      ) : null}

      {cmsTab === "projects" ? (
        <>
          <AdminCard
            title={editingProjectId ? "Projeyi düzenle" : "Yeni proje"}
            description="Projeler sitede tek sayfada alt alta, görsellerle gösterilir. Galeri için satır başına bir URL veya dosya yükleyin."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Slug">
                <input className="input-soft" value={projSlug} onChange={(e) => setProjSlug(e.target.value)} />
              </Field>
              <Field label="Başlık">
                <input className="input-soft" value={projTitle} onChange={(e) => setProjTitle(e.target.value)} />
              </Field>
            </div>
            <Field label="Tamamlanma tarihi" className="mt-3" hint="İsteğe bağlı; sitede ay/yıl olarak gösterilir.">
              <input
                className="input-soft"
                type="date"
                value={projCompletedAt}
                onChange={(e) => setProjCompletedAt(e.target.value)}
              />
            </Field>
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
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !projSlug.trim() || !projTitle.trim() || !projDesc.trim()}
                onClick={() => void createProject()}
                className="btn-primary disabled:opacity-50"
              >
                <Icon.Check /> {editingProjectId ? "Değişiklikleri kaydet" : "Projeyi oluştur"}
              </button>
              {editingProjectId ? (
                <button type="button" disabled={busy} onClick={cancelProjectEdit} className="btn-ghost disabled:opacity-50">
                  İptal — yeni proje
                </button>
              ) : null}
            </div>
          </AdminCard>
          <AdminCard
            title="Kayıtlı projeler"
            description={`${cmsProjects.length} kayıt — düzenlemek veya silmek için satırı kullanın.`}
          >
            {cmsProjects.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">Henüz proje yok.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {cmsProjects.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-900">{p.title}</span>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{p.slug}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openProjectEditor(p)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Icon.Pencil className="h-3.5 w-3.5" /> Düzenle
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void deleteProject(p.id, p.title)}
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
        </>
      ) : null}

      {cmsTab === "about" ? (
        <AdminCard
          title="Hakkımızda"
          description="/hakkımızda sayfası: giriş, “Biz kimiz” kutusu, üç kart ve detay metni. Yayında değilse ziyaretçiler varsayılan metinleri görür."
        >
          <Field label="Sayfa başlığı">
            <input className="input-soft" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} />
          </Field>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={pagePublish}
              onChange={(e) => setPagePublish(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Yayında
          </label>
          <Field label="Giriş paragrafı" className="mt-3" hint="Ana başlığın altındaki metin.">
            <textarea
              className="input-soft resize-y"
              rows={4}
              value={aboutLead}
              onChange={(e) => setAboutLead(e.target.value)}
            />
          </Field>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Biz kimiz bölümü</p>
          <Field label="Alt başlık" className="mt-2" hint="Kutudaki büyük başlık.">
            <input className="input-soft" value={aboutBizTitle} onChange={(e) => setAboutBizTitle(e.target.value)} />
          </Field>
          <Field label="Paragraf" className="mt-3">
            <textarea
              className="input-soft resize-y"
              rows={4}
              value={aboutBizBody}
              onChange={(e) => setAboutBizBody(e.target.value)}
            />
          </Field>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Üç kart (Misyon / Vizyon / Değerler)</p>
          <div className="mt-3 space-y-5">
            {pillars.map((p, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold text-slate-700">Kart {idx + 1}</p>
                <Field label="İkon (emoji veya kısa metin)" className="mt-2">
                  <input
                    className="input-soft"
                    value={p.icon}
                    onChange={(e) =>
                      setPillars((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, icon: e.target.value } : row)),
                      )
                    }
                  />
                </Field>
                <Field label="Başlık" className="mt-2">
                  <input
                    className="input-soft"
                    value={p.title}
                    onChange={(e) =>
                      setPillars((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, title: e.target.value } : row)),
                      )
                    }
                  />
                </Field>
                <Field label="Metin" className="mt-2">
                  <textarea
                    className="input-soft resize-y"
                    rows={3}
                    value={p.body}
                    onChange={(e) =>
                      setPillars((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, body: e.target.value } : row)),
                      )
                    }
                  />
                </Field>
              </div>
            ))}
          </div>
          <Field label="Detay metni" className="mt-4" hint="Boş bırakırsanız altta iletişim kartı gösterilir.">
            <textarea
              className="input-soft resize-y"
              rows={6}
              value={aboutBody}
              onChange={(e) => setAboutBody(e.target.value)}
            />
          </Field>
          <div className="mt-4">
            <button
              type="button"
              disabled={busy || pageBusy || !pageTitle.trim()}
              onClick={() => void saveStaticPage("about")}
              className="btn-primary disabled:opacity-50"
            >
              <Icon.Check /> Kaydet
            </button>
          </div>
        </AdminCard>
      ) : null}

      {cmsTab === "pages" ? (
        <AdminCard
          title="Hizmetler vitrin metni"
          description="/hizmetler liste sayfasının üst metni. Yayında değilse ziyaretçiler varsayılan metni görür."
        >
          <Field label="Sayfa başlığı" className="mt-4">
            <input className="input-soft" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} />
          </Field>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={pagePublish}
              onChange={(e) => setPagePublish(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Yayında
          </label>
          <Field label="Üst etiket" className="mt-3" hint="Örn. Ne sunuyoruz">
            <input className="input-soft" value={svcEyebrow} onChange={(e) => setSvcEyebrow(e.target.value)} />
          </Field>
          <Field label="Giriş paragrafı" className="mt-3" hint="Başlığın altındaki kısa açıklama.">
            <textarea
              className="input-soft resize-y"
              rows={4}
              value={svcIntro}
              onChange={(e) => setSvcIntro(e.target.value)}
            />
          </Field>
          <div className="mt-4">
            <button
              type="button"
              disabled={busy || pageBusy || !pageTitle.trim()}
              onClick={() => void saveStaticPage("services-index")}
              className="btn-primary disabled:opacity-50"
            >
              <Icon.Check /> Kaydet
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
