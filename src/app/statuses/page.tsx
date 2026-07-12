"use client";

import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { useStatuses, Status } from "@/hooks/useStatuses";

export default function StatusesPage() {
  const intl = useIntl();

  // Status State
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#6366f1");
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [editStatusName, setEditStatusName] = useState("");
  const [editStatusColor, setEditStatusColor] = useState("");

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
      await deleteStatus(id);
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

    const reordered = [...statuses];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    // Map new positions (1 to N)
    const updates = reordered.map((item, idx) => ({
      id: item.id,
      position: idx + 1,
    }));

    try {
      await updateStatuses(updates);
    } catch (err) {
      console.error("Failed to update status positions:", err);
    } finally {
      setDraggedIndex(null);
    }
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-lg font-bold text-white mb-2">
          {intl.formatMessage({ id: "status.manage" })}
        </h2>

        {/* Quick Add Form */}
        <form onSubmit={handleAddStatus} className="flex flex-col sm:flex-row gap-3 bg-slate-900/50 p-4 border border-slate-850 rounded-xl items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              placeholder={intl.formatMessage({ id: "status.name" })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-xs text-slate-400 font-semibold uppercase">Colore:</label>
            <input
              type="color"
              value={newStatusColor}
              onChange={(e) => setNewStatusColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-slate-950 border border-slate-800 p-0.5"
            />
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow transition-all active:scale-95 ml-auto sm:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {intl.formatMessage({ id: "status.add" })}
            </button>
          </div>
        </form>

        {/* List */}
        {loadingStatuses ? (
          <div className="text-center text-slate-400 py-6">Loading...</div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-850 rounded-xl divide-y divide-slate-800">
            {statuses.map((stat, index) => (
              <div
                key={stat.id}
                draggable="true"
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`p-4 flex items-center justify-between transition-colors ${
                  draggedIndex === index ? "opacity-40 bg-slate-800/20" : "hover:bg-slate-900/10"
                }`}
              >
                {editingStatus?.id === stat.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-3 items-center">
                    <input
                      type="text"
                      value={editStatusName}
                      onChange={(e) => setEditStatusName(e.target.value)}
                      className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-1 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <input
                        type="color"
                        value={editStatusColor}
                        onChange={(e) => setEditStatusColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-slate-950 border border-slate-800 p-0.5"
                      />
                      <button
                        onClick={() => handleUpdateStatus(stat.id)}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg text-xs font-semibold"
                      >
                        {intl.formatMessage({ id: "button.save" })}
                      </button>
                      <button
                        onClick={() => setEditingStatus(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg text-xs font-semibold"
                      >
                        {intl.formatMessage({ id: "button.cancel" })}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab text-slate-500 hover:text-slate-300 py-1 pr-1 active:cursor-grabbing">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-slate-500 font-mono w-5">
                        {index + 1}.
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-750/50 shadow-inner"
                        style={{ backgroundColor: stat.color }}
                      />
                      <span className="text-slate-200 font-medium text-sm">
                        {stat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingStatus(stat);
                          setEditStatusName(stat.name);
                          setEditStatusColor(stat.color);
                        }}
                        className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStatus(stat.id)}
                        className="p-1.5 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
