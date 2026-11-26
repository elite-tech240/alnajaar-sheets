import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang, t } from "@/lib/i18n";
import { CheckIcon } from "@/components/brand";

export const metadata = { robots: { index: false } };

export default async function OrderDone({ params }: PageProps<"/[lang]/order/[number]">) {
  const { lang, number } = await params;
  if (!isLang(lang) || !/^\d{1,10}$/.test(number)) notFound();
  const d = t(lang);
  return (
    <div className="stagger mx-auto flex max-w-[640px] flex-col items-center gap-5 px-6 py-24 text-center">
      <span className="flex size-[76px] items-center justify-center rounded-full bg-ink text-gold">
        <CheckIcon className="size-9 [stroke-dasharray:30] [stroke-dashoffset:30] animate-[draw_0.6s_0.35s_ease-out_forwards]" />
      </span>
      <h1 className="font-display text-4xl">{d.doneH}</h1>
      <p className="text-[17px] leading-relaxed text-body">{d.doneP(number)}</p>
      <Link href={`/${lang}`} className="rounded-xl bg-ink px-7 py-4 font-bold text-gold-pale">{d.continueShopping}</Link>
    </div>
  );
}
