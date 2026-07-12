"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIntl } from "react-intl";
import { useLanguage } from "@/components/IntlProvider";
import { useAuth } from "@/components/AuthProvider";
import { FolderKanban, Tag, Activity, Users, LogOut, Sun, Moon, User, Maximize, Minimize, ChevronDown, Globe } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const intl = useIntl();
  const { locale, setLocale } = useLanguage();
  const { isAdmin, user, signOut } = useAuth();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

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

            {/* User Profile Dropdown Menu */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 bg-bg-input/60 hover:bg-bg-input/80 text-text-muted hover:text-text-primary px-3 py-1.5 rounded-xl border border-border-ui transition-all cursor-pointer select-none"
                  title="Profile Menu"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                    {user.email ? user.email.charAt(0) : <User className="w-3 h-3" />}
                  </div>
                  <span className="text-xs font-semibold hidden sm:inline-block">
                    {user.email ? user.email : "User"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-bg-card border border-border-ui rounded-2xl shadow-xl z-50 py-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Header */}
                    <div className="px-4 pb-2 border-b border-border-ui/60 flex flex-col">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                        {intl.formatMessage({ id: "profile.logged_in_as", defaultMessage: "Logged in as" })}
                      </span>
                      <span className="text-sm font-semibold text-text-primary truncate" title={user.email}>
                        {user.email}
                      </span>
                    </div>

                    {/* Options list */}
                    <div className="flex flex-col gap-1 px-2">
                      {/* Fullscreen Toggle */}
                      <button
                        onClick={toggleFullscreen}
                        className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-input/60 rounded-xl transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                          {isFullscreen
                            ? intl.formatMessage({ id: "fullscreen.exit", defaultMessage: "Esci da Schermo Intero" })
                            : intl.formatMessage({ id: "fullscreen.enter", defaultMessage: "Schermo Intero" })}
                        </span>
                      </button>

                      {/* Theme Selector */}
                      <button
                        onClick={toggleTheme}
                        className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-input/60 rounded-xl transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                          {theme === "light"
                            ? intl.formatMessage({ id: "theme.dark", defaultMessage: "Tema Scuro" })
                            : intl.formatMessage({ id: "theme.light", defaultMessage: "Tema Chiaro" })}
                        </span>
                      </button>

                      {/* Language Selection */}
                      <div className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-text-muted">
                        <span className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {intl.formatMessage({ id: "language.title", defaultMessage: "Lingua" })}
                        </span>
                        <div className="flex items-center gap-0.5 bg-bg-input/60 p-0.5 rounded-lg border border-border-ui">
                          <button
                            onClick={() => setLocale("it")}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${locale === "it"
                              ? "bg-accent-primary text-white shadow"
                              : "text-text-muted hover:text-text-primary"
                              }`}
                          >
                            IT
                          </button>
                          <button
                            onClick={() => setLocale("en")}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${locale === "en"
                              ? "bg-accent-primary text-white shadow"
                              : "text-text-muted hover:text-text-primary"
                              }`}
                          >
                            EN
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sign Out Button */}
                    <div className="px-2 pt-2 border-t border-border-ui/60">
                      <button
                        onClick={signOut}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        {intl.formatMessage({ id: "auth.sign_out" })}
                      </button>
                    </div>
                  </div>
                )}
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
