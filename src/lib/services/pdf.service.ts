import { apiFetch } from "@/lib/api";

export async function imagesToPdf(imageFiles: File[]): Promise<Blob> {
  const form = new FormData();
  imageFiles.forEach((f) => form.append("images", f));
  return apiFetch<Blob>("/pdf/images-to-pdf", {
    method: "POST",
    body: form,
  });
}

export async function imagesToDrivePdf(
  imageFiles: File[],
  googleToken: string
): Promise<{ file: { name: string; fileId: string; driveLink: string } }> {
  const form = new FormData();
  imageFiles.forEach((f) => form.append("images", f));
  return apiFetch("/drive/images-to-pdf", {
    method: "POST",
    body: form,
    headers: { "X-Google-Token": googleToken },
  });
}
