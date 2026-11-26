import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang, t } from "@/lib/i18n";
import { getProduct } from "@/lib/data";
import { pick } from "@/lib/types";
import { imageUrl } from "@/lib/supabase";
import { BuyBox } from "@/components/BuyBox";
import { Gallery } from "@/components/Gallery";
import { CheckIcon } from "@/components/brand";

export async function generateMetadata({ params }: PageProps<"/[lang]/p/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = await getProduct(slug);
  if (!p || !isLang(lang)) return {};
  const img = imageUrl(p.images?.[0]);
  return {
    title: pick(p, "name", lang),
    description: pick(p, "desc", lang) || undefined,
    openGraph: img ? { images: [img] } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/p/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const product = await getProduct(slug);
  if (!product) notFound();
  const d = t(lang);
  const name = pick(product, "name", lang);
  const desc = pick(product, "desc", lang);
  const material = pick(product, "material", lang);
  const badge = lang === "ar" ? product.badge_ar : product.badge_en;
  const images = (product.images ?? []).map((x) => imageUrl(x)!).filter(Boolean);
  const sizeRows = Array.from(new Map((product.variants ?? []).map((v) => [v.size_en, v])).values());

  return (
    <div className="mx-auto max-w-[1240px] px-6 pb-16 pt-6">
      <nav aria-label="breadcrumb" className="text-sm text-muted">
        <Link href={`/${lang}`} className="hover:text-ink">{d.home}</Link>
        {product.categories && (
          <> / <Link href={`/${lang}/c/${product.categories.slug}`} className="hover:text-ink">{pick(product.categories, "name", lang)}</Link></>
        )}{" "}
        / <span className="text-ink">{name}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-start gap-14">
        <div className="min-w-0 flex-[1_1_480px]">
          <Gallery images={images} alt={name} />
        </div>
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-5">
          {badge && <span className="self-start rounded-full bg-ink px-3 py-1 text-[13px] font-semibold text-gold-light">{badge}</span>}
          <h1 className="font-display text-4xl leading-tight md:text-[42px]">{name}</h1>
          {desc && <p className="text-[17px] leading-relaxed text-body">{desc}</p>}
          <BuyBox product={product} lang={lang} />
          <ul className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 text-[15px]">
            {d.info.map((x) => (
              <li key={x} className="flex items-center gap-2.5"><CheckIcon className="size-[18px] text-gold-text" />{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-14 grid gap-10 rounded-2xl border border-line bg-white p-6 md:grid-cols-2 md:p-10">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-2xl">{d.details}</h2>
          {material && (
            <div className="flex justify-between border-b border-[#EEE8DC] py-3"><span>{d.material}</span><span className="text-muted">{material}</span></div>
          )}
          {desc && <p className="leading-relaxed text-body">{desc}</p>}
        </div>
        {sizeRows.length > 0 && (
          <div className="flex min-w-0 flex-col gap-3">
            <h2 className="font-display text-2xl">{d.sizeChart}</h2>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-start text-[15px]">
                <thead className="bg-linen">
                  <tr><th className="px-4 py-3 text-start font-semibold">{d.size}</th><th className="px-4 py-3 text-start font-semibold">{d.dims}</th></tr>
                </thead>
                <tbody>
                  {sizeRows.map((v) => (
                    <tr key={v.size_en} className="border-t border-[#EEE8DC]">
                      <td className="px-4 py-3">{lang === "ar" ? v.size_ar : v.size_en}</td>
                      <td className="px-4 py-3" dir="ltr">{v.dims ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
