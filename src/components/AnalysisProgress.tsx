import { CheckCircle2, LoaderCircle } from "lucide-react";
import type { AnalysisStatus } from "../types/analysis";
export function AnalysisProgress({ progress }: { progress: AnalysisStatus }) {
  return (
    <div className="analysis-progress" aria-live="polite">
      <div className="progress-top">
        <span>
          {progress.status === "completed" ? (
            <CheckCircle2 size={16} />
          ) : (
            <LoaderCircle className="spin" size={16} />
          )}{" "}
          {progress.stage}
        </span>
        <strong>{progress.progress}%</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Analysis progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.progress}
      >
        <div style={{ width: `${progress.progress}%` }} />
      </div>
      <p>
        {progress.status === "completed"
          ? "Analysis completed"
          : "Processing your painting"}{" "}
        <span>· {(progress.elapsedMs / 1000).toFixed(1)} s</span>
      </p>
    </div>
  );
}
