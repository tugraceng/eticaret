"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";
import { ADMIN_TOKEN_KEY } from "@/lib/platform-session";

/**
 * - Login ↔ panel geçişinde `ready` drift'ini sıfırlar.
 * - Aynı token için tekrar tekrar /auth/me çağırmaz; tab değişiminde sadece ref eşleşmesi kullanılır.
 * - Panel monte edilmeden önce JWT sunucuda doğrulanır (yanlış API adresi / bozuk token erken yakalanır).
 */
export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const prevPathRef = useRef<string | null>(null);
  const validatedTokenRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    if (pathname === "/admin/login") {
      validatedTokenRef.current = null;
      return;
    }
    if (prev === "/admin/login") {
      setReady(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }

    const raw = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    const tok = typeof raw === "string" ? raw.trim() : "";

    if (!tok) {
      validatedTokenRef.current = null;
      setReady(false);
      router.replace("/admin/login");
      return;
    }

    if (validatedTokenRef.current === tok) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    void fetch(apiUrl("/auth/me"), {
      headers: { Authorization: `Bearer ${tok}` },
      cache: "no-store",
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          try {
            const body = (await res.json()) as { role?: string };
            if (body.role !== "ADMIN") {
              validatedTokenRef.current = null;
              try {
                sessionStorage.removeItem(ADMIN_TOKEN_KEY);
              } catch {
                /* ignore */
              }
              router.replace("/admin/login");
              return;
            }
          } catch {
            validatedTokenRef.current = null;
            try {
              sessionStorage.removeItem(ADMIN_TOKEN_KEY);
            } catch {
              /* ignore */
            }
            router.replace("/admin/login");
            return;
          }
          validatedTokenRef.current = tok;
          setReady(true);
          return;
        }
        validatedTokenRef.current = null;
        try {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        } catch {
          /* ignore */
        }
        router.replace("/admin/login");
      })
      .catch(() => {
        if (cancelled) return;
        validatedTokenRef.current = null;
        try {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        } catch {
          /* ignore */
        }
        router.replace("/admin/login");
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Oturum doğrulanıyor…
      </div>
    );
  }
  return <>{children}</>;
}
