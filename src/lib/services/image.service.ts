import { apiFetch } from "@/lib/api";

export async function removeBackground(imageFile: File): Promise<Blob> {
  const form = new FormData();
  form.append("image", imageFile);
  return apiFetch<Blob>("/image/remove-background", {
    method: "POST",
    body: form,
  });
}

export async function removeBackgroundBulk(imageFiles: File[]): Promise<Blob> {
  const form = new FormData();
  imageFiles.forEach((f) => form.append("images", f));
  return apiFetch<Blob>("/image/remove-background-bulk", {
    method: "POST",
    body: form,
  });
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  format?: "jpeg" | "png" | "webp";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  quality?: number;
}

export async function resizeImage(imageFile: File, options: ResizeOptions): Promise<Blob> {
  const form = new FormData();
  form.append("image", imageFile);
  if (options.width !== undefined) form.append("width", String(options.width));
  if (options.height !== undefined) form.append("height", String(options.height));
  if (options.format) form.append("format", options.format);
  if (options.fit) form.append("fit", options.fit);
  if (options.quality !== undefined) form.append("quality", String(options.quality));
  return apiFetch<Blob>("/image/resize", {
    method: "POST",
    body: form,
  });
}
