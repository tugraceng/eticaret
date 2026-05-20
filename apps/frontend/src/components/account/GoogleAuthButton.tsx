"use client";

import { GoogleIcon } from "@/components/account/GoogleIcon";
import { apiUrl } from "@/lib/api";

type Props = {
  disabled?: boolean;
  /** Giriş sayfasında alt not göster */
  showRegisterHint?: boolean;
};

export function GoogleAuthButton({ disabled, showRegisterHint = false }: Props) {
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        title="Google ile giriş"
        onClick={() => {
          if (disabled) return;
          window.location.assign(apiUrl("/auth/oauth/google"));
        }}
        className="auth-btn-google"
      >
        <GoogleIcon />
        Google ile devam et
      </button>
      {showRegisterHint ? (
        <p className="text-center text-[11px] leading-relaxed text-slate-400">
          Google yalnızca bu sitede kayıtlı e-posta ile çalışır. Yeni kullanıcılar önce formdan kayıt
          olmalıdır.
        </p>
      ) : null}
    </>
  );
}
