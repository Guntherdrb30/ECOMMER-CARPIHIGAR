"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  // Mode A: flag param with ok/err values, using fixed messages
  param?: string;
  okMessage?: string;
  errMessage?: string;
  // Mode B: success/error params carrying the message text
  successParam?: string;
  errorParam?: string;
};

export default function ShowToastFromSearch({ param = "pw", okMessage = "Clave actualizada", errMessage = "No se pudo actualizar la clave", successParam, errorParam }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Mode B takes precedence if provided
      if (successParam || errorParam) {
        const s = successParam ? sp.get(successParam) : null;
        const e = errorParam ? sp.get(errorParam) : null;
        if (s) {
          toast.success(decodeURIComponent(s));
        }
        if (e) {
          toast.error(decodeURIComponent(e));
        }
        if (s || e) {
          const url = new URL(window.location.href);
          if (s) url.searchParams.delete(successParam!);
          if (e) url.searchParams.delete(errorParam!);
          router.replace(url.pathname + (url.search || "") + (url.hash || ""));
        }
        return;
      }

      // Mode A: ok/err flags
      const v = sp.get(param);
      if (!v) return;
      if (v === "ok") toast.success(okMessage);
      else toast.error(errMessage);
      const url = new URL(window.location.href);
      url.searchParams.delete(param);
      router.replace(url.pathname + (url.search || "") + (url.hash || ""));
    }
  }, [sp, router, param, okMessage, errMessage, successParam, errorParam]);
  return null;
}