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

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    const escapeHtml = (str: string): string => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const sanitizeHtmlForPunchline = (htmlStr: string): string => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlStr, "text/html");
      const allowedTags = new Set(["ul", "ol", "li", "b", "strong", "i", "em", "u", "br", "p", "div"]);

      const clean = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return escapeHtml(node.textContent || "");
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();

          let childrenHtml = "";
          for (let i = 0; i < el.childNodes.length; i++) {
            childrenHtml += clean(el.childNodes[i]);
          }

          if (allowedTags.has(tagName)) {
            if (tagName === "br") {
              return "<br>";
            }
            return `<${tagName}>${childrenHtml}</${tagName}>`;
          }

          return childrenHtml;
        }

        return "";
      };

      let result = "";
      for (let i = 0; i < doc.body.childNodes.length; i++) {
        result += clean(doc.body.childNodes[i]);
      }
      return result;
    };

    let cleanHtml = "";
    if (html) {
      cleanHtml = sanitizeHtmlForPunchline(html);
    } else if (text) {
      cleanHtml = escapeHtml(text).replace(/\r?\n/g, "<br>");
    }

    document.execCommand("insertHTML", false, cleanHtml);
    handleInput();
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
        onPaste={handlePaste}
        className="min-h-[140px] max-h-[300px] overflow-y-auto p-4 text-sm text-slate-100 focus:outline-none prose prose-invert max-w-none prose-sm whitespace-pre-wrap style-editor-content"
        style={{ tabSize: 4 }}
      />
    </div>
  );
}
