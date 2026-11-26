"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { browserClient } from "@/lib/supabase";
import { useAdmin } from "@/components/admin/AdminShell";

export default function Login() {
  const { tr } = useAdmin();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const { error } = await browserClient().auth.signInWithPassword({
      email: String(f.get("email")).trim(),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) setError(tr("الإيميل أو الباسورد مش صح.", "Wrong email or password."));
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink p-6">
      <form onSubmit={onSubmit} className="flex w-full max-w-[400px] flex-col gap-4 rounded-2xl bg-white p-8">
        <Image src="/logo.jpg" alt="Alnajaar Sheets" width={96} height={96} className="self-center rounded-xl" priority />
        <h1 className="text-center text-2xl font-bold">{tr("دخول لوحة التحكم", "Admin sign in")}</h1>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {tr("الإيميل", "Email")}
          <input name="email" type="email" required autoComplete="email" dir="ltr" className="h-12 rounded-xl border border-line-2 px-3.5 text-start text-base" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {tr("الباسورد", "Password")}
          <input name="password" type="password" required autoComplete="current-password" dir="ltr" className="h-12 rounded-xl border border-line-2 px-3.5 text-start text-base" />
        </label>
        {error && <p role="alert" className="rounded-lg bg-[#F8E3DD] p-3 text-sm text-[#8E3420]">{error}</p>}
        <button type="submit" disabled={busy} className="h-12 rounded-xl bg-ink font-bold text-gold-pale disabled:opacity-60">
          {busy ? tr("بندخّلك…", "Signing in…") : tr("دخول", "Sign in")}
        </button>
      </form>
    </div>
  );
}
