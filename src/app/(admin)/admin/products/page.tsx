"use client";

import Image from "next/image";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { browserClient, imageUrl } from "@/lib/supabase";
import { formatPrice } from "@/lib/i18n";
import type { Category, Product, Variant } from "@/lib/types";
import { useAdmin } from "@/components/admin/AdminShell";
import { Badge, Card, btn, inputCls } from "@/components/admin/ui";

type Filter = "all" | "active" | "low" | "out";
type VRow = Omit<Variant, "id" | "product_id"> & { id?: string; key: string };
type Draft = Omit<Product, "id" | "created_at" | "variants" | "categories"> & { id?: string };

const emptyDraft = (): Draft => ({
  slug: "", category_id: null, name_ar: "", name_en: "", desc_ar: "", desc_en: "", material_ar: "", material_en: "",
  price: 0, compare_price: null, badge_ar: "", badge_en: "", images: [], is_featured: false, is_active: true,
});
const newRow = (sort: number): VRow => ({
  key: crypto.randomUUID(), size_ar: "", size_en: "", dims: "", color_ar: "", color_en: "", color_hex: "#FFFFFF", sku: null, stock: 0, price: null, sort,
});
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const total = (p: Product) => (p.variants ?? []).reduce((a, v) => a + v.stock, 0);
const hasLow = (p: Product) => (p.variants ?? []).some((v) => v.stock <= 5);

