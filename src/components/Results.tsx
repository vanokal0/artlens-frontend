import { CheckCircle2, GitCompareArrows } from "lucide-react";
import type {
  AnalysisResult,
  LoadedImage,
  ModelResult,
  ResultType,
} from "../types/analysis";
import { modelLabels } from "../types/analysis";
import { styleAssets } from "../data/styleAssets";
export function SingleResult({ result }: { result: ModelResult }) {
  const valueLabel =
    result.model === "simple_ann" ? "normalized score" : "confidence";
  return (
    <div className="single-result">
      <img
        className="prediction-artwork"
        src={styleAssets[result.prediction.style].image}
        alt={`${result.prediction.style} representative style artwork`}
      />
      <div className="result-overlay">
        <span>Predicted style</span>
        <h3>{result.prediction.style.toUpperCase()}</h3>
        <p>
          {modelLabels[result.model]} ·{" "}
          {(result.prediction.confidence * 100).toFixed(1)}% {valueLabel}
        </p>
      </div>
    </div>
  );
}
export function ProbabilityList({ result }: { result: ModelResult }) {
  const ann = result.model === "simple_ann";
  return (
    <div className="probability-panel">
      <h3>
        {modelLabels[result.model]}
        <span>{ann ? "NORMALIZED STYLE SCORES" : "STYLE PROBABILITY"}</span>
      </h3>
      <p className="probability-prediction">
        Predicted style: <strong>{result.prediction.style}</strong>
        {" · "}
        {(result.prediction.confidence * 100).toFixed(1)}%{" "}
        {ann ? "top score" : "confidence"}
      </p>
      {[...result.probabilities]
        .sort((a, b) => b.probability - a.probability)
        .map((entry, index) => (
          <div
            className={`probability-row ${index === 0 ? "top-probability" : ""}`}
            key={entry.style}
          >
            <img src={styleAssets[entry.style].image} alt="" />
            <div className="probability-details">
              <div>
                <strong>{entry.style}</strong>
                <span>{(entry.probability * 100).toFixed(1)}%</span>
              </div>
              <div className="probability-track">
                <div style={{ width: `${entry.probability * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
export function Results({
  result,
  type,
  image,
}: {
  result: AnalysisResult;
  type: ResultType;
  image: Pick<LoadedImage, "url" | "file">;
}) {
  const render = (value: ModelResult) =>
    type === "single" ? (
      <SingleResult result={value} />
    ) : (
      <ProbabilityList result={value} />
    );
  return (
    <div className="rendered-results">
      <div className="export-brand">
        ARTLENS <span>Art style analysis</span>
      </div>
      <div className="result-composition">
        <figure className="result-source">
          <img src={image.url} alt={`Analyzed painting: ${image.file.name}`} />
          <figcaption>{image.file.name}</figcaption>
        </figure>
        <div className="result-predictions">
          {result.model === "comparison" ? (
            <>
              <div className="agreement">
                {result.agreement ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <GitCompareArrows size={17} />
                )}
                <span>
                  {result.agreement ? (
                    <>
                      Models agree on:{" "}
                      <strong>{result.cnn.prediction.style}</strong>
                    </>
                  ) : (
                    "Models disagree"
                  )}
                </span>
              </div>
              <div className="comparison-grid">
                {[result.simple_ann, result.cnn].map((value) => (
                  <div key={value.model}>
                    {type === "single" && (
                      <h3 className="comparison-title">
                        {modelLabels[value.model]}
                      </h3>
                    )}
                    {render(value)}
                  </div>
                ))}
              </div>
            </>
          ) : (
            render(result)
          )}
        </div>
      </div>
      <p className="result-footnote">
        Predictions indicate stylistic similarity and may vary between models.
      </p>
    </div>
  );
}
