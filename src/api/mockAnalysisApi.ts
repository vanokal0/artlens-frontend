import { styles } from "../types/analysis";
import type {
  AnalysisApi,
  AnalysisRequest,
  AnalysisResult,
  ArtStyle,
  ModelResult,
} from "../types/analysis";

const jobs = new Map<
  string,
  { start: number; request: AnalysisRequest; result: AnalysisResult }
>();
// Fixed preview result for the demo; change this to preview another art style.
const mockPredictedStyle: ArtStyle = "Cubism";

function predict(model: "simple_ann" | "cnn"): ModelResult {
  const confidence = model === "cnn" ? 0.917 : 0.728;
  const probabilities = styles.map((style) => ({
    style,
    probability: style === mockPredictedStyle ? confidence : 0,
  }));
  let index = 0;
  for (const entry of probabilities)
    if (entry.style !== mockPredictedStyle)
      entry.probability = (1 - confidence) * [0.4, 0.3, 0.2, 0.1][index++];
  return {
    model,
    prediction: { style: mockPredictedStyle, confidence },
    probabilities: probabilities.sort((a, b) => b.probability - a.probability),
  };
}
export const mockAnalysisApi: AnalysisApi = {
  async create(request) {
    const analysisId = crypto.randomUUID();
    const ann = predict("simple_ann"),
      cnn = predict("cnn");
    const result: AnalysisResult =
      request.model === "comparison"
        ? {
            model: "comparison",
            simple_ann: ann,
            cnn,
            agreement: ann.prediction.style === cnn.prediction.style,
          }
        : request.model === "cnn"
          ? cnn
          : ann;
    jobs.set(analysisId, { start: performance.now(), request, result });
    return { analysisId };
  },
  async poll(id) {
    const job = jobs.get(id);
    if (!job) throw new Error("Analysis was not found. Please try again.");
    const elapsedMs = Math.round(performance.now() - job.start);
    const stages = [
      "Uploading image",
      "Preprocessing image",
      ...(job.request.model !== "cnn"
        ? ["Extracting grid intensity features", "Running Simple ANN"]
        : []),
      ...(job.request.model !== "simple_ann"
        ? ["Preparing CNN input", "Running CNN"]
        : []),
      ...(job.request.model === "comparison" ? ["Comparing predictions"] : []),
      "Preparing result",
    ];
    const progress = Math.min(100, Math.floor(elapsedMs / 40));
    if (progress === 100) {
      jobs.delete(id);
      return {
        status: "completed",
        progress,
        stage: "Completed",
        elapsedMs,
        result: job.result,
      };
    }
    return {
      status: "processing",
      progress,
      stage:
        stages[
          Math.min(
            stages.length - 1,
            Math.floor((progress / 100) * stages.length),
          )
        ],
      elapsedMs,
      result: null,
    };
  },
};
