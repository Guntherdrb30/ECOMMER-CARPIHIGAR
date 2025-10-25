"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Cat = { id: string; name: string; slug: string };

export default function CategorySubheader({ items }: { items: Cat[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [offsetTop, setOffsetTop] = useState<number>(64);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sections = items.map((c) => document.getElementById(`cat-${c.slug}`)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        let topMost: { slug: string; ratio: number; top: number } | null = null;
        for (const e of entries) {
          const id = e.target.id.replace(/^cat-/, '');
          const rectTop = (e.target as HTMLElement).getBoundingClientRect().top;
          const score = e.intersectionRatio;
          const item = { slug: id, ratio: score, top: rectTop };
          if (!topMost) topMost = item;
          else if (item.top < topMost.top - 20 || item.ratio > topMost.ratio + 0.05) topMost = item;
        }
        if (topMost) setActive(topMost.slug);
      },
      { root: null, rootMargin: `-${Math.max(offsetTop + 10, 10)}px 0px -60% 0px`, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [items, offsetTop]);

  // Measure header height for sticky offset
  useEffect(() => {
    const measure = () => {
      const h = document.querySelector('header');
      const hh = h ? (h as HTMLElement).getBoundingClientRect().height : 64;
      setOffsetTop(Math.max(48, Math.round(hh)));
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('orientationchange', measure); };
  }, []);

  // Smooth scroll with correct offset
  const onNavClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = window.scrollY + rect.top - (offsetTop + 8);
    window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
    history.replaceState(null, '', href);
  };

  return (
    <div ref={rootRef} className="sticky z-30 bg-white/80 backdrop-blur border-y" style={{ top: offsetTop }}>
      <div className="container mx-auto px-4 py-3 overflow-x-auto" onClick={onNavClick}>
        <nav className="flex items-center gap-4 text-sm whitespace-nowrap">
          {items.map((c) => {
            const isActive = active === c.slug;
            return (
              <a
                key={c.id}
                href={`#cat-${c.slug}`}
                className={`pb-1 ${isActive ? 'text-brand font-semibold border-b-2 border-brand' : 'text-gray-700 hover:text-brand'}`}
              >
                {c.name}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
