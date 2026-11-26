import Image from "next/image";
import Link from "next/link";
import type { Lang, Product } from "@/lib/types";
import { pick } from "@/lib/types";
import { formatPrice, t } from "@/lib/i18n";
import { imageUrl } from "@/lib/supabase";
import { ImagePlaceholder } from "./brand";

export function ProductCard({ product, lang }: { product: Product; lang: Lang }) {
  const d = t(lang);
  const name = pick(product, "name", lang);
  const badge = lang === "ar" ? product.badge_ar : product.badge_en;
  const img = imageUrl(product.images?.[0]);
  const variants = product.variants ?? [];
  const colors = Array.from(new Map(variants.map((v) => [v.color_hex, v])).values()).slice(0, 5);
  const inStock = variants.some((v) => v.stock > 0);
  const prices = variants.map((v) => v.price ?? product.price);
  const minPrice = prices.length ? Math.min(...prices) : product.price;
  const href = `/${lang}/p/${product.slug}`;

  return (
    <article className="group flex flex-col gap-2.5">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-linen-2 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-ink/10">
        {img ? (
          <Image src={img} alt={name} fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        ) : (
          <ImagePlaceholder label={name} />
        )}
        {badge && (
          <span className="absolute start-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-gold-light">{badge}</span>
        )}
        {!inStock && (
          <span className="absolute end-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8E3420]">{d.outOfStock}</span>
        )}
      </Link>
      {colors.length > 0 && (
        <div className="flex gap-1.5" aria-hidden="true">
          {colors.map((v) => (
            <span key={v.color_hex} className="size-3.5 rounded-full border border-line-2" style={{ background: v.color_hex }} />
          ))}
        </div>
      )}
      <Link href={href} className="text-base font-semibold text-ink hover:text-gold-text">
        {name}
      </Link>
      <div className="flex items-baseline gap-2">
        <span className="text-[17px] font-bold">{formatPrice(minPrice, lang)}</span>
        {product.compare_price && product.compare_price > minPrice && (
          <span className="text-sm text-muted line-through">{formatPrice(product.compare_price, lang)}</span>
        )}
      </div>
    </article>
  );
}
