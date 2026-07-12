"use client";

import React, { useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync content from prop only if it differs from current innerHTML
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "<div><br></div>";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string) => {
    document.execCommand(command, false);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Intercept Tab key to insert a tab character
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&#9;");
      handleInput();
    }
  };

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 focus-within:border-violet-500 transition-all flex flex-col">
      {/* Editor Toolbar */}
      <div className="flex gap-1.5 p-2 bg-slate-900 border-b border-slate-850 flex-wrap">
        <button
          type="button"
          onClick={() => executeCommand("bold")}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("italic")}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("underline")}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-slate-800 self-center mx-1" />
        <button
          type="button"
          onClick={() => executeCommand("insertUnorderedList")}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Unordered List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("insertOrderedList")}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[140px] max-h-[300px] overflow-y-auto p-4 text-sm text-slate-100 focus:outline-none prose prose-invert max-w-none prose-sm whitespace-pre-wrap style-editor-content"
        style={{ tabSize: 4 }}
      />
    </div>
  );
}
