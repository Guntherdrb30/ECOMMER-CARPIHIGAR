import { cookies } from "next/headers";

export type Consent = "all" | "necessary" | null;

export function getConsent(): Consent {
  try {
    const c = cookies().get("cookie_consent")?.value || null;
    if (c === "all" || c === "necessary") return c;
    return null;
  } catch {
    return null;
  }
}

export function hasConsent(category: "analytics" | "marketing"): boolean {
  const c = getConsent();
  return c === "all";
}

