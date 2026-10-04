import { useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, LoaderCircle } from "lucide-react";
import {
  copyResultToClipboard,
  exportResult,
  resultFilename,
} from "../utils/exportResult";
import type { ExportFormat } from "../utils/exportResult";
import type { AnalysisResult } from "../types/analysis";

export function ExportControl({
  getElement,
  result,
}: {
  getElement: () => HTMLElement | null;
  result: AnalysisResult;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const menu = useRef<HTMLDetailsElement>(null);
  async function run(format?: ExportFormat) {
    const element = getElement();
    if (!element || lock.current) return;
    lock.current = true;
    setBusy(true);
    setCopied(false);
    setError("");
    if (menu.current) menu.current.open = false;
    try {
      if (format) await exportResult(element, format, resultFilename(result));
      else {
        await copyResultToClipboard(element);
        setCopied(true);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Export failed. Please try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="export-actions" aria-label="Export result" aria-busy={busy}>
      <div className="export-control">
        <details
          ref={menu}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              event.currentTarget.open = false;
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && menu.current) {
              menu.current.open = false;
              menu.current.querySelector("summary")?.focus();
            }
          }}
        >
          <summary
            aria-disabled={busy}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            {busy ? (
              <LoaderCircle size={14} className="spin" />
            ) : (
              <Download size={14} />
            )}
            {busy ? "Exporting…" : "Download"} <ChevronDown size={12} />
          </summary>
          <div className="export-menu">
            {(["png", "jpeg", "bmp"] as const).map((format) => (
              <button
                key={format}
                type="button"
                disabled={busy}
                onClick={() => void run(format)}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </details>
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy image"}
          disabled={busy}
          onClick={() => void run()}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span role="status">{copied ? "Copied" : "Copy image"}</span>
        </button>
      </div>
      {error && (
        <p role="alert" className="export-error">
          {error}
        </p>
      )}
    </div>
  );
}
