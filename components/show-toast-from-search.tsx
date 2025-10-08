"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ShowToastFromSearch() {
  const sp = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const pw = sp.get("pw");
    if (pw === "ok") {
      toast.success("Clave actualizada");
      const url = new URL(window.location.href);
      url.searchParams.delete("pw");
      router.replace(url.pathname + url.search + url.hash);
    } else if (pw === "err") {
      toast.error("No se pudo actualizar la clave");
      const url = new URL(window.location.href);
      url.searchParams.delete("pw");
      router.replace(url.pathname + url.search + url.hash);
    }
  }, [sp, router]);
  return null;
}

