"use client";
import React from "react";
import { useCartStore } from "@/store/cart";
import { useRouter } from "next/navigation";

export default function EnrollButton({ id, title, priceUSD, image }: { id: string; title: string; priceUSD: number; image?: string | null }) {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const onClick = async () => {
    try {
      addItem({ id: `course:${id}`, name: title, priceUSD: priceUSD || 0, image: image || undefined, sku: `course-${id}` }, 1);
    } catch {}
    try {
      await fetch('/api/assistant/ui-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'add_to_cart', productId: id, qty: 1 }) });
    } catch {}
    try { router.push('/checkout/revisar'); } catch { window.location.href = '/checkout/revisar'; }
  };
  return (
    <button className="atlas-button rounded px-4 py-2" onClick={onClick}>Quiero inscribirme</button>
  );
}
