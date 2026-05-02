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
        className="min-h-[44px] flex-1 border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
      />
      <button
        type="submit"
        className="min-h-[44px] bg-neutral-950 px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-black"
      >
        Abone ol
      </button>
    </form>
  );
}
