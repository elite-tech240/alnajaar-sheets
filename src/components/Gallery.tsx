"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlaceholder } from "./brand";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-linen-2">
        {images[i] ? <Image key={images[i]} src={images[i]} alt={alt} fill priority sizes="(min-width: 1024px) 600px, 100vw" className="animate-fade-in object-cover" /> : <ImagePlaceholder label={alt} />}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {images.map((src, n) => (
            <button
              key={src}
              type="button"
              aria-label={`${alt} ${n + 1}`}
              aria-pressed={i === n}
              onClick={() => setI(n)}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${i === n ? "border-ink" : "border-transparent"}`}
            >
              <Image src={src} alt="" fill sizes="150px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
