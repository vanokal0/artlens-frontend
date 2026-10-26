import type { TrainingRequest, TrainingStatus } from "../types/analysis";
import { requestJson } from "./apiClient";

export const trainingApi = {
  start(request: TrainingRequest, signal?: AbortSignal) {
    return requestJson<TrainingStatus>("/api/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  },
  status(signal?: AbortSignal) {
    return requestJson<TrainingStatus>("/api/training/status", { signal });
  },
  cancel(signal?: AbortSignal) {
    return requestJson<TrainingStatus>("/api/training/cancel", {
      method: "POST",
      signal,
    });
  },
};
