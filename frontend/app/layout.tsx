
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoDrive - Showroom Mobil",
  description:
    "Temukan mobil terbaik sesuai kebutuhan dan anggaran Anda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense
  fallback={
    <div
      className="h-16 w-full border-b border-slate-200 bg-white"
      aria-hidden="true"
    />
  }
>
  <Navbar />
</Suspense>
        {children}
        <Footer />
      </body>
    </html>
  );
}
