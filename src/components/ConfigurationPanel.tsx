import {
  SlidersHorizontal,
  ChevronDown,
  Network,
  Layers,
  GitCompareArrows,
  Info,
  RefreshCw,
} from "lucide-react";
import type { ActiveModels, Settings } from "../types/analysis";

const models = [
  {
    value: "simple_ann",
    name: "Simple ANN",
    detail: "16 × 16 intensity grid",
    icon: Network,
  },
  { value: "cnn", name: "CNN", detail: "RGB image recognition", icon: Layers },
  {
    value: "comparison",
    name: "Comparison",
    detail: "Run both models side by side",
    icon: GitCompareArrows,
  },
] as const;

export function ConfigurationPanel({
  settings,
  onChange,
  disabled,
  activeModels,
  trainingError,
  onTrain,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
  disabled: boolean;
  activeModels: ActiveModels | null;
  trainingError: string;
  onTrain: () => void;
}) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...settings, [key]: value });
  const comparison = settings.model === "comparison";
  const trainingModel = settings.model === "cnn" ? "cnn" : "simple_ann";

  return (
    <aside className="config-card">
      <div className="card-heading">
        <SlidersHorizontal size={18} />
        <h2>Configuration</h2>
      </div>
      <fieldset disabled={disabled}>
        <legend>NEURAL NETWORK</legend>
        <div className="model-options">
          {models.map(({ value, name, detail, icon: Icon }) => (
            <label
              key={value}
              className={`model-option ${settings.model === value ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="model"
                checked={settings.model === value}
                onChange={() =>
                  onChange({
                    ...settings,
                    model: value,
                    data_augmentation:
                      value === "cnn" && settings.data_augmentation,
                  })
                }
              />
              <Icon size={20} strokeWidth={1.6} />
              <span>
                <strong>{name}</strong>
                <small>{detail}</small>
              </span>
              <span className="radio-mark">
                {settings.model === value && <span />}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="result-field" disabled={disabled}>
        <legend>RESULT TYPE</legend>
        <div className="result-options">
          {(
            [
              { value: "single", name: "Top Prediction" },
              { value: "probabilities", name: "Probability Distribution" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={settings.result_type === option.value ? "active" : ""}
            >
              <input
                type="radio"
                name="result-type"
                value={option.value}
                checked={settings.result_type === option.value}
                onChange={() => update("result_type", option.value)}
              />
              {option.name}
            </label>
          ))}
        </div>
      </fieldset>
      <details className="advanced">
        <summary>
          Advanced Settings
          <ChevronDown size={16} />
        </summary>
        <div className="active-models" aria-label="Models currently in use">
          <div className="active-models-heading">
            <strong>Models currently in use</strong>
          </div>
          {activeModels ? (
            (["simple_ann", "cnn"] as const).map((model) => (
              <div className="active-model" key={model}>
                <div className="active-model-name">
                  <strong>{model === "simple_ann" ? "Simple ANN" : "CNN"}</strong>
                  <span>{activeModels[model].ready ? "Active" : "Unavailable"}</span>
                </div>
                <p>
                  {activeModels[model].settings.epochs} epochs · Learning rate{" "}
                  {activeModels[model].settings.learning_rate}
                </p>
                <p>
                  Batch {activeModels[model].settings.batch_size} · Seed{" "}
                  {activeModels[model].settings.random_seed}
                  {` · Augmentation ${
                    activeModels[model].settings.data_augmentation
                      ? "on"
                      : "off"
                  }`}
                </p>
              </div>
            ))
          ) : (
            <p>Active model information is unavailable.</p>
          )}
        </div>
        <fieldset disabled={disabled} className="advanced-fields">
          <label>
            Epochs
            <input
              type="number"
              min="1"
              max="200"
              step="1"
              value={settings.epochs}
              onChange={(event) =>
                update(
                  "epochs",
                  Math.min(
                    200,
                    Math.max(1, Math.floor(Number(event.target.value))),
                  ),
                )
              }
            />
          </label>
          <label>
            Learning Rate
            <input
              type="number"
              min="0"
              max="1"
              step="any"
              value={settings.learning_rate}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (value > 0 && value <= 1) update("learning_rate", value);
              }}
            />
          </label>
          <label>
            Batch Size
            <input
              type="number"
              min="1"
              max="256"
              step="1"
              value={settings.batch_size}
              onChange={(event) =>
                update(
                  "batch_size",
                  Math.min(
                    256,
                    Math.max(1, Math.floor(Number(event.target.value))),
                  ),
                )
              }
            />
          </label>
          <label>
            Random Seed
            <input
              type="number"
              min="0"
              max="2147483647"
              step="1"
              value={settings.random_seed}
              onChange={(event) =>
                update(
                  "random_seed",
                  Math.min(
                    2147483647,
                    Math.max(0, Math.floor(Number(event.target.value))),
                  ),
                )
              }
            />
          </label>
          <label className="augmentation">
            <input
              type="checkbox"
              checked={settings.data_augmentation}
              disabled={settings.model !== "cnn"}
              onChange={(event) =>
                update("data_augmentation", event.target.checked)
              }
            />
            Data Augmentation
            {settings.model !== "cnn" && <small>CNN only</small>}
          </label>
          <p>
            Retraining is optional. The active models above are ready for immediate
            analysis.
          </p>
          <button
            type="button"
            className="train-button"
            disabled={disabled || comparison}
            onClick={onTrain}
          >
            <RefreshCw size={14} />
            Train {trainingModel === "cnn" ? "CNN" : "Simple ANN"}
          </button>
          {comparison && (
            <p className="training-help">Select one model to retrain it.</p>
          )}
          {trainingError && (
            <p className="training-form-error" role="alert">
              {trainingError}
            </p>
          )}
        </fieldset>
      </details>
      <div className="config-note">
        <Info size={15} />
        <p>
          Choose a model and upload a painting to explore its artistic style.
        </p>
      </div>
    </aside>
  );
}
