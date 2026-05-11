import { useState, useRef, useCallback } from "react";
import { Download, RotateCcw, Maximize2, Info, ImageIcon, Lock, Unlock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UploadBox from "@/components/ui/UploadBox";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/context/AuthContext";
import { resizeImage, type ResizeOptions } from "@/lib/services/image.service";
import { downloadBlob } from "@/lib/api";

// ─── Preset sizes ─────────────────────────────────────────────────────────────
const PRESETS = [
  { label: "Tùy chỉnh", value: "custom", w: null, h: null },
  { label: "Thumbnail", value: "thumb", w: 150, h: 150 },
  { label: "Small", value: "small", w: 320, h: 240 },
  { label: "Medium", value: "medium", w: 800, h: 600 },
  { label: "HD (720p)", value: "hd", w: 1280, h: 720 },
  { label: "Full HD (1080p)", value: "fhd", w: 1920, h: 1080 },
  { label: "2K", value: "2k", w: 2560, h: 1440 },
  { label: "4K", value: "4k", w: 3840, h: 2160 },
  { label: "Instagram", value: "ig", w: 1080, h: 1080 },
  { label: "FB Cover", value: "fb", w: 851, h: 315 },
  { label: "Twitter/X", value: "tw", w: 1200, h: 675 },
  { label: "A4 Portrait", value: "a4", w: 2480, h: 3508 },
] as const;

const FIT_OPTIONS = [
  { value: "inside", label: "Inside", desc: "Giữ tỉ lệ, không cắt" },
  { value: "cover", label: "Cover", desc: "Cắt để lấp đầy khung" },
  { value: "contain", label: "Contain", desc: "Giữ tỉ lệ, thêm padding" },
  { value: "fill", label: "Fill", desc: "Kéo giãn để lấp đầy" },
] as const;

type FitValue = "inside" | "cover" | "contain" | "fill" | "outside";
type FormatValue = "jpeg" | "png" | "webp";
type Stage = "idle" | "preview" | "processing" | "done";

// ─── Validation ───────────────────────────────────────────────────────────────
function validateForm(
  width: string,
  height: string,
  quality: string
): string[] {
  const errors: string[] = [];
  const w = parseInt(width, 10);
  const h = parseInt(height, 10);
  const q = parseInt(quality, 10);

  const hasW = width.trim() !== "" && !isNaN(w);
  const hasH = height.trim() !== "" && !isNaN(h);

  if (!hasW && !hasH) {
    errors.push("Phải nhập ít nhất một trong hai: Chiều rộng hoặc Chiều cao.");
  }
  if (hasW && (w < 1 || w > 8000)) {
    errors.push("Chiều rộng phải từ 1 đến 8000 px.");
  }
  if (hasH && (h < 1 || h > 8000)) {
    errors.push("Chiều cao phải từ 1 đến 8000 px.");
  }
  if (quality.trim() !== "" && (isNaN(q) || q < 10 || q > 100)) {
    errors.push("Chất lượng phải từ 10 đến 100.");
  }
  return errors;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getImageDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

// ─── Main component ───────────────────────────────────────────────────────────
function ResizeContent() {
  const { user } = useAuth();
  const appUser = user
    ? { name: user.name || "Người dùng", email: user.email || "" }
    : { name: "Người dùng", email: "" };

  // File state
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [origDims, setOrigDims] = useState<{ w: number; h: number } | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultInfo, setResultInfo] = useState<{ w: number; h: number; size: number } | null>(null);

  // Form state
  const [preset, setPreset] = useState<string>("custom");
  const [widthStr, setWidthStr] = useState("");
  const [heightStr, setHeightStr] = useState("");
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState<FormatValue>("jpeg");
  const [fit, setFit] = useState<FitValue>("inside");
  const [quality, setQuality] = useState("90");
  const [errors, setErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState("");

  const aspectRef = useRef<number | null>(null);

  // ── Handle file select ──
  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) { setStage("idle"); return; }
    const f = files[0];
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setResultInfo(null);
    setApiError("");
    setErrors([]);

    const dims = await getImageDimensions(f);
    setOrigDims(dims);
    aspectRef.current = dims.h > 0 ? dims.w / dims.h : null;
    setStage("preview");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle preset select ──
  const handlePreset = (val: string) => {
    setPreset(val);
    const p = PRESETS.find((x) => x.value === val);
    if (p && p.w !== null && p.h !== null) {
      setWidthStr(String(p.w));
      setHeightStr(String(p.h));
    } else {
      setWidthStr("");
      setHeightStr("");
    }
    setErrors([]);
  };

  // ── Width/Height with aspect ratio lock ──
  const handleWidthChange = (val: string) => {
    setWidthStr(val);
    setPreset("custom");
    if (lockAspect && aspectRef.current && val.trim() !== "") {
      const w = parseInt(val, 10);
      if (!isNaN(w) && w > 0) {
        setHeightStr(String(Math.round(w / aspectRef.current)));
      }
    }
  };

  const handleHeightChange = (val: string) => {
    setHeightStr(val);
    setPreset("custom");
    if (lockAspect && aspectRef.current && val.trim() !== "") {
      const h = parseInt(val, 10);
      if (!isNaN(h) && h > 0) {
        setWidthStr(String(Math.round(h * aspectRef.current)));
      }
    }
  };

  // ── Process ──
  const handleProcess = async () => {
    if (!file) return;
    const errs = validateForm(widthStr, heightStr, quality);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setApiError("");
    setStage("processing");

    const opts: ResizeOptions = {
      format,
      fit,
      quality: parseInt(quality, 10),
    };
    if (widthStr.trim() !== "") opts.width = parseInt(widthStr, 10);
    if (heightStr.trim() !== "") opts.height = parseInt(heightStr, 10);

    try {
      const blob = await resizeImage(file, opts);
      const url = URL.createObjectURL(blob);

      // Read output dimensions from image
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });

      setResultBlob(blob);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(url);
      setResultInfo({ w: img.naturalWidth, h: img.naturalHeight, size: blob.size });
      setStage("done");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Xử lý thất bại, vui lòng thử lại");
      setStage("preview");
    }
  };

  // ── Download ──
  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const extMap: Record<FormatValue, string> = { jpeg: "jpg", png: "png", webp: "webp" };
    const name = file.name.replace(/\.[^.]+$/, "") + `-${widthStr || "auto"}x${heightStr || "auto"}.${extMap[format]}`;
    downloadBlob(resultBlob, name);
  };

  // ── Reset ──
  const handleReset = () => {
    setStage("idle");
    setFile(null);
    setResultBlob(null);
    setResultInfo(null);
    setErrors([]);
    setApiError("");
    setPreset("custom");
    setWidthStr("");
    setHeightStr("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setPreviewUrl(null);
    setResultUrl(null);
    setOrigDims(null);
    aspectRef.current = null;
  };

  // ── Render ──
  return (
    <AppLayout user={appUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Maximize2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Thay đổi kích thước ảnh</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Resize ảnh nhanh chóng — chọn preset hoặc nhập kích thước tùy ý
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            Hỗ trợ: <strong>JPG, PNG, WebP</strong>. Tối đa <strong>10MB</strong>. Kích thước đầu ra tối đa <strong>8000 × 8000 px</strong>.
          </p>
        </div>

        {/* API Error */}
        {apiError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
            {apiError}
          </div>
        )}

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl space-y-1">
            {errors.map((e) => (
              <p key={e} className="text-sm text-yellow-800 font-medium">• {e}</p>
            ))}
          </div>
        )}

        {/* Upload */}
        {stage === "idle" && (
          <Card>
            <UploadBox
              accept=".jpg,.jpeg,.png,.webp"
              onFilesChange={handleFiles}
              maxSize={10}
              label="Kéo & thả ảnh vào đây"
              description="Hỗ trợ JPG, PNG, WebP — tối đa 10MB"
            />
          </Card>
        )}

        {stage !== "idle" && (
          <>
            {/* Images preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Ảnh gốc</p>
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Original" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  )}
                </div>
                {origDims && origDims.w > 0 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {origDims.w} × {origDims.h} px &nbsp;·&nbsp; {formatBytes(file?.size ?? 0)}
                  </p>
                )}
              </Card>

              <Card>
                <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Kết quả</p>
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center relative">
                  {stage === "processing" && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-[3px] border-[#ff7a18] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium text-gray-600">Đang xử lý...</p>
                    </div>
                  )}
                  {stage === "done" && resultUrl && (
                    <img src={resultUrl} alt="Result" className="w-full h-full object-contain" />
                  )}
                  {(stage === "preview") && (
                    <div className="text-gray-400 text-sm text-center px-4">Nhấn "Resize ngay" để xem kết quả</div>
                  )}
                </div>
                {resultInfo && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {resultInfo.w} × {resultInfo.h} px &nbsp;·&nbsp; {formatBytes(resultInfo.size)}
                  </p>
                )}
              </Card>
            </div>

            {/* Settings panel */}
            {(stage === "preview" || stage === "done") && (
              <Card>
                <div className="space-y-5">
                  {/* Preset sizes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Preset kích thước</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => handlePreset(p.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            preset === p.value
                              ? "bg-[#ff7a18] text-white border-[#ff7a18]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#ff7a18] hover:text-[#ff7a18]"
                          }`}
                        >
                          {p.label}
                          {p.w && <span className="ml-1 opacity-70 font-normal">{p.w}×{p.h}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Width / Height */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Chiều rộng (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={8000}
                        value={widthStr}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        placeholder="e.g. 1920"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18]"
                      />
                    </div>

                    <button
                      type="button"
                      title={lockAspect ? "Đang khoá tỉ lệ" : "Tỉ lệ tự do"}
                      onClick={() => setLockAspect((v) => !v)}
                      className={`mb-0.5 p-2 rounded-xl border transition-all ${
                        lockAspect
                          ? "bg-blue-50 border-blue-200 text-blue-600"
                          : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                    >
                      {lockAspect ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </button>

                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Chiều cao (px)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={8000}
                        value={heightStr}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        placeholder="e.g. 1080"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18]"
                      />
                    </div>
                  </div>

                  {/* Fit mode */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chế độ fit</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FIT_OPTIONS.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setFit(f.value as FitValue)}
                          className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                            fit === f.value
                              ? "bg-[#ff7a18]/10 border-[#ff7a18] text-[#ff7a18]"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-xs font-semibold">{f.label}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">{f.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format & Quality */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Định dạng đầu ra</label>
                      <div className="flex gap-2">
                        {(["jpeg", "png", "webp"] as FormatValue[]).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFormat(f)}
                            className={`flex-1 py-2 rounded-xl border text-xs font-semibold uppercase transition-all ${
                              format === f
                                ? "bg-[#ff7a18] text-white border-[#ff7a18]"
                                : "bg-white text-gray-600 border-gray-200 hover:border-[#ff7a18] hover:text-[#ff7a18]"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Chất lượng: <span className="text-[#ff7a18]">{quality}</span>
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        className="w-full accent-[#ff7a18]"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                        <span>Nhỏ (10)</span><span>Tốt nhất (100)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Action buttons */}
            <Card className="flex flex-wrap items-center gap-3">
              {stage === "preview" && (
                <>
                  <Button onClick={handleProcess} size="lg">
                    <Maximize2 className="h-4 w-4" /> Resize ngay
                  </Button>
                  <Button variant="secondary" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" /> Đổi ảnh
                  </Button>
                </>
              )}
              {stage === "processing" && (
                <Button loading size="lg" disabled>Đang xử lý...</Button>
              )}
              {stage === "done" && (
                <>
                  <Button size="lg" onClick={handleDownload}>
                    <Download className="h-4 w-4" /> Tải về
                  </Button>
                  <Button variant="secondary" onClick={() => setStage("preview")}>
                    <Maximize2 className="h-4 w-4" /> Resize lại
                  </Button>
                  <Button variant="secondary" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" /> Ảnh mới
                  </Button>
                </>
              )}
            </Card>
          </>
        )}

        {/* Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Chất lượng cao", desc: "Sử dụng thư viện sharp — resize nhanh và sắc nét" },
            { title: "Nhiều định dạng", desc: "Xuất ra JPEG, PNG hoặc WebP tuỳ nhu cầu" },
            { title: "Giữ tỉ lệ", desc: "Khoá tỉ lệ khung hình để không méo ảnh" },
          ].map((tip) => (
            <Card key={tip.title} className="text-center" padding="sm">
              <p className="font-semibold text-gray-800 text-sm">{tip.title}</p>
              <p className="text-xs text-gray-500 mt-1">{tip.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default function ResizePage() {
  return (
    <AuthGuard>
      <ResizeContent />
    </AuthGuard>
  );
}
