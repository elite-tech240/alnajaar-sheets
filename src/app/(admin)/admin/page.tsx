"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { formatPrice } from "@/lib/i18n";
import type { Order } from "@/lib/types";
import { useAdmin } from "@/components/admin/AdminShell";
import { Badge, Card, fmtDate, statusLabel, statusTone } from "@/components/admin/ui";

type LowRow = { id: string; size_ar: string; size_en: string; color_ar: string; color_en: string; stock: number; products: { name_ar: string; name_en: string } | null };
type Range = 1 | 7 | 30;

export default function Dashboard() {
  const { lang, tr } = useAdmin();
  const [range, setRange] = useState<Range>(7);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [toShip, setToShip] = useState(0);
  const [low, setLow] = useState<LowRow[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const sb = browserClient();
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (range - 1));
    Promise.all([
      sb.from("orders").select("*, order_items(name_ar,name_en,qty,line_total)").gte("created_at", since.toISOString()).order("created_at", { ascending: false }),
      sb.from("orders").select("id", { count: "exact", head: true }).in("status", ["new", "packed"]),
      sb.from("variants").select("id,size_ar,size_en,color_ar,color_en,stock,products(name_ar,name_en)").lte("stock", 5).order("stock").limit(8),
    ]).then(([o, s, l]) => {
      if (o.error || s.error || l.error) return setError(true);
      setOrders(o.data as Order[]);
      setToShip(s.count ?? 0);
      setLow(l.data as unknown as LowRow[]);
    });
  }, [range]);

  const live = (orders ?? []).filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((a, o) => a + Number(o.total), 0);
  const aov = live.length ? revenue / live.length : 0;

  const days = Array.from({ length: range === 1 ? 1 : range }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (range === 1 ? 0 : range - 1 - i));
    return d;
  });
  const byDay = days.map((d) => {
    const key = d.toDateString();
    const total = live.filter((o) => new Date(o.created_at).toDateString() === key).reduce((a, o) => a + Number(o.total), 0);
    return { label: new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", range === 30 ? { day: "numeric" } : { weekday: "short" }).format(d), total };
  });
  const maxDay = Math.max(1, ...byDay.map((d) => d.total));

  const topMap = new Map<string, number>();
  live.forEach((o) => o.order_items?.forEach((it) => topMap.set(lang === "ar" ? it.name_ar : it.name_en, (topMap.get(lang === "ar" ? it.name_ar : it.name_en) ?? 0) + it.qty)));
  const top = [...topMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topMax = top[0]?.[1] ?? 1;

  if (error) return <p role="alert" className="text-[#8E3420]">{tr("حصلت مشكلة في تحميل البيانات. حدّثي الصفحة.", "Couldn't load data. Refresh the page.")}</p>;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-bold">{tr("الرئيسية", "Dashboard")}</h1>
        <div role="group" aria-label={tr("الفترة", "Date range")} className="flex rounded-[10px] border border-[#E2DDD2] bg-white p-[3px]">
          {([1, 7, 30] as Range[]).map((r) => (
            <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)} className={`min-h-[38px] rounded-lg px-3.5 text-sm font-semibold ${range === r ? "bg-ink text-white" : ""}`}>
              {r === 1 ? tr("النهارده", "Today") : r === 7 ? tr("7 أيام", "7 days") : tr("30 يوم", "30 days")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        <Link href="/admin/orders?status=new" className="flex items-center gap-3 rounded-[14px] border border-[#E2DDD2] bg-white p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-md">
          <span className="flex size-[42px] items-center justify-center rounded-[10px] bg-[#FBEFD5] font-bold text-[#7A5300]">{toShip}</span>
          <span className="flex flex-col"><span className="font-semibold">{tr("طلبات مستنية شحن", "Orders to ship")}</span><span className="text-[13px] text-muted">{tr("جديد أو اتجهّز", "New or packed")}</span></span>
        </Link>
        <Link href="/admin/products?filter=low" className="flex items-center gap-3 rounded-[14px] border border-[#E2DDD2] bg-white p-4 transition hover:-translate-y-0.5 hover:border-ink hover:shadow-md">
          <span className="flex size-[42px] items-center justify-center rounded-[10px] bg-[#F8E3DD] font-bold text-[#8E3420]">{low.length}</span>
          <span className="flex flex-col"><span className="font-semibold">{tr("مخزون قليل", "Low stock")}</span><span className="text-[13px] text-muted">{tr("5 قطع أو أقل", "5 or fewer left")}</span></span>
        </Link>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {[
          [tr("المبيعات", "Revenue"), formatPrice(revenue, lang)],
          [tr("عدد الطلبات", "Orders"), String(live.length)],
          [tr("متوسط قيمة الطلب", "Avg. order value"), formatPrice(Math.round(aov), lang)],
        ].map(([l, v]) => (
          <Card key={l} className="flex flex-col gap-2 !p-5">
            <span className="text-sm text-muted">{l}</span>
            {orders ? <span className="animate-fade-in text-[26px] font-bold">{v}</span> : <span className="skeleton block h-8 w-28" />}
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <Card className="flex min-w-0 flex-[2_1_480px] flex-col gap-4">
          <h2 className="text-lg font-bold">{tr("المبيعات باليوم", "Sales by day")}</h2>
          <div role="img" aria-label={tr("رسم المبيعات اليومية", "Daily sales chart")} className="flex h-[220px] items-end gap-1.5 border-b border-[#E2DDD2] md:gap-3">
            {byDay.map((d, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end" title={formatPrice(d.total, lang)}>
                <div className={`bar-grow w-full max-w-12 rounded-t-md ${i === byDay.length - 1 ? "bg-gold" : "bg-[#2B3A47]"}`} style={{ animationDelay: `${i * 40}ms`, height: `${Math.max(2, (d.total / maxDay) * 200)}px` }} />
              </div>
            ))}
          </div>
          {range !== 30 && (
            <div className="-mt-2 flex gap-1.5 md:gap-3">
              {byDay.map((d, i) => <span key={i} className="flex-1 text-center text-xs text-muted">{d.label}</span>)}
            </div>
          )}
        </Card>
        <Card className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <h2 className="text-lg font-bold">{tr("الأكتر مبيعاً", "Top products")}</h2>
          {top.length === 0 && <p className="text-sm text-muted">{tr("لسه مفيش مبيعات في الفترة دي.", "No sales in this period yet.")}</p>}
          {top.map(([name, qty]) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-2 text-sm"><span className="font-medium">{name}</span><span className="text-muted">{qty}</span></div>
              <div className="h-2 rounded bg-[#EFEBE2]"><div className="bar-grow-x h-2 rounded bg-gold" style={{ width: `${(qty / topMax) * 100}%` }} /></div>
            </div>
          ))}
        </Card>
      </div>

      <div className="flex flex-wrap gap-4">
        <Card className="flex min-w-0 flex-[2_1_480px] flex-col gap-4">
          <div className="flex items-baseline justify-between"><h2 className="text-lg font-bold">{tr("آخر الطلبات", "Recent orders")}</h2><Link href="/admin/orders" className="text-[13px] font-semibold text-gold-text">{tr("كل الطلبات", "All orders")}</Link></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="text-[13px] text-muted">{[tr("الطلب", "Order"), tr("العميل", "Customer"), tr("التاريخ", "Date"), tr("الحالة", "Status"), tr("الإجمالي", "Total")].map((h) => <th key={h} className="border-b border-[#E2DDD2] px-2 py-2.5 text-start font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {(orders ?? []).slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td className="border-b border-[#EFEBE2] px-2 py-3"><Link href={`/admin/orders?id=${o.id}`} className="font-semibold text-gold-text">#{o.order_number}</Link></td>
                    <td className="border-b border-[#EFEBE2] px-2 py-3">{o.customer_name}</td>
                    <td className="border-b border-[#EFEBE2] px-2 py-3 text-body">{fmtDate(o.created_at, lang)}</td>
                    <td className="border-b border-[#EFEBE2] px-2 py-3"><Badge className={statusTone[o.status]}>{statusLabel(o.status, tr)}</Badge></td>
                    <td className="border-b border-[#EFEBE2] px-2 py-3 font-semibold">{formatPrice(Number(o.total), lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders?.length === 0 && <p className="py-6 text-center text-sm text-muted">{tr("مفيش طلبات في الفترة دي.", "No orders in this period.")}</p>}
          </div>
        </Card>
        <Card className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
          <h2 className="text-lg font-bold">{tr("مخزون قليل", "Low stock")}</h2>
          {low.length === 0 && <p className="text-sm text-muted">{tr("كل المخزون تمام.", "All stock levels look fine.")}</p>}
          {low.map((v) => (
            <Link key={v.id} href="/admin/products?filter=low" className="flex items-center justify-between gap-3 rounded-lg border border-[#EFEBE2] px-3 py-2.5 text-sm hover:border-ink">
              <span className="flex flex-col"><span className="font-medium">{lang === "ar" ? v.products?.name_ar : v.products?.name_en}</span><span className="text-xs text-muted">{lang === "ar" ? `${v.size_ar} · ${v.color_ar}` : `${v.size_en} · ${v.color_en}`}</span></span>
              <span className={`font-bold ${v.stock === 0 ? "text-[#8E3420]" : "text-[#7A5300]"}`}>{v.stock}</span>
            </Link>
          ))}
        </Card>
      </div>
    </>
  );
}
