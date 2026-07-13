'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { getCollectionById, updateCollection, updateCollectionItems, deleteCollection } from '@/app/actions/collections';
import { GripVertical, Plus, Trash2, Edit2, Save, FileText, Eye, X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

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
                <Button
                  onClick={() => {
                    onUpdateText(item.id, text);
                    setIsEditing(false);
                  }}
                  className="bg-accent-primary text-white text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer h-auto"
                >
                  {intl.formatMessage({ id: "button.save" })}
                </Button>
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
      <Button
        onClick={() => onRemove(item.id)}
        variant="ghost"
        size="icon"
        className="text-text-muted hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer h-8 w-8"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const intl = useIntl();
  const router = useRouter();
  const { id } = use(params);
  const { success, error } = useToast();
  const [collection, setCollection] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [readingFontSize, setReadingFontSize] = useState(24);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPreviewOpen(false);
      }
    };
    if (isPreviewOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchTargetIndex, setTouchTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isPreviewOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isPreviewOpen]);

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
        error(intl.formatMessage({ id: 'collections.error_delete' }));
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

      success(intl.formatMessage({ id: 'collections.success_save' }));
    } catch (err) {
      console.error(err);
      error(intl.formatMessage({ id: 'collections.error_save' }));
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
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
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
      error(intl.formatMessage({ id: 'collections.error_export_pdf' }));
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
              <Button
                onClick={() => setIsPreviewOpen(true)}
                variant="ghost"
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-bg-input hover:bg-bg-input/80 border border-border-ui rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer h-auto"
              >
                <Eye className="w-4 h-4" /> {intl.formatMessage({ id: 'collections.preview' })}
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={isExporting}
                variant="ghost"
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-bg-input hover:bg-bg-input/80 border border-border-ui rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer h-auto"
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
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer h-auto"
              >
                <Trash2 className="w-4 h-4" /> {intl.formatMessage({ id: 'button.delete' })}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 sm:flex-none justify-center px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer h-auto"
              >
                <Save className="w-4 h-4" /> {isSaving ? intl.formatMessage({ id: 'collections.saving' }) : intl.formatMessage({ id: 'button.save' })}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-2">
        <h3 className="font-bold text-text-primary text-lg">{intl.formatMessage({ id: 'collections.elements' })}</h3>
        <Button
          onClick={addLinkedText}
          variant="link"
          className="text-accent-primary hover:text-accent-primary/80 font-semibold text-sm flex items-center gap-1 cursor-pointer h-auto"
        >
          <Plus className="w-4 h-4" /> {intl.formatMessage({ id: 'collections.add_linked_text' })}
        </Button>
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
        <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary/95 backdrop-blur-md animate-fade-in p-0 justify-between">
          {/* Top toolbar */}
          <div className="flex items-center gap-2 md:gap-3 absolute top-2 right-2 md:top-4 md:right-4">
            {/* Fullscreen Toggle */}
            <Button
              type="button"
              onClick={toggleFullscreen}
              variant="outline"
              className="p-2 bg-bg-card border border-border-ui hover:bg-bg-input text-text-muted hover:text-text-primary rounded-xl transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center h-auto w-auto"
              title={isFullscreen ? "Disattiva schermo intero" : "Schermo intero"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 md:w-5 h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 md:w-5 h-5" />
              )}
            </Button>

            {/* Font controls */}
            <div className="flex items-center gap-1 bg-bg-card border border-border-ui rounded-xl p-1 shadow-sm">
              <Button
                type="button"
                onClick={() => setReadingFontSize((prev) => Math.max(16, prev - 4))}
                variant="ghost"
                className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-input rounded-lg transition-all duration-150 cursor-pointer h-auto w-auto"
                title={intl.formatMessage({ id: "reading.zoom_out", defaultMessage: "Rimpicciolisci testo" })}
              >
                <ZoomOut className="w-4 h-4 md:w-5 h-5" />
              </Button>
              <Button
                type="button"
                onClick={() => setReadingFontSize(24)}
                variant="ghost"
                className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-input rounded-lg transition-all duration-150 text-xs font-semibold px-2.5 cursor-pointer h-auto w-auto"
                title={intl.formatMessage({ id: "reading.reset", defaultMessage: "Ripristina" })}
              >
                <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
              <Button
                type="button"
                onClick={() => setReadingFontSize((prev) => Math.min(80, prev + 4))}
                variant="ghost"
                className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-input rounded-lg transition-all duration-150 cursor-pointer h-auto w-auto"
                title={intl.formatMessage({ id: "reading.zoom_in", defaultMessage: "Ingrandisci testo" })}
              >
                <ZoomIn className="w-4 h-4 md:w-5 h-5" />
              </Button>
            </div>

            {/* Close Button */}
            <Button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              variant="outline"
              className="p-2 bg-bg-card border border-border-ui hover:bg-bg-input text-text-muted hover:text-text-primary rounded-xl transition-all duration-150 cursor-pointer shadow-sm h-auto w-auto"
              title={intl.formatMessage({ id: "button.cancel", defaultMessage: "Chiudi" })}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto w-full px-4 pt-24 pb-12">
            <div className="flex flex-col min-h-full max-w-3xl mx-auto justify-center items-start gap-8">
              {items.map((item, idx) => {
                const isPunchline = item.item_type === 'punchline';
                const content = isPunchline ? item.punchline?.text : item.text_content;
                return (
                  <div
                    key={item.id || idx}
                    className="text-text-primary leading-relaxed rich-text-content break-words w-full selection:bg-accent-primary/20"
                    style={{ fontSize: `${readingFontSize}px` }}
                    dangerouslySetInnerHTML={{ __html: content || '' }}
                  />
                );
              })}
              {items.length === 0 && (
                <p className="text-center text-text-muted py-12 w-full">
                  {intl.formatMessage({ id: 'collections.no_elements_preview', defaultMessage: 'Nessun elemento da mostrare nell\'anteprima' })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
