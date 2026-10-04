import { useRef, useState } from "react";
import { Upload, ImagePlus, LoaderCircle, RefreshCw } from "lucide-react";
import type { LoadedImage } from "../types/analysis";
import { ImageInformation } from "./ImageInformation";
export function ImageUploader({
  image,
  loading,
  disabled,
  onFile,
}: {
  image: LoadedImage | null;
  loading: boolean;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null),
    depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".png,.jpg,.jpeg,.bmp"
        hidden
        disabled={disabled || loading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className={`upload-zone ${image ? "has-image" : ""} ${dragging ? "dragging" : ""}`}
        disabled={disabled || loading}
        onClick={() => input.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          depth.current++;
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          if (--depth.current <= 0) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          depth.current = 0;
          setDragging(false);
          if (!disabled && !loading && e.dataTransfer.files[0])
            onFile(e.dataTransfer.files[0]);
        }}
      >
        {loading ? (
          <div className="upload-content">
            <LoaderCircle className="spin" size={30} />
            <h3>Loading image...</h3>
          </div>
        ) : image ? (
          <>
            <img
              className="painting-preview"
              src={image.url}
              alt={`Uploaded painting: ${image.file.name}`}
            />
            <span className="replace-image">
              <RefreshCw size={14} /> Replace image
            </span>
          </>
        ) : (
          <div className="upload-content">
            <span className="upload-icon">
              <ImagePlus size={30} strokeWidth={1.4} />
            </span>
            <h3>Drop a painting here</h3>
            <p>
              or{" "}
              <span className="browse-link">
                click to browse <Upload size={13} />
              </span>
            </p>
            <span className="file-hint">
              PNG, JPG or BMP <span>·</span> Up to 30 MB
            </span>
          </div>
        )}
      </button>
      {image && !loading && (
        <div className="image-metadata">
          <ImageInformation key={image.url} image={image} />
          <strong title={image.file.name}>{image.file.name}</strong>
        </div>
      )}
    </>
  );
}
