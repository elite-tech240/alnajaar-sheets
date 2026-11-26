import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "../../fonts";
import "../../globals.css";
import { CartProvider } from "@/components/cart";
import { Header } from "@/components/Header";
import { dirOf, isLang, langs, t } from "@/lib/i18n";
import { getCategories } from "@/lib/data";
import { pick } from "@/lib/types";


export const revalidate = 60;

export function generateStaticParams() {
  return langs.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const ar = lang === "ar";
  return {
    title: { default: "Alnajaar Sheets", template: "%s · Alnajaar Sheets" },
    description: ar ? "مفارش وملايات وفوط — Alnajaar Sheets" : "Bedding, sheets and towels — Alnajaar Sheets",
    alternates: { languages: { ar: "/ar", en: "/en" } },
    icons: { icon: "/logo.jpg" },
  };
}

export default async function StoreLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  const categories = await getCategories();
  const nav = categories.map((c) => ({ slug: c.slug, name: pick(c, "name", lang) }));

  return (
    <html lang={lang} dir={dirOf(lang)} className="antialiased">
      <body className="flex min-h-dvh flex-col font-sans">
        <CartProvider>
          <Header lang={lang} categories={nav} />
          <div className="flex-1">{children}</div>
          <footer className="bg-ink text-[#C7CED4]">
            <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-10 px-6 py-14 text-sm">
              <div className="flex max-w-[300px] flex-col gap-3.5">
                <Image src="/logo.jpg" alt="Alnajaar Sheets" width={140} height={140} className="rounded-2xl" />
                <span>{d.brandTag}</span>
              </div>
              <div className="flex flex-wrap gap-14">
                <div className="flex flex-col gap-2.5">
                  <span className="font-semibold text-gold-light">{d.footShop}</span>
                  {nav.map((c) => (
                    <Link key={c.slug} href={`/${lang}/c/${c.slug}`} className="hover:text-white">
                      {c.name}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  <span className="font-semibold text-gold-light">{d.footHelp}</span>
                  {d.footHelpItems.map((x) => (
                    <Link key={x} href={`/${lang}#faq`} className="hover:text-white">
                      {x}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-[#2C3A46] px-6 py-5 text-center text-xs">
              © {new Date().getFullYear()} Alnajaar Sheets · {d.rights}
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
