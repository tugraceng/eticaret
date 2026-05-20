"use client";

export function SiteFooterNewsletter() {
  return (
    <form
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-stretch"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        name="newsletter-email"
        placeholder="ornek@eposta.com"
        className="input-soft min-h-[44px] flex-1 px-4 text-sm outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
      />
      <button
        type="submit"
        className="si-btn-primary min-h-[44px] shrink-0 px-6"
      >
        Abone ol
      </button>
    </form>
  );
}
