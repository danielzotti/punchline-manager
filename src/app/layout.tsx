import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import "./globals.css";

import QueryProvider from "@/components/QueryProvider";
import { LanguageProvider } from "@/components/IntlProvider";
import { AuthProvider } from "@/components/AuthProvider";
import Navigation from "@/components/Navigation";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
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
      className={`${roboto.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script id="theme-init">
          {`
            (function() {
              try {
                const theme = localStorage.getItem('theme');
                const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.classList.toggle('dark', isDark);
                document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
              } catch (_) {}
            })();
          `}
        </script>
      </head>
      <body className="min-h-full bg-bg-primary text-text-primary flex flex-col font-sans transition-colors duration-200">
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

