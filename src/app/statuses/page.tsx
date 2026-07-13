"use client";

import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Plus, Edit2, Trash2, GripVertical, Activity } from "lucide-react";
import { useStatuses, Status } from "@/hooks/useStatuses";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { NoData } from "@/components/ui/NoData";

export default function StatusesPage() {
  const intl = useIntl();

  // Status State
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#6366f1");
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [editStatusName, setEditStatusName] = useState("");
  const [editStatusColor, setEditStatusColor] = useState("");

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchTargetIndex, setTouchTargetIndex] = useState<number | null>(null);

  const {
    statuses,
    isLoading: loadingStatuses,
    createStatus,
    updateStatus,
    updateStatuses,
    deleteStatus,
  } = useStatuses();

  // Add Status Handler
  const handleAddStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;
    try {
      await createStatus({
        name: newStatusName.trim(),
        color: newStatusColor,
        position: statuses.length + 1,
      });
      setNewStatusName("");
      setNewStatusColor("#6366f1");
    } catch (err) {
      console.error(err);
    }
  };

  // Update Status Handler
  const handleUpdateStatus = async (id: string) => {
    if (!editStatusName.trim()) return;
    try {
      await updateStatus({
        id,
        name: editStatusName.trim(),
        color: editStatusColor,
      });
      setEditingStatus(null);
      setEditStatusName("");
      setEditStatusColor("");
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Status Handler
  const handleDeleteStatus = async (id: string) => {
    if (confirm(intl.formatMessage({ id: "confirm.delete" }))) {
      try {
        await deleteStatus(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Reorder Handler
  const performReorder = async (draggedIdx: number, targetIdx: number) => {
    const reordered = [...statuses];
    const [draggedItem] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, draggedItem);

    // Map new positions (1 to N)
    const updates = reordered.map((item, idx) => ({
      id: item.id,
      position: idx + 1,
    }));

    try {
      await updateStatuses(updates);
    } catch (err) {
      console.error("Failed to update status positions:", err);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    await performReorder(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  // Touch Handlers for Mobile Reorder
  const handleTouchStart = (index: number) => {
    setDraggedIndex(index);
    setTouchTargetIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIndex === null) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    const container = element.closest("[data-index]");
    if (container) {
      const idxAttr = container.getAttribute("data-index");
      if (idxAttr !== null) {
        const targetIdx = parseInt(idxAttr, 10);
        if (targetIdx !== draggedIndex) {
          setTouchTargetIndex(targetIdx);
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (draggedIndex !== null && touchTargetIndex !== null && draggedIndex !== touchTargetIndex) {
      await performReorder(draggedIndex, touchTargetIndex);
    }
    setDraggedIndex(null);
    setTouchTargetIndex(null);
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title={intl.formatMessage({ id: "status.manage" })}
          description={intl.formatMessage({ id: "status.subtitle", defaultMessage: "Manage workflow statuses and drag to reorder them." })}
          icon={<Activity />}
        />

        {/* Quick Add Form */}
        <form onSubmit={handleAddStatus} className="flex flex-row gap-3 bg-bg-card p-4 border border-border-ui rounded-2xl items-center shadow-sm transition-all duration-200">
          <div className="w-full">
            <input
              type="text"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              placeholder={intl.formatMessage({ id: "status.name" })}
              className="w-full bg-bg-input border border-border-ui rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted-light focus:outline-none focus:border-accent-primary transition-all duration-200"
            />
          </div>
          <div className="flex w-auto justify-end gap-3">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border-ui bg-bg-input flex items-center justify-center cursor-pointer shadow-inner">
                <input
                  type="color"
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value)}
                  className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="ml-auto sm:ml-0 md:min-w-[150px]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">{intl.formatMessage({ id: "status.add" })}</span>
            </Button>
          </div>
        </form>

        {/* List */}
        {loadingStatuses ? (
          <div className="text-center text-text-muted py-12">{intl.formatMessage({ id: "common.loading", defaultMessage: "Loading..." })}</div>
        ) : (
          <div className="bg-bg-card border border-border-ui rounded-2xl divide-y divide-border-ui overflow-hidden shadow-sm transition-all duration-200">
            {statuses.map((stat, index) => (
              <div
                key={stat.id}
                data-index={index}
                draggable="true"
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`p-4 flex items-center justify-between transition-colors duration-200 group hover:bg-bg-input/30 ${draggedIndex === index
                  ? "opacity-35 bg-bg-input/80 border-t border-b border-accent-primary/20 scale-[0.99] shadow-inner"
                  : touchTargetIndex === index
                    ? "bg-accent-primary/10 border border-dashed border-accent-primary/40 scale-[1.01]"
                    : ""
                  }`}
              >
                {editingStatus?.id === stat.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center">
                    <input
                      type="text"
                      value={editStatusName}
                      onChange={(e) => setEditStatusName(e.target.value)}
                      className="w-full sm:flex-1 bg-bg-input border border-border-ui rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-all duration-200"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editStatusColor}
                        onChange={(e) => setEditStatusColor(e.target.value)}
                        className="w-8 h-8 rounded border border-border-ui bg-transparent cursor-pointer"
                      />
                      <span className="text-xs text-text-muted">{intl.formatMessage({ id: "status.color_label", defaultMessage: "Colore:" })}</span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <Button
                        onClick={() => handleUpdateStatus(stat.id)}
                        variant="default"
                        size="sm"
                      >
                        {intl.formatMessage({ id: "button.save" })}
                      </Button>
                      <Button
                        onClick={() => setEditingStatus(null)}
                        variant="outline"
                        size="sm"
                      >
                        {intl.formatMessage({ id: "button.cancel" })}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3.5 select-none">
                      <div
                        onTouchStart={() => handleTouchStart(index)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className="cursor-grab text-text-muted-light hover:text-text-muted py-2 pr-1 active:cursor-grabbing"
                        style={{ touchAction: "none" }}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-text-muted-light font-mono w-5">
                        {index + 1}.
                      </span>
                      <span
                        className="w-3 h-3 rounded-full border border-border-ui/50 shadow-inner min-w-3"
                        style={{ backgroundColor: stat.color, boxShadow: `0 0 8px ${stat.color}30` }}
                      />
                      <span className="text-text-primary font-medium text-sm break-all">
                        {stat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        onClick={() => {
                          setEditingStatus(stat);
                          setEditStatusName(stat.name);
                          setEditStatusColor(stat.color);
                        }}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-bg-input text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer h-8 w-8"
                        title={intl.formatMessage({ id: "button.edit" })}
                      >
                        <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteStatus(stat.id)}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-colors cursor-pointer h-8 w-8"
                        title={intl.formatMessage({ id: "button.delete" })}
                      >
                        <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {statuses.length === 0 && (
              <NoData
                icon={Activity}
                title={intl.formatMessage({ id: "status.no_statuses" })}
                description={intl.formatMessage({ id: "status.no_statuses_description" })}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
