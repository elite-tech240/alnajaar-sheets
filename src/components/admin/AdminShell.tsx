"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { browserClient } from "@/lib/supabase";
import type { Lang } from "@/lib/types";
import { ShieldMark } from "../brand";
import { ArrowSquareOut, List, Package, Receipt, SidebarSimple, SignOut, SquaresFour, Storefront, Translate, X } from "@phosphor-icons/react";

type AdminCtx = { lang: Lang; tr: (ar: string, en: string) => string; session: Session | null };
const Ctx = createContext<AdminCtx>({ lang: "ar", tr: (a) => a, session: null });
export const useAdmin = () => use(Ctx);

const LANG_KEY = "alnajaar-admin-lang";
const COLLAPSE_KEY = "alnajaar-admin-collapsed";

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const [lang, setLang] = useState<Lang>("ar");
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied" | "out">("loading");
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved preference on mount
      if (saved === "en" || saved === "ar") setLang(saved);
      if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    const sb = browserClient();
    async function check(s: Session | null) {
      setSession(s);
      if (!s) return setState("out");
      const { data } = await sb.rpc("is_admin");
      setState(data ? "ok" : "denied");
    }
    sb.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => check(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (state === "out" && !isLogin) router.replace("/admin/login");
    if (state === "ok" && isLogin) router.replace("/admin");
  }, [state, isLogin, router]);

  const tr = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const toggleLang = () => {
    const next: Lang = lang === "ar" ? "en" : "ar";
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* storage unavailable */
    }
  };
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !c;
    });
  };
  const ctx = { lang, tr, session };

  if (isLogin) return <Ctx value={ctx}>{children}</Ctx>;

  if (state !== "ok") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        {state === "denied" ? (
          <>
            <p className="max-w-md text-body">{tr("الحساب ده مش عنده صلاحية دخول لوحة التحكم.", "This account doesn't have admin access.")}</p>
            <button type="button" onClick={() => browserClient().auth.signOut()} className="min-h-11 rounded-xl bg-ink px-5 font-semibold text-gold-pale">
              {tr("تسجيل الخروج", "Sign out")}
            </button>
          </>
        ) : (
          <div role="status" className="flex flex-col items-center gap-3"><ShieldMark size={44} /><span className="h-1 w-24 overflow-hidden rounded bg-line"><span className="block h-full w-1/2 animate-[loading_1s_ease-in-out_infinite] rounded bg-gold" /></span><span className="sr-only">{tr("بنحمّل…", "Loading…")}</span></div>
        )}
      </div>
    );
  }

  const nav = [
    { href: "/admin", label: tr("الرئيسية", "Dashboard"), Icon: SquaresFour },
    { href: "/admin/orders", label: tr("الطلبات", "Orders"), Icon: Receipt },
    { href: "/admin/products", label: tr("المنتجات والمخزون", "Products & stock"), Icon: Package },
  ];
  const itemCls = (on: boolean) =>
    `group relative flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition-colors ${on ? "bg-ink-2 text-gold-light" : "text-[#C7CED4] hover:bg-ink-2/60 hover:text-white"} ${collapsed ? "md:justify-center md:px-0" : ""}`;
  const labelCls = collapsed ? "md:sr-only" : "";

  const sidebar = (
    <div className="flex h-full flex-col gap-1 px-3 py-5">
      <div className={`flex items-center justify-between gap-2 px-1.5 pb-5 ${collapsed ? "md:flex-col md:px-0" : ""}`}>
        <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <ShieldMark size={32} />
          <span className={`flex flex-col leading-tight ${labelCls}`}>
            <span className="font-display text-lg tracking-wider text-gold-light" dir="ltr">ALNAJAAR</span>
            <span className="text-[11px] text-[#9AA6B0]">{tr("لوحة التحكم", "Admin panel")}</span>
          </span>
        </Link>
        <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? tr("افتحي القايمة", "Expand menu") : tr("صغّري القايمة", "Collapse menu")} aria-expanded={!collapsed} className="hidden size-9 items-center justify-center rounded-lg text-[#9AA6B0] transition-colors hover:bg-ink-2 hover:text-white md:flex">
          <SidebarSimple size={20} className={lang === "ar" ? "-scale-x-100" : ""} />
        </button>
        <button type="button" onClick={() => setOpen(false)} aria-label={tr("اقفلي القايمة", "Close menu")} className="flex size-11 items-center justify-center rounded-lg text-[#C7CED4] md:hidden">
          <X size={22} />
        </button>
      </div>
      {nav.map(({ href, label, Icon }) => {
        const on = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={on ? "page" : undefined} title={collapsed ? label : undefined} className={itemCls(on)}>
            {on && <span aria-hidden="true" className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-gold" />}
            <Icon size={22} weight={on ? "fill" : "regular"} className="shrink-0" />
            <span className={labelCls}>{label}</span>
          </Link>
        );
      })}
      <a href={`/${lang}`} target="_blank" rel="noreferrer" title={collapsed ? tr("عرض المتجر", "View store") : undefined} className={itemCls(false)}>
        <Storefront size={22} className="shrink-0" />
        <span className={labelCls}>{tr("عرض المتجر", "View store")}</span>
        <ArrowSquareOut size={14} className={`ms-auto opacity-60 ${labelCls}`} />
      </a>
      <div className="mt-auto flex flex-col gap-1 border-t border-[#2C3A46] pt-4">
        <span className={`truncate px-3 pb-1 text-[13px] text-[#9AA6B0] ${labelCls}`} dir="ltr">{session?.user.email}</span>
        <button type="button" onClick={toggleLang} title={collapsed ? tr("English", "عربي") : undefined} className={itemCls(false)}>
          <Translate size={22} className="shrink-0" />
          <span className={labelCls}>{tr("English", "عربي")}</span>
        </button>
        <button type="button" onClick={() => browserClient().auth.signOut()} title={collapsed ? tr("خروج", "Sign out") : undefined} className={itemCls(false)}>
          <SignOut size={22} className={`shrink-0 ${lang === "ar" ? "-scale-x-100" : ""}`} />
          <span className={labelCls}>{tr("خروج", "Sign out")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <Ctx value={ctx}>
      <div className="flex min-h-dvh">
        {/* Desktop sidebar */}
        <aside aria-label={tr("قائمة الإدارة", "Admin menu")} className={`sticky top-0 hidden h-dvh shrink-0 bg-ink transition-[width] duration-300 ease-out md:block ${collapsed ? "w-[76px]" : "w-[248px]"}`}>
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {open && <button type="button" aria-label={tr("اقفلي القايمة", "Close menu")} onClick={() => setOpen(false)} className="fixed inset-0 z-40 animate-fade-in bg-ink/50 md:hidden" />}
        <aside aria-label={tr("قائمة الإدارة", "Admin menu")} aria-hidden={!open} inert={!open} className={`fixed inset-y-0 start-0 z-50 w-[272px] bg-ink shadow-2xl transition-transform duration-300 ease-out md:hidden ${open ? "translate-x-0" : lang === "ar" ? "translate-x-full" : "-translate-x-full"}`}>
          {sidebar}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#E2DDD2] bg-[#F5F3EE]/90 px-4 py-2.5 backdrop-blur md:hidden">
            <button type="button" onClick={() => setOpen(true)} aria-label={tr("افتحي القايمة", "Open menu")} aria-expanded={open} className="flex size-11 items-center justify-center rounded-lg text-ink hover:bg-white">
              <List size={24} />
            </button>
            <span className="font-display tracking-wider text-ink" dir="ltr">ALNAJAAR</span>
            <span className="size-11" />
          </header>
          <main key={pathname} className="stagger flex min-w-0 flex-1 flex-col gap-6 px-5 py-7 md:px-8">{children}</main>
        </div>
      </div>
    </Ctx>
  );
}
