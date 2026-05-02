function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = "90" + digits;
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}

export function WhatsAppFAB({
  number,
  greeting,
}: {
  number?: string | null;
  greeting?: string | null;
}) {
  const phone = normalizePhone(number ?? "");
  if (!phone) return null;
  const text = (greeting ?? "").trim();
  const href = `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişime geç"
      className="group fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-[45] flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 md:bottom-6 md:right-6"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-6 w-6 shrink-0 fill-current"
        aria-hidden
      >
        <path d="M19.11 17.18c-.27-.13-1.58-.78-1.82-.87-.25-.09-.42-.13-.6.13-.18.27-.69.87-.85 1.05-.16.18-.31.2-.58.07-.27-.13-1.13-.42-2.16-1.33-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.6-1.44-.82-1.97-.22-.52-.44-.45-.6-.46l-.51-.01c-.18 0-.47.07-.71.34-.25.27-.93.91-.93 2.22 0 1.31.95 2.58 1.08 2.76.13.18 1.88 2.88 4.56 4.04 2.68 1.16 2.68.77 3.16.73.49-.04 1.58-.64 1.8-1.26.22-.62.22-1.15.16-1.26-.07-.11-.24-.18-.51-.31zM16.02 4.67C9.75 4.67 4.67 9.75 4.67 16.02c0 2.11.55 4.17 1.6 5.99L4.67 28.01l6.18-1.62a11.32 11.32 0 0 0 5.17 1.31c6.27 0 11.35-5.08 11.35-11.35S22.29 4.67 16.02 4.67z" />
      </svg>
      <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
    </a>
  );
}
