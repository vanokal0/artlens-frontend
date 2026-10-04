import { Palette, FlaskConical, History } from "lucide-react";
export function Header({
  historyOpen,
  onToggleHistory,
}: {
  historyOpen: boolean;
  onToggleHistory: () => void;
}) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <a className="brand" href=".">
          <span className="brand-icon">
            <Palette size={23} />
          </span>
          <span>
            ArtLens<small>Art Style Recognition</small>
          </span>
        </a>
        <div className="header-actions">
          <span className="lab-label">
            <FlaskConical size={15} /> Image Recognition <b>LAB 01</b>
          </span>
          <button
            type="button"
            className="history-icon-button"
            title="Analysis history"
            aria-label="Analysis history"
            aria-expanded={historyOpen}
            aria-controls={historyOpen ? "analysis-history" : undefined}
            onClick={onToggleHistory}
          >
            <History size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
