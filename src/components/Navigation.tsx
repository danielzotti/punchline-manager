"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIntl } from "react-intl";
import { useLanguage } from "@/components/IntlProvider";
import { FolderKanban, Tag, Activity } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const intl = useIntl();
  const { locale, setLocale } = useLanguage();

  const navItems = [
    {
      href: "/punchlines",
      label: intl.formatMessage({ id: "tab.punchlines" }),
      icon: FolderKanban,
    },
    {
      href: "/categories",
      label: intl.formatMessage({ id: "tab.categories" }),
      icon: Tag,
    },
    {
      href: "/statuses",
      label: intl.formatMessage({ id: "tab.statuses" }),
      icon: Activity,
    },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="border-b border-slate-800/65 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
              <FolderKanban className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold tracking-tight text-white bg-clip-text">
                {intl.formatMessage({ id: "app.title" })}
              </h1>
              <p className="text-[10px] md:text-xs text-slate-400 hidden sm:block">
                {intl.formatMessage({ id: "app.subtitle" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 font-semibold text-xs rounded-lg transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-violet-600/15 text-violet-400 border border-violet-500/25 shadow-sm"
                        : "border border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80">
              <button
                onClick={() => setLocale("it")}
                className={`px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold transition-all cursor-pointer ${
                  locale === "it"
                    ? "bg-violet-600 text-white shadow shadow-violet-500/35"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🇮🇹 IT
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold transition-all cursor-pointer ${
                  locale === "en"
                    ? "bg-violet-600 text-white shadow shadow-violet-500/35"
                    : "text-slate-400 hover:text-slate-250"
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-850 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] px-6 flex justify-around items-center z-50 shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all py-1.5 px-3 rounded-xl ${
                isActive
                  ? "text-violet-400 scale-105"
                  : "text-slate-400 active:scale-95"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${isActive ? "bg-violet-500/10" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] tracking-wide font-medium ${isActive ? "font-semibold text-violet-400" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
