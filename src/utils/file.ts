import type { LoadedImage } from "../types/analysis";
export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} ${bytes === 1 ? "byte" : "bytes"}`;
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(2)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
const imageFormats: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/bmp": "BMP",
  "image/x-ms-bmp": "BMP",
};
export async function loadImage(file: File): Promise<LoadedImage> {
  if (
    !/\.(png|jpe?g|bmp)$/i.test(file.name) ||
    (file.type &&
      !["image/png", "image/jpeg", "image/bmp", "image/x-ms-bmp"].includes(
        file.type,
      ))
  )
    throw new Error("Please choose a PNG, JPEG, or BMP image.");
  if (file.size > 30 * 1024 * 1024)
    throw new Error(
      "This image is too large. Please choose a file under 30 MB.",
    );
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    return {
      file,
      url,
      width: image.naturalWidth,
      height: image.naturalHeight,
      format:
        imageFormats[file.type] ??
        file.name.split(".").pop()!.toUpperCase().replace("JPG", "JPEG"),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("This image could not be read. Try another image file.");
  }
}
