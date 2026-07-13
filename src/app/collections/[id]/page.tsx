'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { getCollectionById, updateCollection, updateCollectionItems, deleteCollection } from '@/app/actions/collections';
import { GripVertical, Plus, Trash2, Edit2, Save, FileText, Eye, X } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/navigation';

interface CollectionItemProps {
  index: number;
  item: any;
  onRemove: (id: string) => void;
  onUpdateText: (id: string, newText: string) => void;
  isDragged: boolean;
  isTouchTarget: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onTouchStart: () => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

function CollectionItem({
  index,
  item,
  onRemove,
  onUpdateText,
  isDragged,
  isTouchTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}: CollectionItemProps) {
  const intl = useIntl();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.text_content || '');

  const isPunchline = item.item_type === 'punchline';

  return (
    <div
      data-index={index}
      draggable="true"
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex items-start gap-3 p-4 bg-bg-card border border-border-ui rounded-xl shadow-sm mb-3 transition-all duration-150 ${isDragged
          ? "opacity-35 bg-bg-input/80 border-t border-b border-accent-primary/20 scale-[0.99] shadow-inner"
          : isTouchTarget
            ? "bg-accent-primary/10 border border-dashed border-accent-primary/40 scale-[1.01]"
            : ""
        }`}
    >
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="mt-1 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary touch-none select-none py-1 pr-1"
        style={{ touchAction: "none" }}
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        {isPunchline ? (
          <div>
            <span className="text-xs font-bold text-accent-primary uppercase mb-1 block">Punchline</span>
            <div dangerouslySetInnerHTML={{ __html: item.punchline?.text || '' }} className="rich-text-content text-sm text-text-primary" />
          </div>
        ) : (
          <div>
            <span className="text-xs font-bold text-blue-500 uppercase mb-1 block">{intl.formatMessage({ id: "collections.linked_text" })}</span>
            {isEditing ? (
              <div className="space-y-2">
                <RichTextEditor value={text} onChange={setText} />
                <button
                  onClick={() => {
                    onUpdateText(item.id, text);
                    setIsEditing(false);
                  }}
                  className="bg-accent-primary text-white text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  {intl.formatMessage({ id: "button.save" })}
                </button>
              </div>
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: item.text_content || '' }}
                className="rich-text-content text-sm text-text-primary cursor-pointer hover:bg-bg-input p-2 rounded-lg transition-colors border border-transparent hover:border-border-ui"
                onClick={() => setIsEditing(true)}
              />
            )}
          </div>
        )}
      </div>
      <button onClick={() => onRemove(item.id)} className="text-text-muted hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const intl = useIntl();
  const router = useRouter();
  const { id } = use(params);
  const [collection, setCollection] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchTargetIndex, setTouchTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    loadCollection();
  }, [id]);

  const loadCollection = async () => {
    try {
      const data = await getCollectionById(id);
      setCollection(data);
      setTitle(data.title);
      setDate(data.date.split('T')[0]); // YYYY-MM-DD
      const sortedItems = [...(data.collection_items || [])].sort((a, b) => a.position - b.position);
      setItems(sortedItems);
    } catch (err) {
      console.error(err);
    }
  };

  const performReorder = (draggedIdx: number, targetIdx: number) => {
    setItems((prevItems) => {
      const reordered = [...prevItems];
      const [draggedItem] = reordered.splice(draggedIdx, 1);
      reordered.splice(targetIdx, 0, draggedItem);
      return reordered;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    performReorder(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

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

  const handleTouchEnd = () => {
    if (draggedIndex !== null && touchTargetIndex !== null && draggedIndex !== touchTargetIndex) {
      performReorder(draggedIndex, touchTargetIndex);
    }
    setDraggedIndex(null);
    setTouchTargetIndex(null);
  };

  const handleDelete = async () => {
    if (confirm(intl.formatMessage({ id: 'confirm.delete' }))) {
      try {
        await deleteCollection(id);
        router.push('/collections');
      } catch (err) {
        console.error(err);
        alert(intl.formatMessage({ id: 'collections.error_delete' }));
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateCollection(id, title, new Date(date).toISOString());

      const itemsToSave = items.map((item, idx) => ({
        ...item,
        position: idx
      }));
      await updateCollectionItems(id, itemsToSave);

      alert(intl.formatMessage({ id: 'collections.success_save' }));
    } catch (err) {
      console.error(err);
      alert(intl.formatMessage({ id: 'collections.error_save' }));
    } finally {
      setIsSaving(false);
    }
  };

  const addLinkedText = () => {
    const newItem = {
      id: `temp-${Date.now()}`,
      item_type: 'linked_text',
      text_content: intl.formatMessage({ id: 'collections.new_linked_text' }),
      position: items.length
    };
    setItems([...items, newItem]);
  };

  const removeItem = (itemId: string) => {
    if (confirm(intl.formatMessage({ id: 'collections.confirm_remove_item' }))) {
      setItems(items.filter(i => i.id !== itemId));
    }
  };

  const updateItemText = (itemId: string, newText: string) => {
    setItems(items.map(i => i.id === itemId ? { ...i, text_content: newText } : i));
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: id })
      });
      if (!res.ok) throw new Error(intl.formatMessage({ id: 'collections.export_failed' }));
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.pdf`;
      a.click();
    } catch (err) {
      console.error(err);
      alert(intl.formatMessage({ id: 'collections.error_export_pdf' }));
    } finally {
      setIsExporting(false);
    }
  };

  if (!collection) return <div className="p-8 text-center text-text-muted">{intl.formatMessage({ id: 'common.loading' })}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="bg-bg-card p-6 rounded-2xl border border-border-ui shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted-light tracking-wider">{intl.formatMessage({ id: 'collections.label_title' })}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl md:text-2xl font-bold bg-transparent border-b border-transparent hover:border-border-ui focus:border-accent-primary focus:outline-none w-full pb-1 transition-colors text-text-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-text-muted-light tracking-wider">{intl.formatMessage({ id: 'collections.label_date' })}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm text-text-muted bg-transparent border-b border-transparent hover:border-border-ui focus:border-accent-primary focus:outline-none pb-1 transition-colors w-full sm:w-auto"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 items-stretch sm:items-center lg:items-stretch xl:items-center justify-end w-full lg:w-auto self-end">
            <div className="flex gap-2 flex-1 sm:flex-none">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-bg-input hover:bg-bg-input/80 border border-border-ui rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" /> {intl.formatMessage({ id: 'collections.preview' })}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-bg-input hover:bg-bg-input/80 border border-border-ui rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{intl.formatMessage({ id: 'collections.exporting' })}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" /> {intl.formatMessage({ id: 'collections.export_pdf' })}
                  </>
                )}
              </button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleDelete}
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> {intl.formatMessage({ id: 'button.delete' })}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 sm:flex-none justify-center px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? intl.formatMessage({ id: 'collections.saving' }) : intl.formatMessage({ id: 'button.save' })}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-2">
        <h3 className="font-bold text-text-primary text-lg">{intl.formatMessage({ id: 'collections.elements' })}</h3>
        <button
          onClick={addLinkedText}
          className="text-accent-primary hover:text-accent-primary/80 font-semibold text-sm flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {intl.formatMessage({ id: 'collections.add_linked_text' })}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <CollectionItem
            key={item.id}
            index={index}
            item={item}
            onRemove={removeItem}
            onUpdateText={updateItemText}
            isDragged={draggedIndex === index}
            isTouchTarget={touchTargetIndex === index}
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            onTouchStart={() => handleTouchStart(index)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        ))}
        {items.length === 0 && (
          <p className="text-center text-text-muted py-8">{intl.formatMessage({ id: 'collections.no_elements' })}</p>
        )}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-fade-in">
          <div className="bg-bg-card border border-border-ui rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            <div className="px-6 py-4 border-b border-border-ui flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">{intl.formatMessage({ id: 'collections.preview_title' })}</h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-text-muted hover:text-text-primary p-1.5 hover:bg-bg-input rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto flex-1 bg-neutral-100 dark:bg-neutral-900 flex justify-center">
              <div className="bg-white text-black p-8 md:p-12 shadow-lg w-full max-w-[210mm] min-h-[297mm] font-sans border border-neutral-300 rounded-sm">
                <h1 className="text-3xl font-bold text-center mb-2 text-black">{title || intl.formatMessage({ id: 'collections.untitled' })}</h1>
                <div className="text-center text-neutral-500 text-sm mb-10 pb-4 border-b border-neutral-200">
                  {date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString()}
                </div>
                <div className="space-y-6">
                  {items.map((item, idx) => (
                    <div key={item.id || idx} className="text-black text-sm leading-relaxed whitespace-pre-wrap pb-4 border-b border-dashed border-neutral-100 last:border-0">
                      {item.item_type === 'punchline' && item.punchline ? (
                        <div dangerouslySetInnerHTML={{ __html: item.punchline.text }} className="rich-text-content" />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: item.text_content || '' }} className="rich-text-content" />
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-center text-neutral-400 py-12">{intl.formatMessage({ id: 'collections.no_elements_preview' })}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
