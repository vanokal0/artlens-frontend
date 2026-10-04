import {
  SlidersHorizontal,
  ChevronDown,
  Network,
  Layers,
  GitCompareArrows,
  Info,
} from "lucide-react";
import type { Settings } from "../types/analysis";
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
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
  disabled: boolean;
}) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    onChange({ ...settings, [key]: value });
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
                onChange={() => update("model", value)}
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
        <fieldset disabled={disabled} className="advanced-fields">
          <label>
            Epochs
            <input
              type="number"
              min="1"
              step="1"
              value={settings.epochs}
              onChange={(e) =>
                update(
                  "epochs",
                  Math.max(1, Math.floor(Number(e.target.value))),
                )
              }
            />
          </label>
          <label>
            Learning Rate
            <input
              type="number"
              min="0.000001"
              max="1"
              step="0.001"
              value={settings.learning_rate}
              onChange={(e) =>
                update(
                  "learning_rate",
                  Math.min(1, Math.max(0.000001, Number(e.target.value))),
                )
              }
            />
          </label>
          <label>
            Batch Size
            <select
              value={settings.batch_size}
              onChange={(e) => update("batch_size", Number(e.target.value))}
            >
              {[16, 32, 64].map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </label>
          <label>
            Random Seed
            <input
              type="number"
              min="0"
              step="1"
              value={settings.random_seed}
              onChange={(e) =>
                update(
                  "random_seed",
                  Math.max(0, Math.floor(Number(e.target.value))),
                )
              }
            />
          </label>
          <label className="augmentation">
            <input
              type="checkbox"
              checked={settings.data_augmentation}
              onChange={(e) => update("data_augmentation", e.target.checked)}
            />
            Data Augmentation
          </label>
          <p>Training parameters. Model training is not performed in Lab 1.</p>
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
