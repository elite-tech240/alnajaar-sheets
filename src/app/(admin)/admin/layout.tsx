import type { Metadata } from "next";
import "../../fonts";
import "../../globals.css";
import { AdminShell } from "@/components/admin/AdminShell";


export const metadata: Metadata = {
  title: "Admin · Alnajaar Sheets",
  robots: { index: false, follow: false },
  icons: { icon: "/logo.jpg" },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="ar" dir="rtl" className="antialiased" suppressHydrationWarning>
      <body className="min-h-dvh bg-[#F5F3EE] font-sans">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
