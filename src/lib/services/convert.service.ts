import { apiFetch } from "@/lib/api";

/**
 * Chuyển đổi file(s) sang định dạng đầu ra.
 * - 1 file ảnh → ảnh: trả về Blob ảnh
 * - Nhiều file ảnh → ảnh: trả về Blob ZIP
 * - Ảnh → PDF: trả về Blob PDF
 *
 * @param files        - danh sách File cần convert
 * @param targetFormat - định dạng đầu ra: "PDF" | "PNG" | "JPG" | "WEBP" | "BMP" | "TIFF" | "GIF"
 */
export async function convertFiles(files: File[], targetFormat: string): Promise<Blob> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  form.append("targetFormat", targetFormat);

  return apiFetch<Blob>("/convert", {
    method: "POST",
    body: form,
  });
}

/**
 * Tạo tên file kết quả phù hợp dựa vào số lượng file và format đích.
 */
export function buildResultFilename(files: File[], targetFormat: string): string {
  const fmt = targetFormat.toLowerCase();
  const imageFormats = new Set(["png", "jpg", "jpeg", "webp", "bmp", "tiff", "gif"]);

  if (files.length === 1) {
    return files[0].name.replace(/\.[^.]+$/, "") + "." + fmt;
  }
  // Nhiều ảnh → ảnh → ZIP
  if (imageFormats.has(fmt)) return "converted_images.zip";
  return `converted.${fmt}`;
}
