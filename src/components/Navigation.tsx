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
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-violet-600 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {intl.formatMessage({ id: "app.title" })}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {intl.formatMessage({ id: "app.subtitle" })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
          {/* Main Navigation Links */}
          <nav className="flex gap-4 border-b border-transparent md:border-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pb-2 md:pb-0 font-semibold text-sm transition-all border-b-2 md:border-b-0 flex items-center gap-2 ${
                    isActive
                      ? "border-violet-500 text-violet-400 md:text-violet-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-850 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setLocale("it")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                locale === "it"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🇮🇹 IT
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                locale === "en"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
