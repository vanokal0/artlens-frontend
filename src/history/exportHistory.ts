import type { AnalysisHistoryEntry } from "./analysisHistory";

export function historyRecord(entry: AnalysisHistoryEntry) {
  const { id, createdAt, fileName, model, resultType, elapsedMs } = entry;
  const base = { id, createdAt, fileName, model, resultType, elapsedMs };
  return entry.model === "comparison"
    ? {
        ...base,
        simple_ann: entry.simple_ann,
        cnn: entry.cnn,
        agreement: entry.agreement,
      }
    : {
        ...base,
        prediction: entry.prediction,
        probabilities: entry.probabilities,
      };
}
export function historyCsv(entries: AnalysisHistoryEntry[]): string {
  const columns = [
    "date",
    "file_name",
    "model",
    "result_type",
    "prediction",
    "confidence",
    "elapsed_ms",
    "simple_ann_prediction",
    "simple_ann_confidence",
    "cnn_prediction",
    "cnn_confidence",
    "models_agree",
  ];
  const cell = (value: string | number | boolean) => {
    let text = String(value);
    // Prevent spreadsheet formula execution in user-provided filenames.
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [
    columns,
    ...entries.map((e) => [
      e.createdAt,
      e.fileName,
      e.model,
      e.resultType,
      e.model === "comparison" ? "" : e.prediction.style,
      e.model === "comparison" ? "" : e.prediction.confidence,
      e.elapsedMs,
      e.model === "comparison" ? e.simple_ann.prediction.style : "",
      e.model === "comparison" ? e.simple_ann.prediction.confidence : "",
      e.model === "comparison" ? e.cnn.prediction.style : "",
      e.model === "comparison" ? e.cnn.prediction.confidence : "",
      e.model === "comparison" ? e.agreement : "",
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
function download(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadHistoryEntry(entry: AnalysisHistoryEntry) {
  const name =
    entry.fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .slice(0, 80) || "painting";
  download(
    JSON.stringify(historyRecord(entry), null, 2),
    "application/json",
    `artlens-analysis-${name}-${entry.createdAt.slice(0, 10)}.json`,
  );
}
export function downloadHistory(entries: AnalysisHistoryEntry[]) {
  download(
    "\uFEFF" + historyCsv(entries),
    "text/csv;charset=utf-8",
    "artlens-analysis-history.csv",
  );
}
