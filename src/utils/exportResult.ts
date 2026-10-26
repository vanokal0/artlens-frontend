import { toCanvas } from "html-to-image";
import type { AnalysisResult } from "../types/analysis";
export type ExportFormat = "png" | "jpeg" | "bmp";
function bmp(canvas: HTMLCanvasElement): Blob {
  const { width, height } = canvas;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export is unavailable in this browser.");
  const pixels = context.getImageData(0, 0, width, height).data;
  const stride = Math.ceil((width * 3) / 4) * 4;
  const buffer = new ArrayBuffer(54 + stride * height),
    view = new DataView(buffer);
  view.setUint16(0, 0x4d42, true);
  view.setUint32(2, buffer.byteLength, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, stride * height, true);
  const output = new Uint8Array(buffer);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 4,
        target = 54 + (height - 1 - y) * stride + x * 3;
      output[target] = pixels[source + 2];
      output[target + 1] = pixels[source + 1];
      output[target + 2] = pixels[source];
    }
  return new Blob([buffer], { type: "image/bmp" });
}
export async function captureResult(
  element: HTMLElement,
  format: ExportFormat,
): Promise<Blob> {
  if (!element.isConnected || !element.querySelector(".rendered-results")) {
    throw new Error("No analysis result is available to export.");
  }
  await document.fonts.ready;
  await Promise.all(
    Array.from(element.querySelectorAll("img")).map((image) => image.decode()),
  );
  const canvas = await toCanvas(element, {
    pixelRatio: 2,
    backgroundColor:
      getComputedStyle(element).getPropertyValue("--page").trim() || "#f4efe9",
  });
  return format === "bmp"
    ? bmp(canvas)
    : await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error("Could not create the export.")),
          `image/${format}`,
          0.95,
        ),
      );
}

export function resultFilename(result: AnalysisResult): string {
  return result.model === "comparison"
    ? "artlens-comparison"
    : `artlens-${result.prediction.style.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${result.model.replaceAll("_", "-")}`;
}

export async function exportResult(
  element: HTMLElement,
  format: ExportFormat,
  filename: string,
) {
  const blob = await captureResult(element, format);
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${format === "jpeg" ? "jpg" : format}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyResultToClipboard(
  element: HTMLElement,
): Promise<void> {
  if (
    !navigator.clipboard?.write ||
    typeof ClipboardItem === "undefined" ||
    (ClipboardItem.supports && !ClipboardItem.supports("image/png"))
  ) {
    throw new Error(
      "Copy image is unavailable in this browser. Please download the result instead.",
    );
  }
  // Start writing during the user gesture, before asynchronous DOM capture finishes.
  const png = captureResult(element, "png");
  void png.catch(() => undefined);
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
  } catch {
    throw new Error(
      "Could not copy the image. Allow clipboard access or download the result instead.",
    );
  }
}
