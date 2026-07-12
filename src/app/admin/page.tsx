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
        <h2 className="text-xl font-bold text-white mb-2">
          {intl.formatMessage({ id: "auth.unauthorized_title" })}
        </h2>
        <p className="text-slate-400 text-sm text-center max-w-md">
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
          <div className="bg-violet-600/10 p-2 rounded-lg text-violet-400 border border-violet-500/25">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {intl.formatMessage({ id: "admin.title" })}
          </h2>
        </div>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl">
          {intl.formatMessage({ id: "admin.subtitle" })}
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/20 text-red-300 p-4 rounded-xl text-sm shadow-md animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl text-sm shadow-md animate-fadeIn">
          <UserCheck className="w-5 h-5 flex-shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Add User Form */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-lg backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-violet-400" />
            {intl.formatMessage({ id: "admin.add_user" })}
          </h3>

          <form onSubmit={handleAddUser} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
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
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
              <input
                type="checkbox"
                id="isAdmin"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded border-slate-850 text-violet-600 focus:ring-violet-500/20 bg-slate-950 cursor-pointer"
              />
              <label htmlFor="isAdmin" className="text-sm text-slate-350 select-none cursor-pointer">
                {intl.formatMessage({ id: "admin.is_admin" })}
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-3 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
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
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-lg backdrop-blur-md overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2" />
              <span className="text-slate-400 text-xs">Loading...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              {intl.formatMessage({ id: "admin.no_users" })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800/80 text-xs uppercase font-semibold text-slate-400 bg-slate-950/30">
                    <th className="px-6 py-4">{intl.formatMessage({ id: "admin.col_email" })}</th>
                    <th className="px-6 py-4">{intl.formatMessage({ id: "admin.col_role" })}</th>
                    <th className="px-6 py-4 text-right">{intl.formatMessage({ id: "admin.col_actions" })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {users.map((u) => {
                    const isSelf = u.email === user?.email;
                    return (
                      <tr key={u.email} className="hover:bg-slate-950/20 transition-colors">
                        <td className="px-6 py-4.5 flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-white break-all">
                            {u.email}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-violet-400 font-medium self-start bg-violet-500/10 px-1.5 py-0.5 rounded">
                              Tu (You)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4.5">
                          {u.is_admin ? (
                            <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold text-violet-400 bg-violet-600/15 border border-violet-500/25 px-2.5 py-1 rounded-full shadow-sm">
                              <Shield className="w-3 h-3" />
                              {intl.formatMessage({ id: "admin.role_admin" })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] md:text-xs font-medium text-slate-450 bg-slate-800 px-2.5 py-1 rounded-full">
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
                                  ? "opacity-40 cursor-not-allowed border-transparent text-slate-600"
                                  : u.is_admin
                                  ? "bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white"
                                  : "bg-violet-600/10 border-violet-500/20 hover:bg-violet-600/20 text-violet-400"
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
                                  ? "opacity-40 cursor-not-allowed border-transparent text-slate-600"
                                  : "bg-slate-900 border-slate-850 hover:bg-red-500/15 hover:border-red-500/25 hover:text-red-400 text-slate-400"
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
          )}
        </div>
      </div>
    </main>
  );
}
