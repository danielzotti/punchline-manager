"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { FolderKanban, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthorized: boolean;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const intl = useIntl();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Check user authorization in DB
  const checkUserAuthorization = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("authorized_users")
        .select("is_admin")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("Error checking authorization:", error);
        setIsAuthorized(false);
        setIsAdmin(false);

        // If JWT token is invalid or expired (e.g., after a db reset), log out to clear stale session
        const errStatus = (error as any).status;
        if (errStatus === 401 || error.code === "PGRST301" || error.message?.includes("JWT") || error.message?.includes("invalid claim")) {
          console.warn("AuthProvider: Stale/invalid JWT detected. Logging out...");
          await supabase.auth.signOut();
        }

      } else if (data) {
        setIsAuthorized(true);
        setIsAdmin(data.is_admin);
      } else {
        setIsAuthorized(false);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setIsAuthorized(false);
      setIsAdmin(false);
    }
  };


  useEffect(() => {
    // 1. Initial Session Check
    const checkInitialSession = async () => {
      setLoading(true);
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession) {
          document.cookie = `sb-access-token=${initialSession.access_token}; path=/; max-age=${initialSession.expires_in}; SameSite=Lax; Secure`;
          document.cookie = `sb-refresh-token=${initialSession.refresh_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;
        } else {
          document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }

        if (initialSession?.user?.email) {
          await checkUserAuthorization(initialSession.user.email);
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    // 2. Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession) {
          document.cookie = `sb-access-token=${newSession.access_token}; path=/; max-age=${newSession.expires_in}; SameSite=Lax; Secure`;
          document.cookie = `sb-refresh-token=${newSession.refresh_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;
        } else {
          document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }

        if (newSession?.user?.email) {
          setLoading(true);
          await checkUserAuthorization(newSession.user.email);
          setLoading(false);
        } else {
          setIsAuthorized(false);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error signing in with Google:", err);
    }
  };

  const signInWithEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error("Error signing in with Email:", err);
      return { success: false, error: err.message || "Failed to send login email" };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Sleek Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
          <FolderKanban className="w-6 h-6 text-violet-500 absolute" />
        </div>
      </div>
    );
  }


  // Login Screen Component
  function LoginScreen() {
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;
      setEmailLoading(true);
      setEmailError("");
      const res = await signInWithEmail(email.trim());
      setEmailLoading(false);
      if (res.success) {
        setEmailSent(true);
      } else {
        setEmailError(res.error || "Error sending magic link");
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10 flex flex-col items-center">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-4 rounded-2xl text-white shadow-xl shadow-violet-500/25 mb-6">
            <FolderKanban className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
            {intl.formatMessage({ id: "auth.login_title" })}
          </h2>
          <p className="text-slate-400 text-sm mb-6 text-center">
            {intl.formatMessage({ id: "auth.login_subtitle" })}
          </p>

          {/* Google Login Button */}
          <Button
            onClick={signInWithGoogle}
            variant="outline"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold px-5 py-3 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer mb-6 border-0 h-auto"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.99 1 12 1 7.35 1 3.37 3.68 1.48 7.58l3.77 2.92C6.13 7.37 8.84 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.88c2.18-2.01 3.71-4.98 3.71-8.61z"
              />
              <path
                fill="#FBBC05"
                d="M5.25 10.5C5.08 11.23 5 11.99 5 12.75s.08 1.52.25 2.25l-3.77 2.92C.54 16.36 0 14.61 0 12.75s.54-3.61 1.48-5.17l3.77 2.92z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.72-2.88c-1.03.69-2.35 1.11-4.24 1.11-3.16 0-5.87-2.33-6.75-5.46L1.48 15.77C3.37 19.67 7.35 23 12 23z"
              />
            </svg>
            {intl.formatMessage({ id: "auth.sign_in_google" })}
          </Button>

          {/* Divider */}
          <div className="w-full flex items-center gap-3 mb-6">
            <div className="h-[1px] bg-slate-800 flex-1"></div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Oppure / Or</span>
            <div className="h-[1px] bg-slate-800 flex-1"></div>
          </div>

          {/* Dev / Local Fallback: Magic Link */}
          {emailSent ? (
            <div className="w-full text-center bg-violet-600/10 border border-violet-500/20 p-4 rounded-xl text-sm text-violet-300">
              <p className="font-semibold mb-1">Email inviata! / Email sent!</p>
              <p className="text-xs text-slate-400">
                Apri <a href="http://localhost:54324" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline hover:text-violet-300">Inbucket (localhost:54324)</a> per cliccare sul link di accesso.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="w-full space-y-3">
              <div>
                <input
                  type="email"
                  required
                  placeholder="La tua email / Your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-550 outline-none transition-all"
                />
              </div>
              {emailError && <p className="text-red-400 text-xs">{emailError}</p>}
              <Button
                type="submit"
                disabled={emailLoading}
                variant="secondary"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer text-sm border border-slate-750 disabled:opacity-50 h-auto"
              >
                {emailLoading ? "Invio in corso..." : "Accedi con Email (Magic Link)"}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }


  // Access Denied Screen (authenticated but not in authorized list)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/5 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 shadow-2xl relative z-10 flex flex-col items-center">
          <div className="bg-red-500/10 p-4 rounded-2xl text-red-400 border border-red-500/25 mb-6 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3 text-center tracking-tight">
            {intl.formatMessage({ id: "auth.unauthorized_title" })}
          </h2>

          <p className="text-slate-350 text-sm mb-8 text-center leading-relaxed">
            {intl.formatMessage(
              { id: "auth.unauthorized_message" },
              { email: <strong className="text-white font-medium break-all">{user.email}</strong> }
            )}
          </p>

          <Button
            onClick={signOut}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-slate-700 h-auto"
          >
            <LogOut className="w-4 h-4" />
            {intl.formatMessage({ id: "auth.sign_out" })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthorized,
        isAdmin,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
