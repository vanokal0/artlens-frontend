import { useEffect, useRef, useState } from "react";
import { ChevronRight, Download, History } from "lucide-react";
import type { AnalysisHistoryEntry } from "../history/analysisHistory";
import { clearHistory } from "../history/analysisHistory";
import { downloadHistory } from "../history/exportHistory";
import { AnalysisHistoryItem } from "./AnalysisHistoryItem";

export function AnalysisHistoryDrawer({
  entries,
  warning,
  onClose,
  closing,
  onClosed,
}: {
  entries: AnalysisHistoryEntry[];
  warning: string;
  onClose: () => void;
  closing: boolean;
  onClosed: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const clearButton = useRef<HTMLButtonElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    const element = dialog.current!;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    const pageOverflow = document.documentElement.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      document.documentElement.style.overflow = pageOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
  useEffect(() => {
    if (!closing) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 180;
    const timer = window.setTimeout(onClosed, duration);
    return () => window.clearTimeout(timer);
  }, [closing, onClosed]);
  function cancelClear() {
    setConfirmClear(false);
    clearButton.current?.focus();
  }
  return (
    <dialog
      ref={dialog}
      id="analysis-history"
      className={`history-drawer${closing ? " history-drawer-closing" : ""}`}
      aria-labelledby="history-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const scope = confirmClear
          ? event.currentTarget.querySelector(".history-confirm")!
          : event.currentTarget;
        const buttons = Array.from(
          scope.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
        );
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (confirmClear) cancelClear();
        else onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className="history-heading">
        <div>
          <h2 id="history-title">Analysis History</h2>
          <p>
            {entries.length} {entries.length === 1 ? "analysis" : "analyses"} ·
            saved on this browser
          </p>
        </div>
        <button
          type="button"
          className="history-icon-button"
          aria-label="Close analysis history"
          onClick={onClose}
          autoFocus
        >
          <ChevronRight size={20} />
        </button>
      </div>
      {entries.length > 0 && (
        <div className="history-actions">
          <button type="button" onClick={() => downloadHistory(entries)}>
            <Download size={14} /> Export History
          </button>
          <button
            ref={clearButton}
            type="button"
            className="history-clear"
            onClick={() => setConfirmClear(true)}
          >
            Clear History
          </button>
        </div>
      )}
      {warning && (
        <p className="history-warning" role="status">
          {warning}
        </p>
      )}
      {confirmClear && (
        <div
          className="history-confirm"
          role="alertdialog"
          aria-labelledby="clear-history-title"
          aria-describedby="clear-history-description"
        >
          <h3 id="clear-history-title">Clear analysis history?</h3>
          <p id="clear-history-description">
            This will remove all locally saved analyses.
          </p>
          <div>
            <button type="button" autoFocus onClick={cancelClear}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                clearHistory();
                setConfirmClear(false);
                dialog.current
                  ?.querySelector<HTMLButtonElement>(".history-icon-button")
                  ?.focus();
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
      <div className="history-scroll">
        {entries.length ? (
          <ol className="history-list" aria-label="Completed analyses">
            {entries.map((entry) => (
              <AnalysisHistoryItem key={entry.id} entry={entry} />
            ))}
          </ol>
        ) : (
          <div className="history-empty">
            <History size={30} strokeWidth={1.3} />
            <h3>No analyses yet</h3>
            <p>Completed analyses will appear here.</p>
          </div>
        )}
      </div>
    </dialog>
  );
}
