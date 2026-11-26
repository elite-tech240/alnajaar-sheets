import Link from "next/link";
import type { Lang, Product } from "@/lib/types";
import { t } from "@/lib/i18n";
import { ProductCard } from "./ProductCard";
import { Listing } from "./Listing";

export function ListingPage({ lang, title, products }: { lang: Lang; title: string; products: Product[] }) {
  const d = t(lang);
  const cards = Object.fromEntries(products.map((p) => [p.id, <ProductCard key={p.id} product={p} lang={lang} />]));
  return (
    <div className="mx-auto max-w-[1240px] px-6 pb-20 pt-7">
      <nav aria-label="breadcrumb" className="text-sm text-muted">
        <Link href={`/${lang}`} className="hover:text-ink">{d.home}</Link> / <span className="text-ink">{title}</span>
      </nav>
      <h1 className="mb-7 mt-2.5 font-display text-4xl md:text-[44px]">{title}</h1>
      <Listing lang={lang} products={products} cards={cards} />
    </div>
  );
}
