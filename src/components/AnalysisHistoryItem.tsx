import { Download, ImageOff } from "lucide-react";
import type { AnalysisHistoryEntry } from "../history/analysisHistory";
import { modelLabels } from "../types/analysis";
import { downloadHistoryEntry } from "../history/exportHistory";

export function AnalysisHistoryItem({
  entry,
}: {
  entry: AnalysisHistoryEntry;
}) {
  return (
    <li className="history-item">
      <div className="history-item-main">
        <div className="history-thumbnail">
          {entry.thumbnail ? (
            <img
              src={entry.thumbnail}
              alt={`Analyzed painting: ${entry.fileName}`}
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          ) : null}
          <ImageOff size={22} aria-hidden="true" />
        </div>
        <div className="history-item-details">
          <h3>
            {entry.model === "comparison"
              ? entry.agreement
                ? `Models agree: ${entry.cnn.prediction.style}`
                : "Models disagree"
              : entry.prediction.style}
          </h3>
          {entry.model !== "comparison" && (
            <p className="history-confidence">
              {(entry.prediction.confidence * 100).toFixed(1)}% confidence
            </p>
          )}
          <p>
            {modelLabels[entry.model]} ·{" "}
            {entry.resultType === "single"
              ? "Top Prediction"
              : "Probability Distribution"}
          </p>
          {entry.model === "comparison" && (
            <div className="history-models">
              <p>
                ANN: {entry.simple_ann.prediction.style} ·{" "}
                {(entry.simple_ann.prediction.confidence * 100).toFixed(1)}%
              </p>
              <p>
                CNN: {entry.cnn.prediction.style} ·{" "}
                {(entry.cnn.prediction.confidence * 100).toFixed(1)}%
              </p>
            </div>
          )}
          <p className="history-filename" title={entry.fileName}>
            {entry.fileName}
          </p>
          <time dateTime={entry.createdAt}>
            {new Date(entry.createdAt).toLocaleString(undefined, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      </div>
      <button
        type="button"
        className="history-download"
        aria-label={`Download analysis for ${entry.fileName}`}
        onClick={() => downloadHistoryEntry(entry)}
      >
        <Download size={13} /> Download
      </button>
    </li>
  );
}
