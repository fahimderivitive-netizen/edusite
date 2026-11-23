import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Inter, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
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
  title: "EduSite — Online Courses",
  description: "Learn new skills with high-quality online courses from expert instructors.",
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
        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-zinc-500">
            &copy; EduSite
          </div>
        </footer>
      </body>
    </html>
  );
}
