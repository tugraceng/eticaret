/** Hero başlığında «3D Baskı» vurgusu — mobil mockup */
export function HomeHeroTitle({ title }: { title: string }) {
  const re = /(3d\s*baskı)/i;
  const match = title.match(re);
  if (!match || match.index === undefined) {
    return <>{title}</>;
  }
  const i = match.index;
  const before = title.slice(0, i);
  const highlight = title.slice(i, i + match[0].length);
  const after = title.slice(i + match[0].length);
  return (
    <>
      {before}
      <span className="text-[var(--si-accent,#7eb8d4)]">{highlight}</span>
      {after}
    </>
  );
}
