import { ShopPromoRail, shopRailHasContent } from "@/components/site/ShopPromoRail";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const hasLeft = shopRailHasContent(settings, "left");
  const hasRight = shopRailHasContent(settings, "right");

  return (
    <div className="w-full min-w-0">
      <div className="mx-auto flex w-full max-w-[100rem] items-start justify-center">
        <aside
          className={
            hasLeft
              ? "sticky top-20 z-0 hidden w-[14rem] shrink-0 self-start pl-1 pt-1 xl:block"
              : "hidden w-0 shrink-0 overflow-hidden xl:block"
        }
        >
          {hasLeft ? <ShopPromoRail side="left" settings={settings} /> : null}
        </aside>

        <div className="w-full min-w-0 flex-1">{children}</div>

        <aside
          className={
            hasRight
              ? "sticky top-20 z-0 hidden w-[14rem] shrink-0 self-start pr-1 pt-1 xl:block"
              : "hidden w-0 shrink-0 overflow-hidden xl:block"
        }
        >
          {hasRight ? <ShopPromoRail side="right" settings={settings} /> : null}
        </aside>
      </div>
    </div>
  );
}
