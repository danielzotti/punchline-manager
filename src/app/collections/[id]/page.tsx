'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { getCollectionById, updateCollection, updateCollectionItems, deleteCollection } from '@/app/actions/collections';
import { GripVertical, Plus, Trash2, Edit2, Save, FileText, Eye } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { FullscreenReaderModal } from '@/components/modals/FullscreenReaderModal';


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
  const [isReadingFullWidth, setIsReadingFullWidth] = useState(false);
  const [initialData, setInitialData] = useState<{ title: string; date: string; items: any[] } | null>(null);

  const hasChanges = (() => {
    if (!initialData) return false;
    if (title !== initialData.title) return true;
    if (date !== initialData.date) return true;
    if (items.length !== initialData.items.length) return true;
    for (let i = 0; i < items.length; i++) {
      const current = items[i];
      const initial = initialData.items[i];
      if (current.id !== initial.id) return true;
      if (current.item_type !== initial.item_type) return true;
      if (current.text_content !== initial.text_content) return true;
      if (current.punchline?.id !== initial.punchline?.id) return true;
    }
    return false;
  })();

  // Warn before browser tab close/reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Intercept click on internal links
  useEffect(() => {
    if (!hasChanges) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          const leave = window.confirm(
            intl.formatMessage({
              id: 'collections.unsaved_changes',
              defaultMessage: 'Hai delle modifiche non salvate. Vuoi davvero lasciare la pagina?'
            })
          );
          if (!leave) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick, true);
    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
    };
  }, [hasChanges, intl]);

  // Intercept back/forward browser navigation
  useEffect(() => {
    if (!hasChanges) return;

    if (window.history.state?.noLeave !== true) {
      window.history.pushState({ noLeave: true }, '', window.location.href);
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.noLeave === true || window.location.hash === '#preview') {
        return;
      }

      const leave = window.confirm(
        intl.formatMessage({
          id: 'collections.unsaved_changes',
          defaultMessage: 'Hai delle modifiche non salvate. Vuoi davvero lasciare la pagina?'
        })
      );

      if (leave) {
        setInitialData(null);
        window.history.back();
      } else {
        window.history.forward();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasChanges, intl]);

  useEffect(() => {
    const handleHashChange = () => {
      setIsPreviewOpen(window.location.hash === '#preview');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const openPreview = () => {
    window.location.hash = 'preview';
  };

  const closePreview = () => {
    if (window.location.hash === '#preview') {
      window.history.back();
    } else {
      setIsPreviewOpen(false);
    }
  };

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
        closePreview();
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
      const parsedDate = data.date.split('T')[0];
      setDate(parsedDate); // YYYY-MM-DD
      const sortedItems = [...(data.collection_items || [])].sort((a, b) => a.position - b.position);
      setItems(sortedItems);
      setInitialData({
        title: data.title,
        date: parsedDate,
        items: sortedItems
      });
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
        setInitialData(null); // Clear initialData to bypass warning before navigation
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

      setInitialData({
        title,
        date,
        items
      });

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

  const handleExportPDF = () => {
    try {
      setIsExporting(true);

      // Create print container
      const printContainer = document.createElement('div');
      printContainer.id = 'print-container';

      let itemsHtml = '';
      items.forEach(item => {
        itemsHtml += `<div class="item-block">`;
        if (item.item_type === 'punchline' && item.punchline) {
          itemsHtml += item.punchline.text;
        } else if (item.item_type === 'linked_text' && item.text_content) {
          itemsHtml += item.text_content;
        }
        itemsHtml += `</div>`;
      });

      printContainer.innerHTML = `
        <h1>${title}</h1>
        <div class="date">${new Date(date).toLocaleDateString()}</div>
        <div class="content">
          ${itemsHtml}
        </div>
      `;

      // Create style element to hide everything else during print
      const style = document.createElement('style');
      style.id = 'print-style';
      style.innerHTML = `
        #print-container {
          display: none;
        }
        @media print {
          body > :not(#print-container) {
            display: none !important;
          }
          #print-container {
            display: block !important;
            font-family: Arial, sans-serif;
            color: black;
            background: white;
            line-height: 1.6;
            padding: 20px;
          }
          #print-container h1 {
            text-align: center;
            margin-bottom: 5px;
          }
          #print-container .date {
            text-align: center;
            color: #555;
            font-size: 14px;
            margin-bottom: 40px;
          }
          #print-container .item-block {
            margin-bottom: 20px;
          }
          #print-container .item-block p {
            margin: 0 0 1em 0;
          }
          #print-container .item-block b, #print-container .item-block strong { font-weight: bold; }
          #print-container .item-block i, #print-container .item-block em { font-style: italic; }
          #print-container .item-block u { text-decoration: underline; }
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(printContainer);

      // Trigger print on the main window
      window.print();

      // Cleanup after print dialog opens
      setTimeout(() => {
        const styleEl = document.getElementById('print-style');
        const containerEl = document.getElementById('print-container');
        if (styleEl) document.head.removeChild(styleEl);
        if (containerEl) document.body.removeChild(containerEl);
      }, 1000);
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
        <div className="flex flex-col justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase font-bold text-text-muted-light tracking-wider">{intl.formatMessage({ id: 'collections.label_title' })}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg md:text-2xl font-bold bg-transparent border-b border-transparent hover:border-border-ui focus:border-accent-primary focus:outline-none w-full pb-1 transition-colors text-text-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase font-bold text-text-muted-light tracking-wider">{intl.formatMessage({ id: 'collections.label_date' })}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-md text-text-muted bg-transparent border-b border-transparent hover:border-border-ui focus:border-accent-primary focus:outline-none pb-1 transition-colors w-full sm:w-auto"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center lg:items-stretch xl:items-center justify-end w-full lg:w-auto self-end">
            <div className="flex gap-2 flex-1 sm:flex-none">
              <Button
                onClick={openPreview}
                variant="outline"
                className="flex-1 sm:flex-none justify-center bg-bg-input hover:bg-bg-input/80 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer h-auto"
              >
                <Eye className="w-4 h-4" /> {intl.formatMessage({ id: 'collections.preview' })}
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={isExporting}
                variant="outline"
                className="flex-1 sm:flex-none justify-center bg-bg-input hover:bg-bg-input/80 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer h-auto"
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
                className="flex-1 sm:flex-none justify-center text-red-500 hover:text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer h-auto"
              >
                <Trash2 className="w-4 h-4" /> {intl.formatMessage({ id: 'button.delete' })}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 sm:flex-none justify-center bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer h-auto"
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

      <FullscreenReaderModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        items={items.map((item) => ({
          id: item.id,
          text: item.item_type === "punchline" ? item.punchline?.text || "" : item.text_content || "",
        }))}
        align="left"
      />
    </div>
  );
}

