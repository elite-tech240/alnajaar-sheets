import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-center gap-5 px-6 py-24 text-center">
      <h1 className="font-display text-4xl">404</h1>
      <p className="text-body">الصفحة دي مش موجودة · This page doesn’t exist.</p>
      <Link href="/ar" className="rounded-xl bg-ink px-7 py-4 font-bold text-gold-pale">الرئيسية · Home</Link>
    </div>
  );
}
