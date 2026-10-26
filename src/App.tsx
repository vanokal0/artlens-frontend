import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnalysisHistoryDrawer } from "./components/AnalysisHistoryDrawer";
import {
  addCompletedAnalysis,
  getHistorySnapshot,
  subscribeHistory,
} from "./history/analysisHistory";
import { ArrowRight, ScanLine, Sparkles, LoaderCircle } from "lucide-react";
import { Header } from "./components/Header";
import { ImageUploader } from "./components/ImageUploader";
import { ConfigurationPanel } from "./components/ConfigurationPanel";
import { AnalysisProgress } from "./components/AnalysisProgress";
import { TrainingProgress } from "./components/TrainingProgress";
import { Results } from "./components/Results";
import { ExportControl } from "./components/ExportControl";
import { analysisApi, isMockApi } from "./api/analysisApi";
import { trainingApi } from "./api/trainingApi";
import { loadImage } from "./utils/file";
import { styles } from "./types/analysis";
import type {
  AnalysisStatus,
  LoadedImage,
  ResultType,
  Settings,
  TrainingStatus,
} from "./types/analysis";
import { styleAssets } from "./data/styleAssets";
import "./App.css";
const defaults: Settings = {
  model: "cnn",
  result_type: "single",
  epochs: 20,
  learning_rate: 0.001,
  batch_size: 32,
  random_seed: 42,
  data_augmentation: false,
};
function App() {
  const history = useSyncExternalStore(subscribeHistory, getHistorySnapshot);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyClosing, setHistoryClosing] = useState(false);
  function closeHistory() {
    setHistoryOpen(false);
    setHistoryClosing(true);
  }
  const [settings, setSettings] = useState(defaults),
    [image, setImage] = useState<LoadedImage | null>(null);
  const [uploadState, setUploadState] = useState<
    "empty" | "imageLoading" | "ready" | "error"
  >("empty");
  const [analysisState, setAnalysisState] = useState<
    "idle" | "analyzing" | "completed" | "error"
  >("idle");
  const [progress, setProgress] = useState<AnalysisStatus | null>(null),
    [resultType, setResultType] = useState<ResultType>("single"),
    [error, setError] = useState("");
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(
      null,
    ),
    [trainingError, setTrainingError] = useState(""),
    [trainingStarting, setTrainingStarting] = useState(false),
    [trainingCancelling, setTrainingCancelling] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null),
    busy = useRef(false),
    uploadToken = useRef(0),
    controller = useRef<AbortController | null>(null);
  const trainingBusy =
    trainingStatus?.status === "running" ||
    trainingStatus?.status === "cancelling";
  useEffect(
    () => () => {
      controller.current?.abort();
      uploadToken.current++;
    },
    [],
  );
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );
  useEffect(() => {
    if (isMockApi) return;
    const abort = new AbortController();
    void trainingApi
      .status(abort.signal)
      .then((status) => {
        setTrainingStatus(status);
        setTrainingError("");
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError"))
          setTrainingError(
            cause instanceof Error
              ? cause.message
              : "Could not load model training status.",
          );
      });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    if (!trainingBusy || isMockApi) return;
    const abort = new AbortController();
    let polling = false;
    const timer = window.setInterval(() => {
      if (polling) return;
      polling = true;
      void trainingApi
        .status(abort.signal)
        .then((status) => {
          setTrainingStatus(status);
          setTrainingError("");
        })
        .catch((cause: unknown) => {
          if (!(cause instanceof DOMException && cause.name === "AbortError"))
            setTrainingError(
              cause instanceof Error
                ? cause.message
                : "Could not refresh model training status.",
            );
        })
        .finally(() => {
          polling = false;
        });
    }, 1000);
    return () => {
      window.clearInterval(timer);
      abort.abort();
    };
  }, [trainingBusy]);
  async function upload(file: File) {
    if (busy.current) return;
    const token = ++uploadToken.current;
    setUploadState("imageLoading");
    setError("");
    setProgress(null);
    setAnalysisState("idle");
    setImage(null);
    try {
      const loaded = await loadImage(file);
      if (token !== uploadToken.current) {
        URL.revokeObjectURL(loaded.url);
        return;
      }
      setImage(loaded);
      setUploadState("ready");
    } catch (e) {
      if (token === uploadToken.current) {
        setUploadState("error");
        setError(e instanceof Error ? e.message : "Could not load this image.");
      }
    }
  }
  async function analyze() {
    if (
      !image ||
      busy.current ||
      uploadState !== "ready" ||
      trainingBusy ||
      trainingStarting
    )
      return;
    busy.current = true;
    setAnalysisState("analyzing");
    setError("");
    setResultType(settings.result_type);
    setProgress({
      status: "processing",
      progress: 0,
      stage: "Uploading image",
      elapsedMs: 0,
      result: null,
    });
    const abort = new AbortController();
    controller.current = abort;
    try {
      const { analysisId } = await analysisApi.create(
        {
          image: image.file,
          model: settings.model,
          result_type: settings.result_type,
        },
        abort.signal,
      );
      const start = performance.now();
      while (!abort.signal.aborted) {
        const status = await analysisApi.poll(analysisId, abort.signal);
        if (abort.signal.aborted) return;
        setProgress(status);
        if (status.status === "failed")
          throw new Error(status.error ?? "Analysis failed. Please try again.");
        if (status.status === "completed") {
          if (!status.result)
            throw new Error("The server returned no analysis result.");
          setAnalysisState("completed");
          addCompletedAnalysis(
            status.result,
            settings.result_type,
            status.elapsedMs,
            image,
          );
          break;
        }
        if (performance.now() - start > 120000)
          throw new Error("Analysis timed out. Please try again.");
        await new Promise<void>((resolve) => {
          const timer = setTimeout(done, 250);
          function done() {
            clearTimeout(timer);
            abort.signal.removeEventListener("abort", done);
            resolve();
          }
          abort.signal.addEventListener("abort", done, { once: true });
        });
      }
    } catch (e) {
      if (!abort.signal.aborted) {
        setAnalysisState("error");
        setError(
          e instanceof Error
            ? e.message
            : "Could not connect to the analysis service.",
        );
        setProgress(null);
      }
    } finally {
      busy.current = false;
    }
  }
  async function startTraining() {
    if (
      isMockApi ||
      settings.model === "comparison" ||
      trainingBusy ||
      trainingStarting ||
      busy.current
    )
      return;
    setTrainingStarting(true);
    setTrainingError("");
    try {
      setTrainingStatus(
        await trainingApi.start({
          model: settings.model,
          epochs: settings.epochs,
          learning_rate: settings.learning_rate,
          batch_size: settings.batch_size,
          random_seed: settings.random_seed,
          data_augmentation:
            settings.model === "cnn" && settings.data_augmentation,
        }),
      );
    } catch (cause) {
      setTrainingError(
        cause instanceof Error
          ? cause.message
          : "Could not start model training.",
      );
    } finally {
      setTrainingStarting(false);
    }
  }
  async function cancelTraining() {
    if (!trainingBusy || trainingCancelling) return;
    setTrainingCancelling(true);
    setTrainingError("");
    try {
      setTrainingStatus(await trainingApi.cancel());
    } catch (cause) {
      setTrainingError(
        cause instanceof Error
          ? cause.message
          : "Could not cancel model training.",
      );
    } finally {
      setTrainingCancelling(false);
    }
  }
  const analyzing = analysisState === "analyzing";
  const configurationLocked =
    analyzing || trainingBusy || trainingStarting || trainingCancelling;
  return (
    <>
      <Header
        historyOpen={historyOpen}
        onToggleHistory={() => {
          if (historyOpen) closeHistory();
          else {
            setHistoryClosing(false);
            setHistoryOpen(true);
          }
        }}
      />
      {(historyOpen || historyClosing) && (
        <AnalysisHistoryDrawer
          entries={history.entries}
          warning={history.warning}
          onClose={closeHistory}
          closing={historyClosing}
          onClosed={() => setHistoryClosing(false)}
        />
      )}
      <main className="main-container">
        <div className="page-intro">
          <div>
            <h1>Every painting has a language.</h1>
            <p>Discover its style. Explore how neural networks see art.</p>
          </div>
          <span className="workspace-label">
            <span /> Analysis workspace
          </span>
        </div>
        <div className="workspace">
          <section className="analysis-column">
            <div className="upload-card">
              <div className="section-heading">
                <div>
                  <span className="step-number">01</span>
                  <h2>Your painting</h2>
                </div>
                <span className="subtle">Start with an image</span>
              </div>
              <ImageUploader
                image={image}
                loading={uploadState === "imageLoading"}
                disabled={analyzing}
                onFile={upload}
              />
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="analyze-button"
                onClick={analyze}
                disabled={
                  uploadState !== "ready" ||
                  analyzing ||
                  trainingBusy ||
                  trainingStarting
                }
              >
                {analyzing ? (
                  <LoaderCircle size={18} className="spin" />
                ) : (
                  <ScanLine size={19} />
                )}
                <span>
                  {analyzing ? "Analyzing painting…" : "Analyze Painting"}
                </span>
                {!analyzing && <ArrowRight size={18} />}
              </button>
              <p className="upload-note">
                PNG, JPEG and BMP supported. Your image stays available after
                analysis.
              </p>
            </div>
            {progress && <AnalysisProgress progress={progress} />}
            <section className="results-section">
              <div className="section-heading">
                <div>
                  <span className="step-number">02</span>
                  <h2>Analysis results</h2>
                </div>
                {analysisState === "completed" && progress?.result && image && (
                  <ExportControl
                    getElement={() => resultRef.current}
                    result={progress.result}
                  />
                )}
              </div>
              {analysisState === "completed" && progress?.result && image ? (
                <div ref={resultRef}>
                  <Results
                    result={progress.result}
                    type={resultType}
                    image={image}
                  />
                </div>
              ) : (
                <div className="empty-results">
                  <span className="empty-result-icon">
                    <Sparkles size={23} strokeWidth={1.3} />
                  </span>
                  <div>
                    <h3>
                      {analyzing
                        ? "A new perspective is on its way"
                        : "A little art. A new perspective."}
                    </h3>
                    <p>
                      {analyzing
                        ? "Follow the processing stages above."
                        : "Upload a painting and run an analysis to see your results here."}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </section>
          <div className="right-column">
            <ConfigurationPanel
              settings={settings}
              onChange={setSettings}
              disabled={configurationLocked}
              activeModels={trainingStatus?.activeModels ?? null}
              trainingError={
                isMockApi
                  ? "Training is available when the FastAPI backend is enabled."
                  : trainingError
              }
              onTrain={() => void startTraining()}
            />
            {trainingStatus && trainingStatus.status !== "idle" && (
              <TrainingProgress
                training={trainingStatus}
                cancelling={trainingCancelling}
                onCancel={() => void cancelTraining()}
              />
            )}
          </div>
        </div>
        <section className="style-guide" id="style-guide">
          <div className="style-guide-heading">
            <span className="eyebrow">
              FIVE STYLES. CENTURIES OF EXPRESSION.
            </span>
            <span className="subtle">Our recognition palette</span>
          </div>
          <div className="style-grid">
            {styles.map((style) => (
              <div className="style-tile" key={style}>
                <img
                  src={styleAssets[style].image}
                  alt={`${style} inspired placeholder artwork`}
                />
                <div>
                  <h3>{style}</h3>
                  <p>{styleAssets[style].description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <footer>
          <span>
            ArtLens <span className="footer-divider">/</span> Image Recognition
            Laboratory
          </span>
          <span className="service-status">
            <span />
            {isMockApi ? "Mock API · Demo mode" : "FastAPI mode"}
          </span>
        </footer>
      </main>
    </>
  );
}
export default App;
