import type { AnalysisApi, AnalysisStatus } from "../types/analysis";
import { mockAnalysisApi } from "./mockAnalysisApi";
import { requestJson } from "./apiClient";
export const realAnalysisApi: AnalysisApi = {
  async create(request, signal) {
    const body = new FormData();
    body.append("image", request.image);
    body.append("model", request.model);
    body.append("result_type", request.result_type);
    return requestJson<{ analysisId: string }>("/api/analyses", {
      method: "POST",
      body,
      signal,
    });
  },
  async poll(id, signal) {
    return requestJson<AnalysisStatus>(
      `/api/analyses/${encodeURIComponent(id)}`,
      { signal },
    );
  },
};
export const analysisApi =
  import.meta.env.VITE_USE_MOCK_API === "true"
    ? mockAnalysisApi
    : realAnalysisApi;
export const isMockApi = import.meta.env.VITE_USE_MOCK_API === "true";