function ProductsInner() {
  const { lang, tr } = useAdmin();
  const params = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [filter, setFilter] = useState<Filter>((params.get("filter") as Filter) || "all");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [rows, setRows] = useState<VRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const sb = browserClient();
    const [p, c] = await Promise.all([
      sb.from("products").select("*, variants(*)").order("created_at", { ascending: false }),
      sb.from("categories").select("*").order("sort"),
    ]);
    if (!p.error) setProducts(p.data as Product[]);
    if (!c.error) setCats(c.data as Category[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load();
  }, [load]);

  function edit(p: Product) {
    const { variants, categories: _c, created_at: _d, ...rest } = p;
    void _c; void _d;
    setDraft({ ...rest });
    setRows((variants ?? []).slice().sort((a, b) => a.sort - b.sort).map((v) => ({ ...v, key: v.id })));
    setMsg(null);
  }
  function create() {
    setDraft(emptyDraft());
    setRows([newRow(1)]);
    setMsg(null);
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const setRow = (key: string, patch: Partial<VRow>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function upload(files: FileList | null) {
    if (!files?.length || !draft) return;
    setUploading(true);
    const sb = browserClient();
    const added: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) continue;
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("product-images").upload(path, file, { contentType: file.type });
      if (!error) added.push(path);
    }
    setUploading(false);
    if (added.length) set("images", [...draft.images, ...added]);
    if (added.length < files.length) setMsg({ ok: false, text: tr("فيه صور مترفعتش. لازم تكون صورة وأقل من 5 ميجا.", "Some images weren't uploaded. Use images under 5 MB.") });
  }

  async function save() {
    if (!draft) return;
    const name_ar = draft.name_ar.trim();
    const name_en = draft.name_en.trim();
    if (!name_ar || !name_en || !(draft.price > 0)) {
      return setMsg({ ok: false, text: tr("الاسم بالعربي والإنجليزي والسعر مطلوبين.", "Arabic name, English name and price are required.") });
    }
    const bad = rows.find((r) => !r.size_ar.trim() || !r.size_en.trim() || !r.color_ar.trim() || !r.color_en.trim());
    if (bad) return setMsg({ ok: false, text: tr("كمّلي المقاس واللون بالعربي والإنجليزي لكل نوع.", "Fill in size and colour in both languages for every variant.") });

    setSaving(true);
    setMsg(null);
    const sb = browserClient();
    const payload = {
      ...draft,
      name_ar, name_en,
      slug: draft.slug || `${slugify(name_en) || "product"}-${Math.random().toString(36).slice(2, 6)}`,
      compare_price: draft.compare_price || null,
      badge_ar: draft.badge_ar || null,
      badge_en: draft.badge_en || null,
    };
    const { data: saved, error } = await sb.from("products").upsert(payload).select().single();
    if (error || !saved) {
      setSaving(false);
      return setMsg({ ok: false, text: error?.code === "23505" ? tr("فيه منتج تاني بنفس الرابط (slug).", "Another product already uses this slug.") : tr("مقدرناش نحفظ المنتج.", "Couldn't save the product.") });
    }

    const original = products.find((p) => p.id === saved.id)?.variants ?? [];
    const keepIds = rows.filter((r) => r.id).map((r) => r.id!);
    const removed = original.filter((v) => !keepIds.includes(v.id)).map((v) => v.id);
    const upserts = rows.map((r, i) => {
      const { key: _k, ...v } = r;
      void _k;
      return { ...v, product_id: saved.id, sort: i + 1, stock: Math.max(0, Math.floor(Number(v.stock) || 0)), price: v.price ? Number(v.price) : null, dims: v.dims || null, sku: v.sku || null };
    });
    const ops = [];
    if (removed.length) ops.push(sb.from("variants").delete().in("id", removed));
    const existing = upserts.filter((v) => v.id);
    const fresh = upserts.filter((v) => !v.id).map(({ id: _i, ...v }) => { void _i; return v; });
    if (existing.length) ops.push(sb.from("variants").upsert(existing));
    if (fresh.length) ops.push(sb.from("variants").insert(fresh));
    const results = await Promise.all(ops);
    setSaving(false);
    if (results.some((r) => r.error)) {
      setMsg({ ok: false, text: tr("المنتج اتحفظ بس فيه مشكلة في الأنواع (SKU مكرر؟).", "Product saved, but variants failed (duplicate SKU?).") });
    } else {
      setMsg({ ok: true, text: tr("اتحفظ ✓", "Saved ✓") });
    }
    await load();
    const { data: fresh2 } = await sb.from("products").select("*, variants(*)").eq("id", saved.id).single();
    if (fresh2) edit(fresh2 as Product);
  }

  const visible = products.filter((p) => {
    if (filter === "active" && !p.is_active) return false;
    if (filter === "low" && !hasLow(p)) return false;
    if (filter === "out" && total(p) > 0) return false;
    const s = q.trim().toLowerCase();
    return !s || p.name_ar.includes(s) || p.name_en.toLowerCase().includes(s) || (p.variants ?? []).some((v) => v.sku?.toLowerCase().includes(s));
  });

  const filters: [Filter, string][] = [["all", tr("الكل", "All")], ["active", tr("معروض", "Active")], ["low", tr("قرب يخلص", "Low stock")], ["out", tr("خلصان", "Out of stock")]];
  const label = "flex flex-col gap-1.5 text-sm font-medium";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-bold">{tr("المنتجات والمخزون", "Products & stock")}</h1>
        <button type="button" onClick={create} className={btn.primary}>{tr("+ منتج جديد", "+ Add product")}</button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="w-full max-w-[360px]">
          <span className="sr-only">{tr("بحث", "Search")}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("الاسم أو SKU", "Name or SKU")} className={`${inputCls} w-full`} />
        </label>
        <div role="group" aria-label={tr("فلترة", "Filter")} className="flex flex-wrap gap-1.5">
          {filters.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold ${filter === k ? "border-ink bg-ink text-white" : "border-[#D5CEC1] bg-white"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <Card className="min-w-0 flex-[999_1_440px] overflow-x-auto !p-0">
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="text-[13px] text-muted">{[tr("المنتج", "Product"), tr("السعر", "Price"), tr("المخزون", "Stock"), tr("الحالة", "Status")].map((h) => <th key={h} className="border-b border-[#E2DDD2] px-3.5 py-3.5 text-start font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {visible.map((p) => {
                const n = total(p);
                const img = imageUrl(p.images?.[0]);
                return (
                  <tr key={p.id} className={draft?.id === p.id ? "bg-[#FBF7EC]" : ""}>
                    <td className="border-b border-[#EFEBE2] px-3.5 py-2">
                      <button type="button" onClick={() => edit(p)} className="flex min-h-12 items-center gap-3 text-start">
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-[10px] bg-linen-2">{img && <Image src={img} alt="" fill sizes="44px" className="object-cover" />}</span>
                        <span className="flex flex-col"><span className="font-semibold">{lang === "ar" ? p.name_ar : p.name_en}</span><span className="text-xs text-muted">{(p.variants ?? []).length} {tr("نوع", "variants")}</span></span>
                      </button>
                    </td>
                    <td className="border-b border-[#EFEBE2] px-3.5">{formatPrice(Number(p.price), lang)}</td>
                    <td className={`border-b border-[#EFEBE2] px-3.5 font-semibold ${n === 0 ? "text-[#8E3420]" : hasLow(p) ? "text-[#7A5300]" : ""}`}>{n}{n > 0 && hasLow(p) ? ` · ${tr("فيه أنواع قربت تخلص", "some low")}` : ""}</td>
                    <td className="border-b border-[#EFEBE2] px-3.5"><Badge className={!p.is_active ? "bg-[#EFEBE2] text-[#3A4450]" : n === 0 ? "bg-[#F8E3DD] text-[#8E3420]" : "bg-[#E1F0E6] text-[#1E6B3A]"}>{!p.is_active ? tr("مخفي", "Hidden") : n === 0 ? tr("خلصان", "Out of stock") : tr("معروض", "Active")}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <p className="p-10 text-center text-muted">{tr("مفيش منتجات هنا.", "No products here.")}</p>}
        </Card>

        {draft && (
          <Card className="flex min-w-0 flex-[1_1_460px] flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[22px] font-bold">{draft.id ? tr("تعديل منتج", "Edit product") : tr("منتج جديد", "New product")}</h2>
              {draft.id && draft.slug && <a href={`/${lang}/p/${draft.slug}`} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-gold-text">{tr("معاينة ↗", "Preview ↗")}</a>}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {draft.images.map((img, i) => (
                <div key={img} className="relative aspect-square overflow-hidden rounded-[10px] bg-linen-2">
                  <Image src={imageUrl(img)!} alt="" fill sizes="120px" className="object-cover" />
                  <button type="button" aria-label={tr("شيلي الصورة", "Remove image")} onClick={() => set("images", draft.images.filter((_, n) => n !== i))} className="absolute end-1 top-1 flex size-8 items-center justify-center rounded-full bg-white/90 text-lg">×</button>
                  {i === 0 && <span className="absolute bottom-1 start-1 rounded bg-ink px-1.5 text-[11px] text-gold-light">{tr("الأساسية", "Main")}</span>}
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-line-2 text-center text-[13px] text-body hover:border-ink">
                {uploading ? tr("بيترفع…", "Uploading…") : tr("+ صور", "+ Photos")}
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>{tr("الاسم بالعربي", "Arabic name")}<input dir="rtl" value={draft.name_ar} onChange={(e) => set("name_ar", e.target.value)} className={inputCls} /></label>
              <label className={label}>{tr("الاسم بالإنجليزي", "English name")}<input dir="ltr" value={draft.name_en} onChange={(e) => set("name_en", e.target.value)} className={inputCls} /></label>
              <label className={label}>{tr("الوصف بالعربي", "Arabic description")}<textarea dir="rtl" rows={3} value={draft.desc_ar ?? ""} onChange={(e) => set("desc_ar", e.target.value)} className="rounded-[10px] border border-line-2 p-3 text-[15px]" /></label>
              <label className={label}>{tr("الوصف بالإنجليزي", "English description")}<textarea dir="ltr" rows={3} value={draft.desc_en ?? ""} onChange={(e) => set("desc_en", e.target.value)} className="rounded-[10px] border border-line-2 p-3 text-[15px]" /></label>
              <label className={label}>{tr("السعر (ج.م)", "Price (EGP)")}<input type="number" min={0} inputMode="decimal" value={draft.price || ""} onChange={(e) => set("price", Number(e.target.value))} className={inputCls} /></label>
              <label className={label}>{tr("السعر قبل الخصم (اختياري)", "Compare-at price (optional)")}<input type="number" min={0} inputMode="decimal" value={draft.compare_price ?? ""} onChange={(e) => set("compare_price", e.target.value ? Number(e.target.value) : null)} className={inputCls} /></label>
              <label className={label}>{tr("القسم", "Category")}
                <select value={draft.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)} className={inputCls}>
                  <option value="">—</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{lang === "ar" ? c.name_ar : c.name_en}</option>)}
                </select>
              </label>
              <label className={label}>{tr("الخامة (عربي / إنجليزي)", "Fabric (AR / EN)")}
                <span className="flex gap-2"><input dir="rtl" value={draft.material_ar ?? ""} onChange={(e) => set("material_ar", e.target.value)} className={`${inputCls} min-w-0 flex-1`} aria-label={tr("الخامة بالعربي", "Fabric in Arabic")} /><input dir="ltr" value={draft.material_en ?? ""} onChange={(e) => set("material_en", e.target.value)} className={`${inputCls} min-w-0 flex-1`} aria-label={tr("الخامة بالإنجليزي", "Fabric in English")} /></span>
              </label>
              <label className={label}>{tr("علامة (عربي / إنجليزي) زي «جديد»", "Badge (AR / EN), e.g. “New”")}
                <span className="flex gap-2"><input dir="rtl" value={draft.badge_ar ?? ""} onChange={(e) => set("badge_ar", e.target.value)} className={`${inputCls} min-w-0 flex-1`} aria-label={tr("العلامة بالعربي", "Badge in Arabic")} /><input dir="ltr" value={draft.badge_en ?? ""} onChange={(e) => set("badge_en", e.target.value)} className={`${inputCls} min-w-0 flex-1`} aria-label={tr("العلامة بالإنجليزي", "Badge in English")} /></span>
              </label>
              <label className={label}>{tr("رابط المنتج (slug)", "URL slug")}<input dir="ltr" value={draft.slug} placeholder={tr("بيتعمل لوحده", "Generated automatically")} onChange={(e) => set("slug", slugify(e.target.value))} className={inputCls} /></label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{tr("الأنواع والمخزون (مقاس × لون)", "Variants & stock (size × colour)")}</span>
                <button type="button" onClick={() => setRows((r) => [...r, newRow(r.length + 1)])} className="min-h-10 text-sm font-semibold text-gold-text">{tr("+ نوع", "+ Variant")}</button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#EFEBE2]">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-[#F8F6F1] text-[12px] text-muted">
                    <tr>{[tr("مقاس ع", "Size AR"), tr("مقاس en", "Size EN"), tr("الأبعاد", "Dims"), tr("لون ع", "Colour AR"), tr("لون en", "Colour EN"), tr("اللون", "Swatch"), "SKU", tr("المخزون", "Stock"), tr("سعر خاص", "Own price"), ""].map((h, i) => <th key={i} className="px-2 py-2 text-start font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.key} className="border-t border-[#EFEBE2]">
                        <td className="p-1.5"><input dir="rtl" aria-label={tr("مقاس بالعربي", "Size in Arabic")} value={r.size_ar} onChange={(e) => setRow(r.key, { size_ar: e.target.value })} className={`${inputCls} w-24`} /></td>
                        <td className="p-1.5"><input dir="ltr" aria-label={tr("مقاس بالإنجليزي", "Size in English")} value={r.size_en} onChange={(e) => setRow(r.key, { size_en: e.target.value })} className={`${inputCls} w-24`} /></td>
                        <td className="p-1.5"><input dir="ltr" aria-label={tr("الأبعاد", "Dimensions")} value={r.dims ?? ""} placeholder="180×200" onChange={(e) => setRow(r.key, { dims: e.target.value })} className={`${inputCls} w-24`} /></td>
                        <td className="p-1.5"><input dir="rtl" aria-label={tr("لون بالعربي", "Colour in Arabic")} value={r.color_ar} onChange={(e) => setRow(r.key, { color_ar: e.target.value })} className={`${inputCls} w-20`} /></td>
                        <td className="p-1.5"><input dir="ltr" aria-label={tr("لون بالإنجليزي", "Colour in English")} value={r.color_en} onChange={(e) => setRow(r.key, { color_en: e.target.value })} className={`${inputCls} w-20`} /></td>
                        <td className="p-1.5"><input type="color" aria-label={tr("درجة اللون", "Swatch colour")} value={r.color_hex} onChange={(e) => setRow(r.key, { color_hex: e.target.value })} className="h-11 w-12 cursor-pointer rounded-[10px] border border-line-2 bg-white p-1" /></td>
                        <td className="p-1.5"><input dir="ltr" aria-label="SKU" value={r.sku ?? ""} onChange={(e) => setRow(r.key, { sku: e.target.value })} className={`${inputCls} w-32`} /></td>
                        <td className="p-1.5"><input type="number" min={0} aria-label={tr("المخزون", "Stock")} value={r.stock} onChange={(e) => setRow(r.key, { stock: Number(e.target.value) })} className={`${inputCls} w-20 ${r.stock <= 0 ? "border-[#E5B3A6] text-[#8E3420]" : r.stock <= 5 ? "border-[#E8CF96] text-[#7A5300]" : ""}`} /></td>
                        <td className="p-1.5"><input type="number" min={0} aria-label={tr("سعر خاص للنوع ده", "Price for this variant")} value={r.price ?? ""} placeholder="—" onChange={(e) => setRow(r.key, { price: e.target.value ? Number(e.target.value) : null })} className={`${inputCls} w-24`} /></td>
                        <td className="p-1.5"><button type="button" aria-label={tr("شيلي النوع", "Remove variant")} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="size-11 rounded-[10px] text-xl text-[#8E3420] hover:bg-[#FCEFEB]">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <span className="text-xs text-muted">{tr("«سعر خاص» لو المقاس ده سعره مختلف عن سعر المنتج. سيبيه فاضي يبقى نفس السعر.", "“Own price” only if this variant costs more or less than the product price. Leave empty to use the product price.")}</span>
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium"><input type="checkbox" checked={draft.is_active} onChange={(e) => set("is_active", e.target.checked)} className="size-5 accent-ink" />{tr("معروض في المتجر", "Visible in store")}</label>
              <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium"><input type="checkbox" checked={draft.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="size-5 accent-ink" />{tr("يظهر في «الأكتر مبيعاً»", "Show in “Best sellers”")}</label>
            </div>

            {msg && <p role="status" className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-[#E1F0E6] text-[#1E6B3A]" : "bg-[#F8E3DD] text-[#8E3420]"}`}>{msg.text}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={saving || uploading} onClick={save} className={`${btn.primary} flex-1`}>{saving ? tr("بنحفظ…", "Saving…") : tr("حفظ المنتج", "Save product")}</button>
              <button type="button" onClick={() => setDraft(null)} className={btn.secondary}>{tr("إغلاق", "Close")}</button>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsInner />
    </Suspense>
  );
}
