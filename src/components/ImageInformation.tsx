import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import type { LoadedImage } from "../types/analysis";
import { formatSize } from "../utils/file";

export function ImageInformation({ image }: { image: LoadedImage }) {
  const [mode, setMode] = useState<"closed" | "transient" | "pinned">("closed");
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const open = mode !== "closed";
  const extension = image.file.name.split(".").pop()?.toLowerCase();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      ) {
        setMode("closed");
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMode("closed");
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={container}
      className="image-information"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          setMode((current) => (current === "pinned" ? current : "transient"));
        }
      }}
      onPointerLeave={(event) => {
        if (
          event.pointerType === "mouse" &&
          !trigger.current?.matches(":focus-visible")
        ) {
          setMode((current) => (current === "pinned" ? current : "closed"));
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setMode((current) => (current === "pinned" ? current : "closed"));
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="image-info-trigger"
        aria-label="Image information"
        aria-expanded={open}
        aria-controls={id}
        aria-describedby={open ? id : undefined}
        onFocus={() =>
          setMode((current) => (current === "pinned" ? current : "transient"))
        }
        onClick={() =>
          setMode((current) => (current === "pinned" ? "closed" : "pinned"))
        }
      >
        <Info size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="image-info-popover" id={id} role="tooltip">
          <div className="image-info-card">
            <h3>Image information</h3>
            <dl>
              <dt>File name</dt>
              <dd>{image.file.name}</dd>
              <dt>Format</dt>
              <dd>
                {image.format} (.{extension})
              </dd>
              <dt>Resolution</dt>
              <dd>
                {image.width} × {image.height} px
              </dd>
              <dt>File size</dt>
              <dd>{formatSize(image.file.size)}</dd>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
