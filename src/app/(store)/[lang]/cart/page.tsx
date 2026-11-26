"use client";

import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { formatPrice, isLang, t } from "@/lib/i18n";
import { useCart } from "@/components/cart";
import { ImagePlaceholder } from "@/components/brand";

export default function CartPage({ params }: PageProps<"/[lang]/cart">) {
  const { lang } = use(params);
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const { lines, subtotal, setQty, remove, ready } = useCart();

  return (
    <div className="mx-auto max-w-[960px] px-6 pb-20 pt-10">
      <h1 className="mb-8 font-display text-4xl">{d.cartTitle}</h1>
      {!ready ? null : lines.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-white p-12 text-center">
          <p className="text-lg text-body">{d.cartEmpty}</p>
          <Link href={`/${lang}/shop`} className="rounded-xl bg-ink px-7 py-4 font-bold text-gold-pale">{d.continueShopping}</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ul className="stagger divide-y divide-line rounded-2xl bg-white">
            {lines.map((l) => {
              const name = lang === "ar" ? l.name_ar : l.name_en;
              return (
                <li key={l.variantId} className="flex flex-wrap items-center gap-4 p-5">
                  <Link href={`/${lang}/p/${l.productSlug}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-linen-2">
                    {l.image ? <Image src={l.image} alt="" fill sizes="80px" className="object-cover" /> : <ImagePlaceholder label={name} />}
                  </Link>
                  <div className="flex min-w-[160px] flex-1 flex-col gap-1">
                    <Link href={`/${lang}/p/${l.productSlug}`} className="font-semibold hover:text-gold-text">{name}</Link>
                    <span className="text-sm text-muted">{lang === "ar" ? l.label_ar : l.label_en}</span>
                    <span className="text-sm font-semibold">{formatPrice(l.price, lang)}</span>
                  </div>
                  <div className="flex h-11 items-center rounded-xl border border-line-2">
                    <button type="button" aria-label={d.less} onClick={() => setQty(l.variantId, l.qty - 1)} className="h-full w-11 text-xl">−</button>
                    <span className="min-w-7 text-center font-semibold">{l.qty}</span>
                    <button type="button" aria-label={d.more} onClick={() => setQty(l.variantId, l.qty + 1)} className="h-full w-11 text-xl">+</button>
                  </div>
                  <span className="min-w-[90px] text-end font-bold">{formatPrice(l.price * l.qty, lang)}</span>
                  <button type="button" onClick={() => remove(l.variantId)} className="min-h-11 px-2 text-sm font-semibold text-[#8E3420] hover:underline">{d.remove}</button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6">
            <div className="flex flex-col">
              <span className="text-body">{d.subtotal}</span>
              <span className="text-2xl font-bold">{formatPrice(subtotal, lang)}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${lang}/shop`} className="rounded-xl border border-ink px-6 py-4 font-semibold">{d.continueShopping}</Link>
              <Link href={`/${lang}/checkout`} className="rounded-xl bg-ink px-8 py-4 font-bold text-gold-pale hover:bg-ink-2">{d.checkout}</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
