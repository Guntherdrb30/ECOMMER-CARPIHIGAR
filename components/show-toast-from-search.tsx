"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  param?: string;
  okMessage?: string;
  errMessage?: string;
};

export default function ShowToastFromSearch({ param = "pw", okMessage = "Clave actualizada", errMessage = "No se pudo actualizar la clave" }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const v = sp.get(param);
    if (v === "ok") {
      toast.success(okMessage);
    } else if (v === "err") {
      toast.error(errMessage);
    } else {
      return; // nothing to do
    }
    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    router.replace(url.pathname + (url.search || "") + (url.hash || ""));
  }, [sp, router, param, okMessage, errMessage]);
  return null;
}
