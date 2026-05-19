import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Tekrarlayan URL'leri azaltır: gereksiz sondaki slash ve büyük harf ürün slug'ları. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.length > 1 && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/\/+$/, "");
    return NextResponse.redirect(url, 308);
  }

  const shopProduct = pathname.match(/^\/shop\/([^/]+)$/);
  if (shopProduct && shopProduct[1] !== shopProduct[1].toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = `/shop/${shopProduct[1].toLowerCase()}`;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|uploads).*)"],
};
