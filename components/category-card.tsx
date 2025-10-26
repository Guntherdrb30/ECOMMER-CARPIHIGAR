"use client";

import Link from "next/link";
import Image from "next/image";
import { shimmer, toBase64 } from "@/lib/image-placeholder";

type Cat = { id: string; name: string; slug: string; image?: string; productCount?: number; children?: Array<{ id: string; name: string; slug: string }>; };

export default function CategoryCard({ cat }: { cat: Cat }) {
  const hasImg = !!cat.image;
  return (
    <div className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden border border-gray-200">
      <Link href={`/productos?categoria=${cat.slug}`}>
        <div className="relative w-full h-48 md:h-56 overflow-hidden">
          {hasImg ? (
            <Image
              src={cat.image as string}
              alt={cat.name}
              fill
              sizes="(min-width: 1536px) 16vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 hover:scale-[1.02]"
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(800, 600, 8))}`}
            />
          ) : (
            <div className="absolute inset-0 bg-gray-100" />
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/productos?categoria=${cat.slug}`} className="block">
          <h3 className="text-lg font-bold text-gray-900 truncate">{cat.name}</h3>
        </Link>
        <div className="mt-1 flex items-center justify-between text-sm text-gray-600">
          <span>{typeof cat.productCount === 'number' ? `${cat.productCount} productos` : ''}</span>
          <Link href={`/productos?categoria=${cat.slug}`} className="text-brand hover:underline">Ver productos</Link>
        </div>
        {!!(cat.children?.length) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {cat.children!.slice(0, 4).map((c) => (
              <Link key={c.id} href={`/productos?categoria=${c.slug}`} className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 truncate">
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

