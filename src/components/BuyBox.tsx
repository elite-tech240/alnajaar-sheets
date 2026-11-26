"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lang, Product } from "@/lib/types";
import { formatPrice, t } from "@/lib/i18n";
import { imageUrl } from "@/lib/supabase";
import { useCart } from "./cart";

export function BuyBox({ product, lang }: { product: Product; lang: Lang }) {
  const d = t(lang);
  const router = useRouter();
  const { add } = useCart();
  const variants = useMemo(() => product.variants ?? [], [product.variants]);

  const colors = useMemo(() => {
    const m = new Map<string, { label: string; hex: string }>();
    variants.forEach((v) => !m.has(v.color_en) && m.set(v.color_en, { label: lang === "ar" ? v.color_ar : v.color_en, hex: v.color_hex }));
    return [...m.entries()];
  }, [variants, lang]);

  const sizes = useMemo(() => {
    const m = new Map<string, { label: string; dims: string | null }>();
    variants.forEach((v) => !m.has(v.size_en) && m.set(v.size_en, { label: lang === "ar" ? v.size_ar : v.size_en, dims: v.dims }));
    return [...m.entries()];
  }, [variants, lang]);

  const firstInStock = variants.find((v) => v.stock > 0) ?? variants[0];
  const [color, setColor] = useState(firstInStock?.color_en ?? null);
  const [size, setSize] = useState(firstInStock?.size_en ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [addedAt, setAddedAt] = useState(0);

  const variant = variants.find((v) => v.color_en === color && v.size_en === size) ?? null;
  const price = variant?.price ?? product.price;
  const stock = variant?.stock ?? 0;
  const stockFor = (c: string | null, s: string | null) => variants.find((v) => v.color_en === c && v.size_en === s)?.stock ?? 0;

  function addToCart(goToCart: boolean) {
    if (!variant || stock < 1) return;
    add({
      variantId: variant.id,
      productSlug: product.slug,
      name_ar: product.name_ar,
      name_en: product.name_en,
      label_ar: `${variant.size_ar} · ${variant.color_ar}`,
      label_en: `${variant.size_en} · ${variant.color_en}`,
      price,
      image: imageUrl(product.images?.[0]),
      qty,
      maxQty: variant.stock,
    });
    if (goToCart) router.push(`/${lang}/cart`);
    else { setAdded(true); setAddedAt((n) => n + 1); }
  }

  const colorName = colors.find(([k]) => k === color)?.[1].label;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold">{formatPrice(price, lang)}</span>
        {product.compare_price && product.compare_price > price && (
          <span className="text-lg text-muted line-through">{formatPrice(product.compare_price, lang)}</span>
        )}
      </div>

      {colors.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold">
            {d.color}: <span className="font-normal">{colorName}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {colors.map(([key, c]) => (
              <button
                key={key}
                type="button"
                aria-label={c.label}
                aria-pressed={color === key}
                title={c.label}
                onClick={() => { setColor(key); setAdded(false); }}
                className={`size-11 rounded-full transition-transform hover:scale-110 ${color === key ? "border-2 border-white ring-2 ring-ink" : "border border-line-2"}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold">{d.size}</legend>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-2">
            {sizes.map(([key, s]) => {
              const out = stockFor(color, key) < 1;
              const on = size === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { setSize(key); setQty(1); setAdded(false); }}
                  className={`flex min-h-15 flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors px-2 py-1.5 ${on ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink hover:border-ink"} ${out ? "opacity-50 line-through" : ""}`}
                >
                  <span className="text-[15px] font-semibold">{s.label}</span>
                  {s.dims && <span className="text-xs opacity-80" dir="ltr">{s.dims}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className={`text-sm font-semibold ${stock < 1 ? "text-[#8E3420]" : stock <= 5 ? "text-[#7A5300]" : "text-[#1E6B3A]"}`} aria-live="polite">
        {!variant ? d.chooseOptions : stock < 1 ? d.outOfStock : stock <= 5 ? d.lowStock(stock) : d.inStock}
      </p>

      <div className="flex flex-wrap gap-3">
        <div className="flex h-14 items-center rounded-xl border border-line-2 bg-white">
          <button type="button" aria-label={d.less} onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-full w-13 text-2xl">−</button>
          <span className="min-w-8 text-center text-[17px] font-semibold" aria-label={d.qty}>{qty}</span>
          <button type="button" aria-label={d.more} onClick={() => setQty((q) => Math.min(Math.max(stock, 1), 20, q + 1))} className="h-full w-13 text-2xl">+</button>
        </div>
        <button
          type="button"
          disabled={!variant || stock < 1}
          onClick={() => addToCart(false)}
          className="h-14 flex-[1_1_220px] rounded-xl bg-ink transition active:scale-[0.98] text-[17px] font-bold text-gold-pale hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {d.addToCart}
        </button>
      </div>
      <button
        type="button"
        disabled={!variant || stock < 1}
        onClick={() => addToCart(true)}
        className="h-14 rounded-xl bg-gold font-bold transition active:scale-[0.98] text-ink hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
      >
        {d.buyNow}
      </button>

      {added && (
        <div role="status" key={addedAt} className="animate-slide-up flex items-center justify-between gap-4 rounded-xl bg-ink px-5 py-4 text-white">
          {d.added}
          <Link href={`/${lang}/cart`} className="font-bold text-gold-light">{d.viewCart}</Link>
        </div>
      )}
    </div>
  );
}
