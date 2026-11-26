"use client";

import type { OrderStatus } from "@/lib/types";

export const STATUSES: OrderStatus[] = ["new", "packed", "shipped", "delivered", "cancelled"];

export const statusLabel = (s: OrderStatus, tr: (a: string, e: string) => string) =>
  ({
    new: tr("جديد", "New"),
    packed: tr("اتجهّز", "Packed"),
    shipped: tr("اتشحن", "Shipped"),
    delivered: tr("اتسلّم", "Delivered"),
    cancelled: tr("ملغي", "Cancelled"),
  })[s];

export const statusTone: Record<OrderStatus, string> = {
  new: "bg-[#E4ECFA] text-[#20408F]",
  packed: "bg-[#FBEFD5] text-[#7A5300]",
  shipped: "bg-[#EFEBE2] text-[#3A4450]",
  delivered: "bg-[#E1F0E6] text-[#1E6B3A]",
  cancelled: "bg-[#F8E3DD] text-[#8E3420]",
};

export function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

export function Card({ className = "", children, ...rest }: React.HTMLAttributes<HTMLElement> & { className?: string }) {
  return (
    <section {...rest} className={`rounded-[14px] border border-[#E2DDD2] bg-white p-6 ${className}`}>
      {children}
    </section>
  );
}

export const btn = {
  primary: "inline-flex min-h-11 items-center justify-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-gold-pale hover:bg-ink-2 disabled:opacity-50",
  secondary: "inline-flex min-h-11 items-center justify-center rounded-[10px] border border-line-2 bg-white px-4 text-sm font-semibold text-ink hover:border-ink disabled:opacity-50",
  danger: "inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#E5B3A6] bg-white px-4 text-sm font-semibold text-[#8E3420] disabled:opacity-50",
};

export const inputCls = "h-11 rounded-[10px] border border-line-2 bg-white px-3 text-[15px]";

export function fmtDate(iso: string, lang: "ar" | "en") {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
