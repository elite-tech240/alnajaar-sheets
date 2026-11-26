import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, t } from "@/lib/i18n";
import { getProducts } from "@/lib/data";
import { ListingPage } from "@/components/ListingPage";

export async function generateMetadata({ params }: PageProps<"/[lang]/shop">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLang(lang) ? t(lang).allProducts : undefined };
}

export default async function Shop({ params }: PageProps<"/[lang]/shop">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const products = await getProducts();
  return <ListingPage lang={lang} title={t(lang).allProducts} products={products} />;
}
