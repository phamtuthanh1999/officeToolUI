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

export interface SignPdfOptions {
  page?: "all" | "first" | "last" | number;
  position?: "bottom-right" | "bottom-left" | "bottom-center" | "top-right" | "top-left" | "center" | "custom";
  sigWidth?: number;
  xPct?: number;
  yPct?: number;
  anchorFromTop?: boolean;
}

export async function signPdf(pdfFile: File, signatureBlob: Blob, opts: SignPdfOptions = {}): Promise<Blob> {
  const form = new FormData();
  form.append("pdf", pdfFile);
  form.append("signature", signatureBlob, "signature.png");
  if (opts.page !== undefined) form.append("page", String(opts.page));
  if (opts.position) form.append("position", opts.position);
  if (opts.sigWidth !== undefined) form.append("sigWidth", String(opts.sigWidth));
  if (opts.xPct !== undefined) form.append("xPct", String(opts.xPct));
  if (opts.yPct !== undefined) form.append("yPct", String(opts.yPct));
  if (opts.anchorFromTop !== undefined) form.append("anchorFromTop", String(opts.anchorFromTop));
  return apiFetch<Blob>("/pdf/sign", { method: "POST", body: form });
}
