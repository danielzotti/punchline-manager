import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import QueryProvider from "@/components/QueryProvider";
import { LanguageProvider } from "@/components/IntlProvider";
import { AuthProvider } from "@/components/AuthProvider";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Punchline Manager",
  description: "Catalog and manage your punchlines and jokes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans">
        <QueryProvider>
          <LanguageProvider>
            <AuthProvider>
              <div className="flex-1 flex flex-col pb-24 md:pb-0">
                <Navigation />
                {children}
              </div>
            </AuthProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

