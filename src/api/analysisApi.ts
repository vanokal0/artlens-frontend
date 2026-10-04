import type { AnalysisApi, AnalysisStatus } from "../types/analysis";
import { mockAnalysisApi } from "./mockAnalysisApi";

const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
async function responseJson<T>(response: Response): Promise<T> {
  if (!response.ok)
    throw new Error(
      `The server could not process the analysis (${response.status}). Please try again.`,
    );
  return response.json() as Promise<T>;
}
export const realAnalysisApi: AnalysisApi = {
  async create(request, signal) {
    const body = new FormData();
    for (const [key, value] of Object.entries(request))
      body.append(key, value instanceof File ? value : String(value));
    return responseJson<{ analysisId: string }>(
      await fetch(`${base}/api/analyses`, { method: "POST", body, signal }),
    );
  },
  async poll(id, signal) {
    return responseJson<AnalysisStatus>(
      await fetch(`${base}/api/analyses/${encodeURIComponent(id)}`, { signal }),
    );
  },
};
export const analysisApi =
  import.meta.env.VITE_USE_MOCK_API === "false"
    ? realAnalysisApi
    : mockAnalysisApi;
export const isMockApi = import.meta.env.VITE_USE_MOCK_API !== "false";
