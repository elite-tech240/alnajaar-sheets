"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Lang, Zone } from "@/lib/types";
import { formatPrice, t } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase";
import { useCart } from "./cart";

const PHONE_RE = /^01[0125][0-9]{8}$/;

export function CheckoutForm({ lang, zones }: { lang: Lang; zones: Zone[] }) {
  const d = t(lang);
  const router = useRouter();
  const { lines, subtotal, clear, ready } = useCart();
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const zone = zones.find((z) => z.id === zoneId);
  const shipping = !zone ? 0 : zone.free_over !== null && subtotal >= zone.free_over ? 0 : Number(zone.fee);
  const total = subtotal + shipping;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const phone = get("phone").replace(/\s/g, "");
    const errs: Record<string, string> = {};
    if (get("name").length < 2) errs.name = d.required;
    if (!PHONE_RE.test(phone)) errs.phone = d.badPhone;
    if (get("area").length < 2) errs.area = d.required;
    if (get("address").length < 5) errs.address = d.required;
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setBusy(true);
    setServerError(null);
    const { data, error } = await browserClient().rpc("place_order", {
      p_customer: {
        name: get("name"),
        phone,
        email: get("email"),
        zone_id: zoneId,
        area: get("area"),
        address: get("address"),
        notes: get("notes"),
        gift_wrap: f.get("gift_wrap") === "on",
        lang,
      },
      p_items: lines.map((l) => ({ variant_id: l.variantId, qty: l.qty })),
    });
    if (error) {
      const msg = error.message ?? "";
      setServerError(
        msg.startsWith("out_of_stock") ? d.errors.out_of_stock : msg.includes("product_unavailable") ? d.errors.product_unavailable : msg.includes("invalid_phone") ? d.badPhone : d.errors.generic,
      );
      setBusy(false);
      return;
    }
    clear();
    router.push(`/${lang}/order/${data.order_number}`);
  }

  if (ready && lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col items-center gap-5 px-6 py-24 text-center">
        <p className="text-lg text-body">{d.cartEmpty}</p>
        <Link href={`/${lang}/shop`} className="rounded-xl bg-ink px-7 py-4 font-bold text-gold-pale">{d.continueShopping}</Link>
      </div>
    );
  }

  const input = "h-[50px] rounded-xl border border-line-2 bg-white px-3.5 text-base aria-invalid:border-[#B4462B]";
  const field = ({ id, label, type = "text", auto, full, ltr }: { id: string; label: string; type?: string; auto?: string; full?: boolean; ltr?: boolean }) => (
    <label key={id} htmlFor={id} className={`flex flex-col gap-1.5 text-sm font-medium ${full ? "w-full" : "flex-[1_1_220px]"}`}>
      {label}
      <input id={id} name={id} type={type} autoComplete={auto} dir={ltr ? "ltr" : undefined} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-err` : undefined} className={`${input} ${ltr ? "text-start" : ""}`} />
      {errors[id] && <span id={`${id}-err`} className="animate-slide-up text-[13px] font-medium text-[#B4462B]">{errors[id]}</span>}
    </label>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto flex max-w-[1240px] flex-wrap items-start gap-8 px-6 pb-20 pt-10">
      <div className="stagger flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <h1 className="font-display text-4xl">{d.checkout}</h1>

        <fieldset className="flex flex-col gap-4 rounded-2xl bg-white p-6 md:p-7">
          <legend className="float-start mb-1 text-xl font-bold">1. {d.yourDetails}</legend>
          <div className="flex flex-wrap gap-3.5">
            {field({ id: "name", label: d.name, auto: "name" })}
            {field({ id: "phone", label: d.phone, type: "tel", auto: "tel", ltr: true })}
            {field({ id: "email", label: d.email, type: "email", auto: "email", full: true, ltr: true })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-2xl bg-white p-6 md:p-7">
          <legend className="float-start mb-1 text-xl font-bold">2. {d.address}</legend>
          <div className="flex flex-wrap gap-3.5">
            <label htmlFor="zone" className="flex flex-[1_1_220px] flex-col gap-1.5 text-sm font-medium">
              {d.governorate}
              <select id="zone" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={input}>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{lang === "ar" ? z.name_ar : z.name_en}</option>
                ))}
              </select>
              {zone?.free_over != null && <span className="text-[13px] text-muted">{d.freeOver(formatPrice(zone.free_over, lang))}</span>}
            </label>
            {field({ id: "area", label: d.area, auto: "address-level2" })}
            {field({ id: "address", label: d.street, auto: "street-address", full: true })}
          </div>
          <label htmlFor="notes" className="flex flex-col gap-1.5 text-sm font-medium">
            {d.notes}
            <textarea id="notes" name="notes" rows={2} maxLength={500} className="rounded-xl border border-line-2 bg-white px-3.5 py-3 text-base" />
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-2xl bg-white p-6 md:p-7">
          <legend className="float-start mb-1 text-xl font-bold">3. {d.payment}</legend>
          <label className="flex min-h-15 items-center gap-3.5 rounded-xl border-2 border-ink bg-[#FBF9F5] px-4">
            <input type="radio" name="pay" defaultChecked className="size-5 accent-ink" />
            <span className="flex flex-col"><span className="font-semibold">{d.cod}</span><span className="text-[13px] text-muted">{d.codHint}</span></span>
          </label>
        </fieldset>
      </div>

      <aside aria-label={d.summary} className="flex flex-[1_1_340px] flex-col gap-4 rounded-2xl bg-white p-6 md:p-7">
        <h2 className="text-2xl font-bold">{d.summary}</h2>
        <ul className="flex flex-col gap-3">
          {lines.map((l) => (
            <li key={l.variantId} className="flex items-center justify-between gap-3 text-[15px]">
              <span className="flex flex-col">
                <span className="font-semibold">{lang === "ar" ? l.name_ar : l.name_en}</span>
                <span className="text-[13px] text-muted">{lang === "ar" ? l.label_ar : l.label_en} · ×{l.qty}</span>
              </span>
              <span className="font-semibold">{formatPrice(l.price * l.qty, lang)}</span>
            </li>
          ))}
        </ul>
        <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
          <input type="checkbox" name="gift_wrap" className="size-[18px] accent-ink" />
          {d.giftWrap}
        </label>
        <div className="flex flex-col gap-2.5 border-t border-[#EEE8DC] pt-4 text-[15px]">
          <div className="flex justify-between"><span className="text-body">{d.subtotal}</span><span>{formatPrice(subtotal, lang)}</span></div>
          <div className="flex justify-between"><span className="text-body">{d.shipping}</span><span className={shipping === 0 ? "font-semibold text-[#1E6B3A]" : ""}>{shipping === 0 ? d.free : formatPrice(shipping, lang)}</span></div>
          <div className="flex justify-between pt-1.5 text-xl font-bold"><span>{d.total}</span><span>{formatPrice(total, lang)}</span></div>
        </div>
        {serverError && <p role="alert" className="animate-slide-up rounded-xl bg-[#F8E3DD] p-3.5 text-sm font-medium text-[#8E3420]">{serverError}</p>}
        <button type="submit" disabled={busy || !ready} className="flex h-14 items-center justify-center gap-2.5 rounded-xl bg-ink text-[17px] font-bold text-gold-pale transition hover:bg-ink-2 active:scale-[0.98] disabled:opacity-60">
          {busy && <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-gold-pale/30 border-t-gold-pale" />}
          {busy ? d.placing : d.placeOrder}
        </button>
      </aside>
    </form>
  );
}
