import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { AdminHeader } from "@/components/admin/AdminHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TAKUMI BLOG",
  description: "Web Engineer / Developer",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/">
              <p className="text-2xl font-bold text-zinc-900">Portfolio Blog</p>
            </Link>
            <AdminHeader />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
