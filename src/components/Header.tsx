"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/types";
import { t } from "@/lib/i18n";
import { BagIcon, ShieldMark, Wordmark } from "./brand";
import { useCart } from "./cart";

export type NavCategory = { slug: string; name: string };

export function Header({ lang, categories }: { lang: Lang; categories: NavCategory[] }) {
  const d = t(lang);
  const pathname = usePathname();
  const other: Lang = lang === "ar" ? "en" : "ar";
  const switchHref = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${other}`) || `/${other}`;
  const { count, ready } = useCart();

  return (
    <>
      <div className="bg-ink-3 px-4 py-2.5 text-center text-sm text-gold-light">{d.bar}</div>
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <Link href={`/${lang}`} aria-label="Alnajaar Sheets" className="flex items-center gap-3">
            <ShieldMark />
            <Wordmark />
          </Link>
          <nav aria-label={d.home} className="order-3 flex w-full flex-wrap gap-x-7 gap-y-2 text-[15px] font-medium md:order-none md:w-auto">
            {categories.map((c) => (
              <Link key={c.slug} href={`/${lang}/c/${c.slug}`} className="relative py-2 transition-colors after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-center after:scale-x-0 after:bg-gold after:transition-transform hover:text-gold-light hover:after:scale-x-100">
                {c.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Link
              href={switchHref}
              hrefLang={other}
              aria-label={d.switchLangLabel}
              className="flex h-11 min-w-11 items-center justify-center rounded-[10px] border border-[#3A4854] px-3 text-sm font-semibold text-gold-light hover:border-gold"
            >
              {d.switchLang}
            </Link>
            <Link href={`/${lang}/cart`} aria-label={`${d.cart}, ${ready ? count : 0}`} className="relative flex size-11 items-center justify-center">
              <BagIcon />
              {ready && count > 0 && (
                <span key={count} className="animate-pop absolute end-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
