"use client";

import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  ShieldAlert, 
  UserCheck, 
  Loader2, 
  Mail,
  AlertCircle
} from "lucide-react";

interface AuthorizedUser {
  email: string;
  is_admin: boolean;
  created_at: string;
}

export default function AdminPage() {
  const intl = useIntl();
  const { user, isAdmin } = useAuth();
  
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [newEmail, setNewEmail] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase
        .from("authorized_users")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load authorized users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase
        .from("authorized_users")
        .insert([{ 
          email: newEmail.trim().toLowerCase(), 
          is_admin: newIsAdmin 
        }]);

      if (error) throw error;

      setSuccessMsg(intl.formatMessage({ id: "admin.success_added" }));
      setNewEmail("");
      setNewIsAdmin(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error adding user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAdmin = async (targetUser: AuthorizedUser) => {
    // Prevent self-demotion
    if (targetUser.email === user?.email) {
      setErrorMsg(intl.formatMessage({ id: "admin.error_self_demote" }));
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const nextIsAdmin = !targetUser.is_admin;
      const { error } = await supabase
        .from("authorized_users")
        .update({ is_admin: nextIsAdmin })
        .eq("email", targetUser.email);

      if (error) throw error;

      setSuccessMsg(intl.formatMessage({ id: "admin.success_updated" }));
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error updating user role");
    }
  };

  const handleDeleteUser = async (targetUser: AuthorizedUser) => {
    // Prevent self-deletion
    if (targetUser.email === user?.email) {
      setErrorMsg(intl.formatMessage({ id: "admin.error_self_delete" }));
      return;
    }

    if (!confirm(intl.formatMessage({ id: "confirm.delete" }))) {
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase
        .from("authorized_users")
        .delete()
        .eq("email", targetUser.email);

      if (error) throw error;

      setSuccessMsg(intl.formatMessage({ id: "admin.success_deleted" }));
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error deleting user");
    }
  };

  // Safe Guard if non-admin somehow bypasses or hits direct route
  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {intl.formatMessage({ id: "auth.unauthorized_title" })}
        </h2>
        <p className="text-text-muted text-sm text-center max-w-md">
          {intl.formatMessage({ id: "auth.unauthorized_message" }, { email: user?.email })}
        </p>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 md:py-12 flex-1 w-full flex flex-col gap-8">
      {/* Title & Description */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-violet-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            {intl.formatMessage({ id: "admin.title" })}
          </h2>
        </div>
        <p className="text-text-muted text-sm md:text-base max-w-2xl">
          {intl.formatMessage({ id: "admin.subtitle" })}
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-300 p-4 rounded-xl text-sm shadow-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-300 p-4 rounded-xl text-sm shadow-sm animate-fadeIn">
          <UserCheck className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <p>{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Add User Form */}
        <div className="bg-bg-card border border-border-ui rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-accent-primary" />
            {intl.formatMessage({ id: "admin.add_user" })}
          </h3>

          <form onSubmit={handleAddUser} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                {intl.formatMessage({ id: "admin.col_email" })}
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  required
                  placeholder={intl.formatMessage({ id: "admin.email_placeholder" })}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-bg-input border border-border-input focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 rounded-xl px-4 py-3 pl-10 text-sm text-text-primary placeholder-text-muted-light outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-text-muted-light absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-bg-input/50 p-3 rounded-xl border border-border-input">
              <input
                type="checkbox"
                id="isAdmin"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded border-border-input text-accent-primary focus:ring-accent-primary/20 bg-bg-input cursor-pointer"
              />
              <label htmlFor="isAdmin" className="text-sm text-text-primary select-none cursor-pointer">
                {intl.formatMessage({ id: "admin.is_admin" })}
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-accent-primary hover:bg-accent-hover text-white font-semibold px-4 py-3 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {intl.formatMessage({ id: "admin.add_user" })}
            </button>
          </form>
        </div>

        {/* Authorized Users List */}
        <div className="lg:col-span-2 bg-bg-card border border-border-ui rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-2" />
              <span className="text-text-muted text-xs">Loading...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-sm">
              {intl.formatMessage({ id: "admin.no_users" })}
            </div>
          ) : (
            <div className="divide-y divide-border-ui">
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border-ui text-xs uppercase font-semibold text-text-muted bg-bg-input/30">
                      <th className="px-6 py-4">{intl.formatMessage({ id: "admin.col_email" })}</th>
                      <th className="px-6 py-4">{intl.formatMessage({ id: "admin.col_role" })}</th>
                      <th className="px-6 py-4 text-right">{intl.formatMessage({ id: "admin.col_actions" })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ui">
                    {users.map((u) => {
                      const isSelf = u.email === user?.email;
                      return (
                        <tr key={u.email} className="hover:bg-bg-input/20 transition-colors">
                          <td className="px-6 py-4.5 flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-text-primary break-all">
                              {u.email}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] text-accent-primary font-medium self-start bg-accent-primary/10 px-1.5 py-0.5 rounded">
                                Tu (You)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4.5">
                            {u.is_admin ? (
                              <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold text-accent-primary bg-accent-primary/10 border border-accent-primary/20 px-2.5 py-1 rounded-full shadow-sm">
                                <Shield className="w-3 h-3" />
                                {intl.formatMessage({ id: "admin.role_admin" })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] md:text-xs font-medium text-text-muted bg-bg-input border border-border-ui px-2.5 py-1 rounded-full">
                                {intl.formatMessage({ id: "admin.role_user" })}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleToggleAdmin(u)}
                                disabled={isSelf}
                                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                                  isSelf
                                    ? "opacity-30 cursor-not-allowed border-transparent text-text-muted-light"
                                    : u.is_admin
                                    ? "bg-bg-input border-border-input hover:bg-bg-card text-text-muted hover:text-text-primary"
                                    : "bg-accent-primary/10 border-accent-primary/20 hover:bg-accent-primary/20 text-accent-primary"
                                }`}
                                title={
                                  u.is_admin
                                    ? intl.formatMessage({ id: "admin.remove_admin" })
                                    : intl.formatMessage({ id: "admin.make_admin" })
                                }
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={isSelf}
                                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                                  isSelf
                                    ? "opacity-30 cursor-not-allowed border-transparent text-text-muted-light"
                                    : "bg-bg-input border-border-input hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-650 text-text-muted"
                                }`}
                                title={intl.formatMessage({ id: "admin.delete" })}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card view */}
              <div className="block md:hidden divide-y divide-border-ui">
                {users.map((u) => {
                  const isSelf = u.email === user?.email;
                  return (
                    <div key={u.email} className="p-5 flex flex-col gap-4 hover:bg-bg-input/10 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          {intl.formatMessage({ id: "admin.col_email" })}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary break-all">
                            {u.email}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-accent-primary font-medium bg-accent-primary/10 px-1.5 py-0.5 rounded">
                              Tu (You)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-border-ui/50">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            {intl.formatMessage({ id: "admin.col_role" })}
                          </span>
                          {u.is_admin ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-primary bg-accent-primary/10 border border-accent-primary/20 px-2.5 py-1 rounded-full shadow-sm w-fit">
                              <Shield className="w-3 h-3" />
                              {intl.formatMessage({ id: "admin.role_admin" })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-medium text-text-muted bg-bg-input border border-border-ui px-2.5 py-1 rounded-full w-fit">
                              {intl.formatMessage({ id: "admin.role_user" })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            disabled={isSelf}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelf
                                ? "opacity-30 cursor-not-allowed border-transparent text-text-muted-light"
                                : u.is_admin
                                ? "bg-bg-input border-border-input hover:bg-bg-card text-text-muted hover:text-text-primary"
                                : "bg-accent-primary/10 border-accent-primary/20 hover:bg-accent-primary/20 text-accent-primary"
                            }`}
                            title={
                              u.is_admin
                                ? intl.formatMessage({ id: "admin.remove_admin" })
                                : intl.formatMessage({ id: "admin.make_admin" })
                            }
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isSelf}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelf
                                ? "opacity-30 cursor-not-allowed border-transparent text-text-muted-light"
                                : "bg-bg-input border-border-input hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-650 text-text-muted"
                            }`}
                            title={intl.formatMessage({ id: "admin.delete" })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
