"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Lang, Product } from "@/lib/types";
import { t } from "@/lib/i18n";

type Sort = "featured" | "priceAsc" | "priceDesc" | "newest";

const minPrice = (p: Product) => {
  const prices = (p.variants ?? []).map((v) => v.price ?? p.price);
  return prices.length ? Math.min(...prices) : p.price;
};

/** Client-side filtering over a server-loaded list. Cards are rendered on the server and passed in by id. */
export function Listing({ lang, products, cards }: { lang: Lang; products: Product[]; cards: Record<string, ReactNode> }) {
  const d = t(lang);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("featured");

  const sizes = useMemo(() => {
    const m = new Map<string, { label: string; dims: string | null; order: number }>();
    products.forEach((p) => p.variants?.forEach((v) => {
      if (!m.has(v.size_en)) m.set(v.size_en, { label: lang === "ar" ? v.size_ar : v.size_en, dims: v.dims, order: v.sort });
    }));
    return [...m.entries()].sort((a, b) => a[1].order - b[1].order);
  }, [products, lang]);

  const colors = useMemo(() => {
    const m = new Map<string, { label: string; hex: string }>();
    products.forEach((p) => p.variants?.forEach((v) => {
      if (!m.has(v.color_en)) m.set(v.color_en, { label: lang === "ar" ? v.color_ar : v.color_en, hex: v.color_hex });
    }));
    return [...m.entries()];
  }, [products, lang]);

  const visible = useMemo(() => {
    let list = products.filter((p) =>
      (p.variants ?? []).some((v) => (!size || v.size_en === size) && (!color || v.color_en === color)),
    );
    if (sort === "priceAsc") list = [...list].sort((a, b) => minPrice(a) - minPrice(b));
    if (sort === "priceDesc") list = [...list].sort((a, b) => minPrice(b) - minPrice(a));
    if (sort === "newest") list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (sort === "featured") list = [...list].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    return list;
  }, [products, size, color, sort]);

  const pill = (on: boolean) =>
    `min-h-11 rounded-[10px] border px-3.5 text-sm font-semibold ${on ? "border-ink bg-ink text-white" : "border-line-2 bg-white text-ink hover:border-ink"}`;

  return (
    <div className="flex flex-wrap items-start gap-8">
      <aside aria-label={d.filters} className="flex w-full flex-col gap-6 rounded-2xl border border-line bg-white p-5 md:w-[260px]">
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-bold">{d.filters}</span>
          {(size || color) && (
            <button type="button" onClick={() => { setSize(null); setColor(null); }} className="min-h-9 text-sm font-semibold text-gold-text">
              {d.clear}
            </button>
          )}
        </div>
        {sizes.length > 0 && (
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-sm font-semibold">{d.size}</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map(([key, s]) => (
                <button key={key} type="button" aria-pressed={size === key} onClick={() => setSize(size === key ? null : key)} className={pill(size === key)} title={s.dims ?? undefined}>
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {colors.length > 0 && (
          <fieldset>
            <legend className="mb-2.5 text-sm font-semibold">{d.color}</legend>
            <div className="flex flex-wrap gap-2.5">
              {colors.map(([key, c]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={c.label}
                  aria-pressed={color === key}
                  title={c.label}
                  onClick={() => setColor(color === key ? null : key)}
                  className={`size-11 rounded-full ${color === key ? "border-2 border-white ring-2 ring-ink" : "border border-line-2"}`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </fieldset>
        )}
      </aside>

      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-body" aria-live="polite">{d.products(visible.length)}</span>
          <label className="flex items-center gap-2 text-sm font-medium">
            {d.sort}
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-11 rounded-[10px] border border-line-2 bg-white px-3">
              {(Object.keys(d.sorts) as Sort[]).map((k) => (
                <option key={k} value={k}>{d.sorts[k]}</option>
              ))}
            </select>
          </label>
        </div>
        {visible.length === 0 ? (
          <p className="rounded-2xl bg-white p-10 text-center text-muted">{d.noResults}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] md:gap-6">
            {visible.map((p) => <div key={p.id}>{cards[p.id]}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
