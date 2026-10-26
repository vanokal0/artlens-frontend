import {
  CheckCircle2,
  CircleX,
  LoaderCircle,
  OctagonX,
  Square,
} from "lucide-react";
import type { TrainingStatus } from "../types/analysis";
import { modelLabels } from "../types/analysis";

export function TrainingProgress({
  training,
  cancelling,
  onCancel,
}: {
  training: TrainingStatus;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const active = training.status === "running" || training.status === "cancelling";
  const completed = training.status === "completed";
  const failed = training.status === "failed";
  const cancelled = training.status === "cancelled";
  const epochProgress = training.totalEpochs
    ? Math.min(100, (training.currentEpoch / training.totalEpochs) * 100)
    : 0;
  const displayedProgress = completed ? 100 : epochProgress;
  const Icon = completed
    ? CheckCircle2
    : failed
      ? OctagonX
      : cancelled
        ? CircleX
        : LoaderCircle;

  return (
    <section className="training-progress" aria-live="polite">
      <div className="training-progress-heading">
        <span>
          <Icon size={16} className={active ? "spin" : undefined} />
          <span>
            <strong>
              {training.model ? modelLabels[training.model] : "Model training"}
            </strong>
            <small>{training.stage ?? "Preparing training status"}</small>
          </span>
        </span>
        {active && (
          <button
            type="button"
            disabled={training.status === "cancelling" || cancelling}
            onClick={onCancel}
          >
            <Square size={11} fill="currentColor" />
            {training.status === "cancelling" || cancelling
              ? "Cancelling…"
              : "Cancel Training"}
          </button>
        )}
      </div>
      <div className="training-epochs">
        <span>
          Epochs {training.currentEpoch} / {training.totalEpochs}
        </span>
        <span>{(training.elapsedMs / 1000).toFixed(1)} s</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Training progress"
        aria-valuemin={0}
        aria-valuemax={training.totalEpochs || 1}
        aria-valuenow={training.currentEpoch}
      >
        <div style={{ width: `${displayedProgress}%` }} />
      </div>
      {training.metrics && (
        <dl className="training-metrics">
          <div>
            <dt>Loss</dt>
            <dd>{training.metrics.loss.toFixed(4)}</dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>{(training.metrics.accuracy * 100).toFixed(1)}%</dd>
          </div>
          <div>
            <dt>Val. loss</dt>
            <dd>{training.metrics.val_loss.toFixed(4)}</dd>
          </div>
          <div>
            <dt>Val. accuracy</dt>
            <dd>{(training.metrics.val_accuracy * 100).toFixed(1)}%</dd>
          </div>
        </dl>
      )}
      {completed && (
        <p className="training-outcome">
          New model active
          {training.currentEpoch < training.totalEpochs
            ? ` · EarlyStopping after ${training.currentEpoch} epochs`
            : ""}
          .
        </p>
      )}
      {(cancelled || failed) && (
        <p
          className={`training-outcome${failed ? " failed" : ""}`}
          role={failed ? "alert" : undefined}
        >
          {training.error ??
            (cancelled
              ? "Training cancelled. Previous model preserved."
              : "Training failed. Previous model preserved.")}
        </p>
      )}
    </section>
  );
}
