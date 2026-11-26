import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, t } from "@/lib/i18n";
import { getZones } from "@/lib/data";
import { CheckoutForm } from "@/components/CheckoutForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLang(lang) ? t(lang).checkout : undefined, robots: { index: false } };
}

export default async function Checkout({ params }: PageProps<"/[lang]/checkout">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const zones = await getZones();
  return <CheckoutForm lang={lang} zones={zones} />;
}
