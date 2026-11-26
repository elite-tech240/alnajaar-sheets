import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { getCategories, getProducts } from "@/lib/data";
import { pick } from "@/lib/types";
import { ListingPage } from "@/components/ListingPage";

async function load(slug: string) {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/c/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const cat = await load(slug);
  return { title: cat && isLang(lang) ? pick(cat, "name", lang) : undefined };
}

export default async function CategoryPage({ params }: PageProps<"/[lang]/c/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const cat = await load(slug);
  if (!cat) notFound();
  const products = await getProducts(cat.id);
  return <ListingPage lang={lang} title={pick(cat, "name", lang)} products={products} />;
}
