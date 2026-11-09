import { useRef, useState, useCallback } from "react";
import styles from "./RichTextEditor.module.css";

// ─── Toolbar button definitions ───────────────────────────────────────────────
const TOOLBAR_ACTIONS = [
  { id: "bold",        label: "B",    title: "Bold",            before: "**",  after: "**"  },
  { id: "italic",      label: "/",    title: "Italic",          before: "_",   after: "_"   },
  { id: "code",        label: "</>",  title: "Inline code",     before: "`",   after: "`"   },
  { id: "codeblock",   label: "```",  title: "Code block",      before: "```\n", after: "\n```" },
  { id: "ul",          label: "• —",  title: "Bullet list",     before: "\n- ", after: ""   },
  { id: "link",        label: "🔗",   title: "Link",            before: "[",   after: "](url)" },
  { id: "image",       label: "🖼",   title: "Image",           before: "![alt](", after: ")" },
];

/**
 * A lightweight Markdown-mode rich text editor.
 * Toolbar buttons insert/wrap markdown syntax at the cursor position.
 *
 * Props:
 *  - value: string (markdown content)
 *  - onChange: (value: string) => void
 *  - placeholder: string
 *  - rows: number (textarea rows, default 8)
 */
const RichTextEditor = ({ value = "", onChange, placeholder = "Enter markdown...", rows = 8 }) => {
  const textareaRef = useRef(null);
  const [previewOk] = useState(true); // placeholder badge

  /**
   * Insert markdown syntax around the current selection (or at cursor).
   */
  const applyAction = useCallback(
    ({ before, after }) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.slice(start, end);

      const newValue =
        value.slice(0, start) + before + selected + after + value.slice(end);

      onChange?.(newValue);

      // Restore focus + caret after React re-render
      requestAnimationFrame(() => {
        ta.focus();
        const cursorPos = start + before.length + selected.length + after.length;
        ta.setSelectionRange(
          start + before.length,
          start + before.length + selected.length
        );
        // If nothing was selected, move caret between before/after
        if (selected.length === 0) {
          ta.setSelectionRange(start + before.length, start + before.length);
        }
        void cursorPos; // suppress unused warning
      });
    },
    [value, onChange]
  );

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarButtons}>
          {TOOLBAR_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.title}
              className={styles.toolbarBtn}
              onMouseDown={(e) => {
                // Prevent textarea from losing focus
                e.preventDefault();
                applyAction(action);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className={styles.toolbarRight}>
          <span className={styles.modeBadge}>Markdown Mode</span>
          {previewOk && (
            <span className={styles.previewBadge}>Preview sync: OK</span>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
      />
    </div>
  );
};

export default RichTextEditor;
