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
