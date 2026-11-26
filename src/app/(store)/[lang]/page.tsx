import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isLang, t } from "@/lib/i18n";
import { getCategories, getFeatured } from "@/lib/data";
import { pick } from "@/lib/types";
import { imageUrl } from "@/lib/supabase";
import { ProductCard } from "@/components/ProductCard";
import { CheckIcon, ImagePlaceholder } from "@/components/brand";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const [categories, featured] = await Promise.all([getCategories(), getFeatured(8)]);
  const heroImg = imageUrl(featured.find((p) => p.images?.length)?.images[0]);
  const arrow = lang === "ar" ? "←" : "→";

  return (
    <>
      <section className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-14 px-6 pb-22 pt-18">
          <div className="flex flex-[1_1_460px] flex-col gap-6">
            <span className="self-start rounded-full border border-gold px-3.5 py-1.5 text-[13px] font-semibold text-gold-light">{d.heroTag}</span>
            <h1 className="font-display text-[44px] leading-[1.15] text-gold-pale md:text-[60px]">{d.heroH}</h1>
            <p className="max-w-[500px] text-lg leading-relaxed text-[#C7CED4]">{d.heroP}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${lang}/shop`} className="rounded-xl bg-gold px-7 py-4 font-bold text-ink hover:bg-gold-light">
                {d.heroCta}
              </Link>
              <a href="#best" className="rounded-xl border border-[#4A5864] px-7 py-4 font-semibold hover:border-gold">
                {d.heroCta2}
              </a>
            </div>
            <ul className="flex flex-wrap gap-5 text-sm text-[#C7CED4]">
              {d.perks.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <CheckIcon className="size-4 text-gold" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative h-[420px] flex-[1_1_420px] overflow-hidden rounded-3xl border border-[#33424E] bg-ink-2 md:h-[500px]">
            {heroImg ? (
              <Image src={heroImg} alt="" fill priority sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Image src="/logo.jpg" alt="Alnajaar Sheets" width={320} height={320} className="rounded-2xl" priority />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-20">
        <h2 className="font-display text-4xl">{d.catH}</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
          {categories.map((c) => {
            const img = imageUrl(c.image_url);
            const name = pick(c, "name", lang);
            return (
              <Link key={c.id} href={`/${lang}/c/${c.slug}`} className="group relative flex h-[280px] flex-col justify-end overflow-hidden rounded-2xl bg-linen-2 p-5">
                {img ? <Image src={img} alt="" fill sizes="300px" className="object-cover" /> : <div className="absolute inset-0"><ImagePlaceholder label={name} /></div>}
                <span className="relative flex items-center justify-between gap-2 rounded-xl bg-white/90 px-4 py-3">
                  <span className="font-display text-2xl text-ink">{name}</span>
                  <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-ink text-gold-light group-hover:bg-gold group-hover:text-ink">
                    {arrow}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="best" className="bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl">{d.bestH}</h2>
            <Link href={`/${lang}/shop`} className="font-semibold text-gold-text hover:underline">
              {d.viewAll} {arrow}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] md:gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto flex max-w-[880px] flex-col gap-6 px-6 py-20">
        <h2 className="font-display text-4xl">{d.faqH}</h2>
        <div className="border-t border-line-2">
          {d.faq.map(([q, a]) => (
            <details key={q} className="group border-b border-line-2">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
                {q}
                <span aria-hidden="true" className="text-2xl font-normal group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="pb-5 leading-relaxed text-body">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
