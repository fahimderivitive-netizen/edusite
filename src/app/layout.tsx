import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Inter, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
export const instant = false;

const heading = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const bangla = Hind_Siliguri({
  variable: "--font-bn",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Quark of Education — Online Courses", template: "%s | Quark of Education" },
  description: "Dedicated to excellence. High-quality online courses from Quark of Education.",
  applicationName: "Quark of Education",
  openGraph: { siteName: "Quark of Education", type: "website", locale: "bn_BD" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${heading.variable} ${body.variable} ${bangla.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#09090B] font-sans text-zinc-100">
        <Suspense fallback={<div className="sticky top-0 z-50 h-16 border-b border-white/10 bg-[#09090B]/80" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">
          <Suspense>{children}</Suspense>
        </main>
        <Suspense fallback={<footer className="h-24 border-t border-white/10" />}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
