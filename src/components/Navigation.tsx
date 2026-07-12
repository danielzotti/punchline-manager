"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIntl } from "react-intl";
import { useLanguage } from "@/components/IntlProvider";
import { useAuth } from "@/components/AuthProvider";
import { FolderKanban, Tag, Activity, Users, LogOut, Sun, Moon } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const intl = useIntl();
  const { locale, setLocale } = useLanguage();
  const { isAdmin, user, signOut } = useAuth();

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
    }
  };

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

  if (isAdmin) {
    navItems.push({
      href: "/admin",
      label: intl.formatMessage({ id: "tab.admin" }),
      icon: Users,
    });
  }

  return (
    <>
      {/* Top Header */}
      <header className="border-b border-border-ui bg-bg-card/80 backdrop-blur-md sticky top-0 z-40 shadow-sm transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
              <FolderKanban className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold tracking-tight text-text-primary">
                {intl.formatMessage({ id: "app.title" })}
              </h1>
              <p className="text-[10px] md:text-xs text-text-muted hidden md:block xl:hidden">
                {intl.formatMessage({ id: "app.subtitle" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 bg-bg-input/60 p-1 rounded-xl border border-border-ui transition-colors duration-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 font-semibold text-xs rounded-lg transition-all flex items-center gap-2 ${isActive
                      ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shadow-sm"
                      : "border border-transparent text-text-muted hover:text-text-primary"
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-bg-input/60 p-1 rounded-lg border border-border-ui transition-colors duration-200">
              <button
                onClick={() => setLocale("it")}
                className={`px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold transition-all cursor-pointer ${locale === "it"
                  ? "bg-accent-primary text-white shadow shadow-accent-primary/35"
                  : "text-text-muted hover:text-text-primary"
                  }`}
              >
                🇮🇹 IT
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold transition-all cursor-pointer ${locale === "en"
                  ? "bg-accent-primary text-white shadow shadow-accent-primary/35"
                  : "text-text-muted hover:text-text-primary"
                  }`}
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="bg-bg-input/60 hover:bg-bg-input/80 text-text-muted hover:text-text-primary p-2 rounded-lg border border-border-ui transition-all cursor-pointer flex items-center justify-center"
              title={theme === "light" ? "Attiva Dark Mode" : "Attiva Light Mode"}
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center gap-2 border-l border-border-ui pl-3 transition-colors duration-200">
                <span className="text-xs text-text-muted hidden sm:block font-medium truncate max-w-[150px]" title={user.email}>
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="bg-bg-input hover:bg-red-500/10 hover:text-red-500 text-text-muted p-2 rounded-lg border border-border-ui transition-all cursor-pointer"
                  title={intl.formatMessage({ id: "auth.sign_out" })}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 bg-bg-card/90 backdrop-blur-xl border-t border-border-ui py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] px-6 flex justify-around items-center z-50 shadow-2xl transition-colors duration-200">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all py-1.5 px-3 rounded-xl ${isActive
                ? "text-accent-primary scale-105"
                : "text-text-muted active:scale-95"
                }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${isActive ? "bg-accent-primary/10" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] tracking-wide font-medium ${isActive ? "font-semibold text-accent-primary" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
