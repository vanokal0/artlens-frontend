export const styles = [
  "Baroque",
  "Impressionism",
  "Cubism",
  "Pop Art",
  "Ukiyo-e",
] as const;
export type ArtStyle = (typeof styles)[number];
export type Model = "simple_ann" | "cnn" | "comparison";
export type ResultType = "single" | "probabilities";
export interface Settings {
  model: Model;
  result_type: ResultType;
  epochs: number;
  learning_rate: number;
  batch_size: number;
  random_seed: number;
  data_augmentation: boolean;
}
export interface AnalysisRequest extends Settings {
  image: File;
}
export interface ModelResult {
  model: Exclude<Model, "comparison">;
  prediction: { style: ArtStyle; confidence: number };
  probabilities: { style: ArtStyle; probability: number }[];
}
export interface ComparisonResult {
  model: "comparison";
  simple_ann: ModelResult;
  cnn: ModelResult;
  agreement: boolean;
}
export type AnalysisResult = ModelResult | ComparisonResult;
export interface AnalysisStatus {
  status: "processing" | "completed" | "failed";
  progress: number;
  stage: string;
  elapsedMs: number;
  result: AnalysisResult | null;
  error?: string;
}
export interface AnalysisApi {
  create(
    request: AnalysisRequest,
    signal?: AbortSignal,
  ): Promise<{ analysisId: string }>;
  poll(id: string, signal?: AbortSignal): Promise<AnalysisStatus>;
}
export interface LoadedImage {
  file: File;
  url: string;
  width: number;
  height: number;
  format: string;
}
export const modelLabels = {
  simple_ann: "Simple ANN",
  cnn: "CNN",
  comparison: "Comparison",
};
