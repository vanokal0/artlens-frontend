import { styles } from "../types/analysis";
import type {
  AnalysisResult,
  ArtStyle,
  LoadedImage,
  ModelResult,
  ResultType,
} from "../types/analysis";

export type AnalysisHistoryEntry = AnalysisResult & {
  id: string;
  createdAt: string;
  fileName: string;
  resultType: ResultType;
  elapsedMs: number;
  thumbnail?: string;
};
export const HISTORY_KEY = "artlens.analysis-history.v1";
const MAX_ENTRIES = 50;
const MAX_THUMBNAIL_LENGTH = 16000;
type Snapshot = { entries: AnalysisHistoryEntry[]; warning: string };
let snapshot: Snapshot | undefined;
const listeners = new Set<() => void>();
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const style = (value: unknown): value is ArtStyle =>
  styles.some((s) => s === value);
const probability = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1;
function modelResult(value: unknown): ModelResult | undefined {
  if (
    !object(value) ||
    (value.model !== "cnn" && value.model !== "simple_ann") ||
    !object(value.prediction) ||
    !style(value.prediction.style) ||
    !probability(value.prediction.confidence) ||
    !Array.isArray(value.probabilities)
  )
    return;
  const probabilities: ModelResult["probabilities"] = [];
  for (const entry of value.probabilities) {
    if (
      !object(entry) ||
      !style(entry.style) ||
      !probability(entry.probability)
    )
      return;
    probabilities.push({ style: entry.style, probability: entry.probability });
  }
  if (
    probabilities.length !== styles.length ||
    new Set(probabilities.map((p) => p.style)).size !== styles.length
  )
    return;
  return {
    model: value.model,
    prediction: {
      style: value.prediction.style,
      confidence: value.prediction.confidence,
    },
    probabilities,
  };
}
function parseEntry(value: unknown): AnalysisHistoryEntry | undefined {
  if (
    !object(value) ||
    typeof value.id !== "string" ||
    !value.id ||
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    typeof value.fileName !== "string" ||
    (value.resultType !== "single" && value.resultType !== "probabilities") ||
    typeof value.elapsedMs !== "number" ||
    !Number.isFinite(value.elapsedMs) ||
    value.elapsedMs < 0
  )
    return;
  let result: AnalysisResult | undefined;
  if (value.model === "comparison") {
    const ann = modelResult(value.simple_ann),
      cnn = modelResult(value.cnn);
    if (!ann || ann.model !== "simple_ann" || !cnn || cnn.model !== "cnn")
      return;
    result = {
      model: "comparison",
      simple_ann: ann,
      cnn,
      agreement: ann.prediction.style === cnn.prediction.style,
    };
  } else result = modelResult(value);
  if (!result) return;
  const thumbnail =
    typeof value.thumbnail === "string" &&
    value.thumbnail.length <= MAX_THUMBNAIL_LENGTH &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value.thumbnail)
      ? value.thumbnail
      : undefined;
  return {
    ...result,
    id: value.id,
    createdAt: new Date(value.createdAt).toISOString(),
    fileName: value.fileName,
    resultType: value.resultType,
    elapsedMs: value.elapsedMs,
    ...(thumbnail ? { thumbnail } : {}),
  };
}
function read(): Snapshot {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return { entries: [], warning: "" };
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("Invalid history");
    const entries = data
      .map(parseEntry)
      .filter((entry): entry is AnalysisHistoryEntry => !!entry);
    const unique = [...new Map(entries.map((e) => [e.id, e])).values()];
    return {
      entries: unique
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, MAX_ENTRIES),
      warning:
        entries.length === data.length
          ? ""
          : "Some unreadable history records were skipped.",
    };
  } catch {
    return {
      entries: [],
      warning:
        "Saved history could not be read. New analyses are still available during this session.",
    };
  }
}
export function getHistorySnapshot(): Snapshot {
  return (snapshot ??= read());
}
function syncHistory(event: StorageEvent) {
  if (event.key === HISTORY_KEY || event.key === null) {
    snapshot = read();
    listeners.forEach((fn) => fn());
  }
}
export function subscribeHistory(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", syncHistory);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0)
      window.removeEventListener("storage", syncHistory);
  };
}
function commit(entries: AnalysisHistoryEntry[]) {
  let warning = "";
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    try {
      const compact = entries.map((entry) => ({
        ...entry,
        thumbnail: undefined,
      }));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(compact));
      warning =
        "History saved without previews because browser storage is full.";
    } catch {
      warning =
        "History could not be saved in this browser. Downloads remain available during this session.";
    }
  }
  snapshot = { entries, warning };
  listeners.forEach((fn) => fn());
}
export function clearHistory() {
  commit([]);
}
async function makeThumbnail(image: LoadedImage): Promise<string | undefined> {
  try {
    const preview = new Image();
    preview.src = image.url;
    await preview.decode();
    const ratio = Math.min(
      1,
      128 / Math.max(preview.naturalWidth, preview.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(preview.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(preview.naturalHeight * ratio));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#fffdfc";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(preview, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", 0.65);
    return data.length <= MAX_THUMBNAIL_LENGTH ? data : undefined;
  } catch {
    return undefined;
  }
}
export function addCompletedAnalysis(
  result: AnalysisResult,
  resultType: ResultType,
  elapsedMs: number,
  image: LoadedImage,
) {
  const entry: AnalysisHistoryEntry = {
    ...result,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    fileName: image.file.name,
    resultType,
    elapsedMs,
  };
  commit([entry, ...getHistorySnapshot().entries].slice(0, MAX_ENTRIES));
  // Save text immediately; a failed preview never loses an analysis or resurrects a cleared record.
  void makeThumbnail(image).then((thumbnail) => {
    if (
      !thumbnail ||
      !getHistorySnapshot().entries.some((e) => e.id === entry.id)
    )
      return;
    commit(
      getHistorySnapshot().entries.map((e) =>
        e.id === entry.id ? { ...e, thumbnail } : e,
      ),
    );
  });
}
