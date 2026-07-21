"use client";

import React, { useState } from "react";
import { useIntl } from "react-intl";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { cleanPunchlineText } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Database, UploadCloud, DownloadCloud, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function BackupRestorePage() {
  const intl = useIntl();
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle data export
  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      // Fetch user's data from all tables
      const { data: statuses, error: statusesErr } = await supabase.from("statuses").select("*");
      if (statusesErr) throw statusesErr;

      const { data: categories, error: categoriesErr } = await supabase.from("categories").select("*");
      if (categoriesErr) throw categoriesErr;

      const { data: punchlines, error: punchlinesErr } = await supabase.from("punchlines").select("*");
      if (punchlinesErr) throw punchlinesErr;

      const { data: punchlineCategories, error: pcErr } = await supabase.from("punchline_categories").select("*");
      if (pcErr) throw pcErr;

      const { data: collections, error: collectionsErr } = await supabase.from("collections").select("*");
      if (collectionsErr) throw collectionsErr;

      const { data: collectionItems, error: itemsErr } = await supabase.from("collection_items").select("*");
      if (itemsErr) throw itemsErr;

      const backupData = {
        version: 1,
        exported_at: new Date().toISOString(),
        data: {
          statuses: statuses || [],
          categories: categories || [],
          punchlines: punchlines || [],
          punchline_categories: punchlineCategories || [],
          collections: collections || [],
          collection_items: collectionItems || [],
        },
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("download", `punchline_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      success(intl.formatMessage({ id: "backup.export_success" }));
    } catch (err) {
      console.error("Export failed:", err);
      error(intl.formatMessage({ id: "backup.export_error" }));
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle data import/restore
  const handleImport = async () => {
    if (!user || !selectedFile) return;

    const confirmMessage = intl.formatMessage({ id: "backup.import_confirm" });
    if (!window.confirm(confirmMessage)) return;

    setIsImporting(true);
    try {
      const fileText = await selectedFile.text();
      let backup;
      try {
        backup = JSON.parse(fileText);
      } catch (e) {
        throw new Error("Invalid JSON structure");
      }

      // Basic validation
      if (!backup || backup.version !== 1 || !backup.data) {
        error(intl.formatMessage({ id: "backup.invalid_file" }));
        setIsImporting(false);
        return;
      }

      const { data } = backup;
      if (
        !Array.isArray(data.statuses) ||
        !Array.isArray(data.categories) ||
        !Array.isArray(data.punchlines) ||
        !Array.isArray(data.punchline_categories) ||
        !Array.isArray(data.collections) ||
        !Array.isArray(data.collection_items)
      ) {
        error(intl.formatMessage({ id: "backup.invalid_file" }));
        setIsImporting(false);
        return;
      }

      const userId = user.id;

      // 1. Upsert statuses
      if (data.statuses.length > 0) {
        const statusesToInsert = data.statuses.map((s: any) => ({
          id: s.id,
          name: s.name,
          position: s.position,
          color: s.color,
          user_id: userId,
        }));
        const { error: insStatusError } = await supabase.from("statuses").upsert(statusesToInsert);
        if (insStatusError) throw insStatusError;
      }

      // 2. Upsert categories
      if (data.categories.length > 0) {
        const categoriesToInsert = data.categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          user_id: userId,
        }));
        const { error: insCatError } = await supabase.from("categories").upsert(categoriesToInsert);
        if (insCatError) throw insCatError;
      }

      // 3. Upsert punchlines
      if (data.punchlines.length > 0) {
        const punchlinesToInsert = data.punchlines.map((p: any) => ({
          id: p.id,
          text: cleanPunchlineText(p.text),
          notes: p.notes,
          status_id: p.status_id,
          created_at: p.created_at,
          updated_at: p.updated_at,
          user_id: userId,
        }));
        const { error: insPunchError } = await supabase.from("punchlines").upsert(punchlinesToInsert);
        if (insPunchError) throw insPunchError;
      }

      // 4. Upsert punchline categories mappings
      if (data.punchline_categories.length > 0) {
        const pcToInsert = data.punchline_categories.map((pc: any) => ({
          punchline_id: pc.punchline_id,
          category_id: pc.category_id,
        }));
        const { error: insPcError } = await supabase
          .from("punchline_categories")
          .upsert(pcToInsert, { onConflict: "punchline_id,category_id" });
        if (insPcError) throw insPcError;
      }

      // 5. Upsert collections
      if (data.collections.length > 0) {
        const collectionsToInsert = data.collections.map((col: any) => ({
          id: col.id,
          title: col.title,
          date: col.date,
          created_at: col.created_at,
          user_id: userId,
        }));
        const { error: insCollError } = await supabase.from("collections").upsert(collectionsToInsert);
        if (insCollError) throw insCollError;
      }

      // 6. Upsert collection items
      if (data.collection_items.length > 0) {
        const itemsToInsert = data.collection_items.map((ci: any) => ({
          id: ci.id,
          collection_id: ci.collection_id,
          position: ci.position,
          item_type: ci.item_type,
          punchline_id: ci.punchline_id,
          text_content: ci.text_content,
          color: ci.color || null,
        }));
        const { error: insCiError } = await supabase.from("collection_items").upsert(itemsToInsert);
        if (insCiError) throw insCiError;
      }

      // Invalidate react query cache
      queryClient.invalidateQueries({ queryKey: ["punchlines"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["statuses"] });

      success(intl.formatMessage({ id: "backup.import_success" }));
      setSelectedFile(null);
    } catch (err) {
      console.error("Import failed:", err);
      error(intl.formatMessage({ id: "backup.import_error" }));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title={intl.formatMessage({ id: "backup.title" })}
          description={intl.formatMessage({ id: "backup.subtitle" })}
          icon={<Database />}
        />

        <div className="grid gap-6">
          {/* Export Card */}
          <Card className="bg-bg-card border border-border-ui shadow-sm overflow-hidden rounded-2xl transition-all duration-200">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-bold text-text-primary">
                {intl.formatMessage({ id: "backup.export_section" })}
              </CardTitle>
              <CardDescription className="text-xs text-text-muted mt-1">
                {intl.formatMessage({ id: "backup.export_description" })}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 flex justify-start">
              <Button
                onClick={handleExport}
                disabled={isExporting || isImporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <DownloadCloud className="w-4 h-4" />
                )}
                {intl.formatMessage({ id: "backup.export_button" })}
              </Button>
            </CardContent>
          </Card>

          {/* Import/Restore Card */}
          <Card className="bg-bg-card border border-border-ui shadow-sm overflow-hidden rounded-2xl transition-all duration-200">
            <CardHeader className="p-6">
              <CardTitle className="text-base font-bold text-text-primary">
                {intl.formatMessage({ id: "backup.import_section" })}
              </CardTitle>
              <CardDescription className="text-xs text-text-muted mt-1">
                {intl.formatMessage({ id: "backup.import_description" })}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              {/* Warning box */}
              <div className="flex gap-3 bg-amber-500/10 border border-amber-500/25 p-4 rounded-xl text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  {intl.formatMessage({ id: "backup.import_warning" })}
                </p>
              </div>

              {/* Upload area */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    id="backup-file-input"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isImporting || isExporting}
                  />
                  <div className="flex items-center justify-between bg-bg-input border border-border-ui rounded-xl px-4 py-2.5 text-xs text-text-muted-light">
                    <span className="truncate max-w-[200px] sm:max-w-xs">
                      {selectedFile ? selectedFile.name : "Seleziona file JSON..."}
                    </span>
                    <UploadCloud className="w-4 h-4 shrink-0 text-text-muted" />
                  </div>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting || isExporting}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  {intl.formatMessage({ id: "backup.import_button" })}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
