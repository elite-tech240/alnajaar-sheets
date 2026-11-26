"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { browserClient } from "@/lib/supabase";
import { formatPrice } from "@/lib/i18n";
import type { Order, OrderStatus } from "@/lib/types";
import { useAdmin } from "@/components/admin/AdminShell";
import { Badge, Card, STATUSES, btn, fmtDate, inputCls, statusLabel, statusTone } from "@/components/admin/ui";

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { new: "packed", packed: "shipped", shipped: "delivered" };

function OrdersInner() {
  const { lang, tr } = useAdmin();
  const params = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OrderStatus | "all">((params.get("status") as OrderStatus) || "all");
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(params.get("id"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await browserClient().from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(500);
    if (error) setError(tr("حصلت مشكلة في تحميل الطلبات.", "Couldn't load orders."));
    else setOrders(data as Order[]);
    setLoading(false);
  }, [tr]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load();
  }, [load]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, orders.filter((o) => o.status === s).length])), [orders]);
  const visible = orders.filter((o) => {
    if (tab !== "all" && o.status !== tab) return false;
    const s = q.trim().replace(/^#/, "");
    if (!s) return true;
    return String(o.order_number).includes(s) || o.phone.includes(s) || o.customer_name.toLowerCase().includes(s.toLowerCase());
  });
  const sel = orders.find((o) => o.id === selId) ?? visible[0] ?? null;

  async function update(patch: Partial<Order>, confirmMsg?: string) {
    if (!sel) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setSaving(true);
    setError(null);
    const { data, error } = await browserClient().from("orders").update(patch).eq("id", sel.id).select("*, order_items(*)").single();
    setSaving(false);
    if (error) return setError(tr("مقدرناش نحفظ التغيير. جرّبي تاني.", "Couldn't save the change. Try again."));
    setOrders((prev) => prev.map((o) => (o.id === sel.id ? (data as Order) : o)));
  }

  function exportCsv() {
    const rows = [["order", "date", "name", "phone", "governorate", "area", "address", "status", "payment", "total"]];
    visible.forEach((o) => rows.push([String(o.order_number), o.created_at, o.customer_name, o.phone, o.governorate, o.area, o.address, o.status, o.payment_status, String(o.total)]));
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const tabs: (OrderStatus | "all")[] = ["all", ...STATUSES];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-bold">{tr("الطلبات", "Orders")}</h1>
        <button type="button" onClick={exportCsv} className={btn.secondary}>{tr("تصدير CSV", "Export CSV")}</button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={tr("حالة الطلب", "Order status")} className="flex flex-wrap gap-1.5">
          {tabs.map((s) => (
            <button key={s} role="tab" aria-selected={tab === s} type="button" onClick={() => setTab(s)} className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold ${tab === s ? "border-ink bg-ink text-white" : "border-[#D5CEC1] bg-white"}`}>
              {s === "all" ? tr("الكل", "All") : statusLabel(s, tr)} <span className="font-medium opacity-75">{s === "all" ? orders.length : counts[s]}</span>
            </button>
          ))}
        </div>
        <label className="flex min-w-[260px] items-center gap-2">
          <span className="sr-only">{tr("بحث", "Search")}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("رقم الطلب أو الاسم أو الموبايل", "Order #, name or phone")} className={`${inputCls} w-full`} />
        </label>
      </div>

      {error && <p role="alert" className="animate-slide-up rounded-lg bg-[#F8E3DD] p-3 text-sm text-[#8E3420]">{error}</p>}

      <div className="flex flex-wrap items-start gap-4">
        <Card className="min-w-0 flex-[999_1_520px] overflow-x-auto !p-0">
          <table className="w-full min-w-[620px] text-sm">
            <thead><tr className="text-[13px] text-muted">{[tr("الطلب", "Order"), tr("التاريخ", "Date"), tr("العميل", "Customer"), tr("الدفع", "Payment"), tr("الحالة", "Status"), tr("الإجمالي", "Total")].map((h) => <th key={h} className="border-b border-[#E2DDD2] px-3 py-3.5 text-start font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.id} className={`transition-colors ${sel?.id === o.id ? "bg-[#FBF7EC]" : "hover:bg-[#FAF8F3]"}`}>
                  <td className="border-b border-[#EFEBE2] px-3"><button type="button" onClick={() => setSelId(o.id)} className="min-h-[52px] font-bold text-gold-text underline">#{o.order_number}</button></td>
                  <td className="border-b border-[#EFEBE2] px-3 text-body">{fmtDate(o.created_at, lang)}</td>
                  <td className="border-b border-[#EFEBE2] px-3">{o.customer_name}</td>
                  <td className="border-b border-[#EFEBE2] px-3"><Badge className={o.payment_status === "paid" ? "bg-[#E1F0E6] text-[#1E6B3A]" : o.payment_status === "refunded" ? "bg-[#F8E3DD] text-[#8E3420]" : "bg-[#FBEFD5] text-[#7A5300]"}>{o.payment_status === "paid" ? tr("اتدفع", "Paid") : o.payment_status === "refunded" ? tr("اترجع", "Refunded") : tr("عند الاستلام", "COD")}</Badge></td>
                  <td className="border-b border-[#EFEBE2] px-3"><Badge className={statusTone[o.status]}>{statusLabel(o.status, tr)}</Badge></td>
                  <td className="border-b border-[#EFEBE2] px-3 font-semibold">{formatPrice(Number(o.total), lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visible.length === 0 && <p className="p-10 text-center text-muted">{tr("مفيش طلبات هنا.", "No orders here.")}</p>}
          {loading && <div role="status" className="flex flex-col gap-3 p-5">{[0, 1, 2, 3, 4].map((n) => <span key={n} className="skeleton h-10" />)}<span className="sr-only">{tr("بنحمّل…", "Loading…")}</span></div>}
        </Card>

        {sel && (
          <Card key={sel.id} aria-label={tr("تفاصيل الطلب", "Order details")} className="animate-slide-up flex flex-[1_1_340px] flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1"><h2 className="text-[22px] font-bold">{tr("طلب", "Order")} #{sel.order_number}</h2><span className="text-[13px] text-muted">{fmtDate(sel.created_at, lang)}</span></div>
              <Badge className={statusTone[sel.status]}>{statusLabel(sel.status, tr)}</Badge>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">{sel.customer_name}</span>
              <a href={`tel:${sel.phone}`} dir="ltr" className="self-start text-gold-text underline">{sel.phone}</a>
              {sel.email && <span dir="ltr" className="self-start text-body">{sel.email}</span>}
              <span className="text-body">{sel.address}، {sel.area}، {sel.governorate}</span>
              {sel.notes && <span className="mt-1 rounded-lg bg-[#FBF7EC] p-2.5 text-body">{sel.notes}</span>}
              {sel.gift_wrap && <Badge className="mt-1 self-start bg-ink text-gold-light">{tr("تغليف هدية", "Gift wrap")}</Badge>}
            </div>
            <div className="flex flex-col gap-2.5 border-t border-[#EFEBE2] pt-4">
              {sel.order_items?.map((it) => (
                <div key={it.id} className="flex justify-between gap-3 text-sm">
                  <span className="flex flex-col"><span className="font-semibold">{lang === "ar" ? it.name_ar : it.name_en}</span><span className="text-[13px] text-muted">{it.variant_label} · ×{it.qty}</span></span>
                  <span className="font-semibold">{formatPrice(Number(it.line_total), lang)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-body"><span>{tr("التوصيل", "Delivery")}</span><span>{formatPrice(Number(sel.shipping), lang)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>{tr("الإجمالي", "Total")}</span><span>{formatPrice(Number(sel.total), lang)}</span></div>
            </div>
            <div className="flex flex-col gap-2.5 border-t border-[#EFEBE2] pt-4">
              <span className="text-sm font-semibold">{tr("مراحل الطلب", "Progress")}</span>
              {(["new", "packed", "shipped", "delivered"] as OrderStatus[]).map((s, i) => {
                const done = sel.status !== "cancelled" && ["new", "packed", "shipped", "delivered"].indexOf(sel.status) >= i;
                return (
                  <div key={s} className="flex items-center gap-3 text-sm">
                    <span className={`size-3 rounded-full transition-colors duration-500 ${done ? "bg-gold" : "border-2 border-line-2 bg-white"}`} />
                    <span className={done ? "font-medium" : "text-muted"}>{statusLabel(s, tr)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              {NEXT[sel.status] && (
                <button type="button" disabled={saving} onClick={() => update({ status: NEXT[sel.status]!, ...(NEXT[sel.status] === "delivered" ? { payment_status: "paid" as const } : {}) })} className={`${btn.primary} flex-[1_1_180px]`}>
                  {tr("علّميه", "Mark as")} «{statusLabel(NEXT[sel.status]!, tr)}»
                </button>
              )}
              {sel.status !== "cancelled" && sel.status !== "delivered" && (
                <button type="button" disabled={saving} onClick={() => update({ status: "cancelled" }, tr("متأكدة إنك عايزة تلغي الطلب؟ الكميات هترجع للمخزون.", "Cancel this order? Its items go back into stock."))} className={`${btn.danger} flex-[1_1_120px]`}>
                  {tr("إلغاء الطلب", "Cancel order")}
                </button>
              )}
              {sel.status === "delivered" && sel.payment_status === "paid" && (
                <button type="button" disabled={saving} onClick={() => update({ payment_status: "refunded" }, tr("تسجّلي إن فلوس الطلب ده رجعت للعميل؟", "Record this order as refunded?"))} className={`${btn.danger} flex-[1_1_120px]`}>
                  {tr("سجّلي استرجاع", "Record refund")}
                </button>
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersInner />
    </Suspense>
  );
}
