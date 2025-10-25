"use client";

import Link from "next/link";

type Cat = { id: string; name: string; slug: string };

export default function CategorySubheader({ items }: { items: Cat[] }) {
  return (
    <div className="sticky top-16 z-30 bg-white/80 backdrop-blur border-y">
      <div className="container mx-auto px-4 py-3 overflow-x-auto">
        <nav className="flex items-center gap-4 text-sm whitespace-nowrap">
          {items.map((c) => (
            <a key={c.id} href={`#cat-${c.slug}`} className="text-gray-700 hover:text-brand font-medium">
              {c.name}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

