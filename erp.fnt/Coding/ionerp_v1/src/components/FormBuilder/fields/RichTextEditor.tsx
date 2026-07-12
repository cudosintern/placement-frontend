import React, { forwardRef, useRef, useEffect } from "react";
import { AlertCircle, Bold, Italic, Underline, Link, Unlink, Palette } from "lucide-react";

export interface RichTextEditorProps {
  name?: string;
  label?: string;
  error?: { message?: string };
  value?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      name,
      label,
      error,
      value = "",
      disabled = false,
      required,
      onChange,
      onBlur,
      placeholder = "Enter text...",
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const valueRef = useRef<string>(value);

    // Sync external value with editor content (only if they differ to avoid losing selection/cursor position)
    useEffect(() => {
      if (editorRef.current && value !== editorRef.current.innerHTML) {
        // Prevent clearing content entirely if it's just an empty string reset
        if (value === "" && editorRef.current.innerHTML === "<br>") {
          return;
        }
        editorRef.current.innerHTML = value;
        valueRef.current = value;
      }
    }, [value]);

    const handleInput = () => {
      if (editorRef.current) {
        let html = editorRef.current.innerHTML;
        // Normalize empty content editable block
        if (html === "<br>" || html === "<p><br></p>" || html === "") {
          html = "";
        }
        valueRef.current = html;
        if (onChange) {
          onChange(html);
        }
      }
    };

    const execCommand = (command: string, value: string = "") => {
      if (disabled) return;
      document.execCommand(command, false, value);
      handleInput();
    };

    const addLink = () => {
      if (disabled) return;
      const url = prompt("Enter the URL:");
      if (url) {
        let formattedUrl = url;
        if (!/^https?:\/\//i.test(url)) {
          formattedUrl = `https://${url}`;
        }
        execCommand("createLink", formattedUrl);
      }
    };

    return (
      <div className="w-full mb-4">
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className={`mt-1 border rounded-md overflow-hidden shadow-sm flex flex-col bg-white dark:bg-gray-800 ${
          error ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500" : "border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500"
        }`}>
          {/* Toolbar */}
          <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <button
              type="button"
              disabled={disabled}
              onClick={() => execCommand("bold")}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 disabled:opacity-50 transition-colors"
              title="Bold"
            >
              <Bold size={15} />
            </button>
            
            <button
              type="button"
              disabled={disabled}
              onClick={() => execCommand("italic")}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 disabled:opacity-50 transition-colors"
              title="Italic"
            >
              <Italic size={15} />
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => execCommand("underline")}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 disabled:opacity-50 transition-colors"
              title="Underline"
            >
              <Underline size={15} />
            </button>

            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

            <div className="relative p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 disabled:opacity-50 transition-colors flex items-center cursor-pointer" title="Text Color">
              <Palette size={15} />
              <input
                type="color"
                disabled={disabled}
                onChange={(e) => execCommand("foreColor", e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

            <button
              type="button"
              disabled={disabled}
              onClick={addLink}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 disabled:opacity-50 transition-colors"
              title="Insert Link"
            >
              <Link size={15} />
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => execCommand("unlink")}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 disabled:opacity-50 transition-colors"
              title="Remove Link"
            >
              <Unlink size={15} />
            </button>
          </div>

          {/* Editable Area */}
          <div
            id={name}
            ref={(node) => {
              editorRef.current = node;
              if (ref) {
                if (typeof ref === "function") {
                  ref(node);
                } else {
                  (ref as any).current = node;
                }
              }
            }}
            contentEditable={!disabled}
            onInput={handleInput}
            onBlur={onBlur}
            className="p-3 min-h-[140px] max-h-[300px] overflow-y-auto focus:outline-none text-gray-900 dark:text-gray-100 sm:text-sm bg-white dark:bg-gray-800 rich-text-editor-area"
            data-placeholder={placeholder}
          />
        </div>

        {error && (
          <p className="text-red-600 flex items-center text-xs mt-1">
            <AlertCircle size={13} className="mr-1" /> {error.message}
          </p>
        )}

        <style>{`
          .rich-text-editor-area:empty::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            cursor: text;
          }
        `}</style>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
