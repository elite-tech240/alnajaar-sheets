"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { browserClient } from "@/lib/supabase";
import type { Lang } from "@/lib/types";
import { ShieldMark } from "../brand";

type AdminCtx = { lang: Lang; tr: (ar: string, en: string) => string; session: Session | null };
const Ctx = createContext<AdminCtx>({ lang: "ar", tr: (a) => a, session: null });
export const useAdmin = () => use(Ctx);

const LANG_KEY = "alnajaar-admin-lang";

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const [lang, setLang] = useState<Lang>("ar");
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied" | "out">("loading");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved preference on mount
      if (saved === "en" || saved === "ar") setLang(saved);
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
          <p className="text-muted" role="status">{tr("بنحمّل…", "Loading…")}</p>
        )}
      </div>
    );
  }

  const nav = [
    { href: "/admin", label: tr("الرئيسية", "Dashboard") },
    { href: "/admin/orders", label: tr("الطلبات", "Orders") },
    { href: "/admin/products", label: tr("المنتجات والمخزون", "Products & stock") },
  ];

  return (
    <Ctx value={ctx}>
      <div className="flex min-h-dvh flex-wrap">
        <nav aria-label={tr("قائمة الإدارة", "Admin menu")} className="flex w-full flex-col gap-1 bg-ink px-4 py-5 text-[#C7CED4] md:w-[240px]">
          <Link href="/admin" className="flex items-center gap-2.5 px-2.5 pb-5">
            <ShieldMark size={32} />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-lg tracking-wider text-gold-light" dir="ltr">ALNAJAAR</span>
              <span className="text-[11px] text-[#9AA6B0]">{tr("لوحة التحكم", "Admin panel")}</span>
            </span>
          </Link>
          {nav.map((n) => {
            const on = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`flex min-h-11 items-center rounded-[10px] px-3 text-[15px] font-medium ${on ? "bg-ink-2 text-gold-light" : "hover:text-white"}`}>
                {n.label}
              </Link>
            );
          })}
          <a href={`/${lang}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-[10px] px-3 text-[15px] font-medium hover:text-white">
            {tr("عرض المتجر ↗", "View store ↗")}
          </a>
          <div className="mt-auto flex flex-col gap-2 border-t border-[#2C3A46] px-2.5 pt-4 text-sm">
            <span className="truncate" dir="ltr">{session?.user.email}</span>
            <div className="flex gap-2">
              <button type="button" onClick={toggleLang} className="min-h-10 flex-1 rounded-lg border border-[#3A4854] font-semibold text-gold-light">
                {tr("English", "عربي")}
              </button>
              <button type="button" onClick={() => browserClient().auth.signOut()} className="min-h-10 flex-1 rounded-lg border border-[#3A4854]">
                {tr("خروج", "Sign out")}
              </button>
            </div>
          </div>
        </nav>
        <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-6 px-5 py-7 md:px-8">{children}</main>
      </div>
    </Ctx>
  );
}
