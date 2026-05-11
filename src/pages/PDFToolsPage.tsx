import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText, Scissors, PenTool, Download, X, CheckCircle,
  ArrowUp, ArrowDown, Loader2, AlertCircle, Image as ImageIcon,
  Trash2, RotateCcw, ChevronLeft, ChevronRight, Move,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UploadBox from "@/components/ui/UploadBox";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/context/AuthContext";
import { downloadBlob } from "@/lib/api";
import { convertFiles as convertFilesApi } from "@/lib/services/convert.service";
import { signPdf } from "@/lib/services/pdf.service";
import { cn } from "@/lib/utils";

// Setup pdf.js worker — must use react-pdf's own bundled pdfjs-dist to avoid version mismatch
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ─── Types ────────────────────────────────────────────────────────────────────
type ItemStatus = "idle" | "converting" | "done" | "error";

type FileItem = {
  id: string;
  file: File;
  outputName: string;
  preview: string | null;
  blob: Blob | null;
  status: ItemStatus;
  error: string;
};

type TabId = "img2pdf" | "split" | "sign";

const tabs: { id: TabId; label: string; icon: React.ElementType; desc: string; disabled?: boolean }[] = [
  { id: "img2pdf", label: "Ảnh → PDF", icon: ImageIcon, desc: "Chuyển từng ảnh thành file PDF riêng" },
  { id: "split",   label: "Tách PDF",  icon: Scissors,  desc: "Chia PDF thành nhiều file nhỏ hơn",  disabled: true },
  { id: "sign",    label: "Ký PDF",    icon: PenTool,   desc: "Thêm chữ ký số vào tài liệu" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeItem(file: File): FileItem {
  return {
    id: Math.random().toString(36).slice(2),
    file,
    outputName: file.name.replace(/\.[^.]+$/, ""),
    preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    blob: null,
    status: "idle",
    error: "",
  };
}

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── FileRow ──────────────────────────────────────────────────────────────────
function FileRow({
  item, index, converting,
  onNameChange, onRemove, onDownload, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  item: FileItem;
  index: number;
  converting: boolean;
  onNameChange: (name: string) => void;
  onRemove: () => void;
  onDownload: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all",
      item.status === "done"       ? "border-green-200 bg-green-50" :
      item.status === "error"      ? "border-red-200 bg-red-50" :
      item.status === "converting" ? "border-blue-200 bg-blue-50/60" :
      "border-gray-200 bg-white"
    )}>
      <span className="w-5 text-xs font-bold text-gray-400 shrink-0 text-center select-none">{index + 1}</span>

      {item.preview ? (
        <img src={item.preview} alt={item.file.name}
          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100" />
      ) : (
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-[#ff7a18]" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {(item.status === "idle" || item.status === "error") ? (
          <div className="flex items-center gap-1">
            <input type="text" value={item.outputName}
              onChange={(e) => onNameChange(e.target.value)}
              className="flex-1 min-w-0 text-sm font-medium text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#ff7a18] focus:outline-none px-0.5 py-0.5 transition-colors" />
            <span className="text-xs text-gray-400 shrink-0">.pdf</span>
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-700 truncate">{item.outputName}.pdf</p>
        )}
        {item.status === "error"
          ? <p className="text-xs text-red-500 mt-0.5 truncate">{item.error}</p>
          : <p className="text-xs text-gray-400">{fmtSize(item.file.size)}</p>
        }
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {item.status === "converting" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
        {item.status === "done" && (
          <>
            <CheckCircle className="h-4 w-4 text-green-500 mr-0.5" />
            <button onClick={onDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#ff7a18] bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors">
              <Download className="h-3.5 w-3.5" /> Tải về
            </button>
          </>
        )}
        {item.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
        {item.status === "idle" && !converting && (
          <>
            <button onClick={onMoveUp} disabled={isFirst}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded transition-colors">
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={onMoveDown} disabled={isLast}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded transition-colors">
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button onClick={onRemove}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ImgToPdfTab ──────────────────────────────────────────────────────────────
function ImgToPdfTab() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [converting, setConverting] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  const allDone  = items.length > 0 && items.every((it) => it.status === "done");
  const doneCount = items.filter((it) => it.status === "done").length;
  const idleItems = items.filter((it) => it.status === "idle");
  const errorItems = items.filter((it) => it.status === "error");

  useEffect(() => {
    return () => { items.forEach((it) => { if (it.preview) URL.revokeObjectURL(it.preview); }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewFiles = useCallback((newFiles: File[]) => {
    setItems((prev) => {
      const existing = new Set(prev.map((it) => `${it.file.name}_${it.file.size}`));
      return [...prev, ...newFiles.filter((f) => !existing.has(`${f.name}_${f.size}`)).map(makeItem)];
    });
    setUploadKey((k) => k + 1);
  }, []);

  const updateName  = (id: string, name: string) =>
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, outputName: name } : it));

  const removeItem  = (id: string) =>
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((it) => it.id !== id);
    });

  const moveUp   = (i: number) => setItems((prev) => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  const moveDown = (i: number) => setItems((prev) => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });

  const convertAll = async () => {
    if (!idleItems.length) return;
    setConverting(true);
    setItems((prev) => prev.map((it) => it.status === "idle" ? { ...it, status: "converting" } : it));
    await Promise.all(idleItems.map(async (item) => {
      try {
        const blob = await convertFilesApi([item.file], "PDF");
        setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, blob, status: "done" } : it));
      } catch (err) {
        setItems((prev) => prev.map((it) => it.id === item.id
          ? { ...it, status: "error", error: err instanceof Error ? err.message : "Lỗi chuyển đổi" } : it));
      }
    }));
    setConverting(false);
  };

  const downloadOne = (item: FileItem) => { if (item.blob) downloadBlob(item.blob, `${item.outputName}.pdf`); };

  const downloadAll = async () => {
    const done = items.filter((it) => it.status === "done" && it.blob);
    for (let i = 0; i < done.length; i++) {
      downloadBlob(done[i].blob!, `${done[i].outputName}.pdf`);
      if (i < done.length - 1) await new Promise((r) => setTimeout(r, 400));
    }
  };

  const reset = () => {
    items.forEach((it) => { if (it.preview) URL.revokeObjectURL(it.preview); });
    setItems([]);
    setUploadKey((k) => k + 1);
  };

  return (
    <div className="space-y-5">
      {!allDone && (
        <UploadBox key={uploadKey}
          accept=".jpg,.jpeg,.png,.webp,.bmp,.tiff,.gif"
          multiple onFilesChange={handleNewFiles} maxSize={10}
          label="Kéo thả ảnh vào đây"
          description="Hỗ trợ JPG, PNG, WEBP, BMP, TIFF · Tối đa 10MB/ảnh · Nhấn để chọn thêm" />
      )}

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600">
              {allDone
                ? `Hoàn thành — ${doneCount} file PDF`
                : converting
                  ? `Đang chuyển đổi… ${doneCount}/${items.length}`
                  : `${items.length} ảnh · Click vào tên để đổi tên đầu ra`}
            </p>
            <div className="flex items-center gap-2">
              {allDone && <CheckCircle className="h-4 w-4 text-green-500" />}
              {errorItems.length > 0 && !converting && (
                <span className="text-xs text-red-500">{errorItems.length} lỗi</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item, i) => (
              <FileRow key={item.id} item={item} index={i} converting={converting}
                onNameChange={(name) => updateName(item.id, name)}
                onRemove={() => removeItem(item.id)}
                onDownload={() => downloadOne(item)}
                onMoveUp={() => moveUp(i)} onMoveDown={() => moveDown(i)}
                isFirst={i === 0} isLast={i === items.length - 1} />
            ))}
          </div>

          {allDone ? (
            <div className="flex gap-3 flex-wrap">
              <Button size="lg" onClick={downloadAll}>
                <Download className="h-4 w-4" /> Tải tất cả ({doneCount} file riêng biệt)
              </Button>
              <Button variant="secondary" onClick={reset}>Convert mới</Button>
            </div>
          ) : (
            <Button size="lg" disabled={!idleItems.length || converting}
              loading={converting} onClick={convertAll} fullWidth>
              <FileText className="h-4 w-4" />
              {converting ? "Đang chuyển đổi..." : `Chuyển ${idleItems.length} ảnh sang PDF`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ─── SplitTab (placeholder) ───────────────────────────────────────────────────
function SplitTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"range" | "every">("range");
  const [range, setRange] = useState("");
  const [every, setEvery] = useState("1");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const process = async () => { setLoading(true); await new Promise((r) => setTimeout(r, 1800)); setLoading(false); setDone(true); };

  if (done) return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>
      <p className="text-lg font-bold text-gray-900">Tách thành công!</p>
      <div className="flex gap-3">
        <Button size="lg"><Download className="h-4 w-4" /> Tải tất cả (.zip)</Button>
        <Button variant="secondary" onClick={() => { setDone(false); setFiles([]); }}>Tách mới</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <UploadBox accept=".pdf" onFilesChange={setFiles} maxSize={50} label="Kéo thả file PDF vào đây" />
      {files.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700">Chế độ tách:</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ id: "range", label: "Theo trang", desc: "Ví dụ: 1-3, 5, 7-9" },
              { id: "every", label: "Mỗi N trang", desc: "Chia đều theo số trang" }].map((m) => (
              <button key={m.id} onClick={() => setMode(m.id as "range" | "every")}
                className={cn("p-4 rounded-xl border text-left transition-all",
                  mode === m.id ? "border-[#ff7a18] bg-orange-50" : "border-gray-200 hover:border-gray-300")}>
                <p className={cn("text-sm font-semibold", mode === m.id ? "text-[#ff7a18]" : "text-gray-700")}>{m.label}</p>
                <p className="text-xs text-gray-400 mt-1">{m.desc}</p>
              </button>
            ))}
          </div>
          {mode === "range" ? (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Nhập trang cần tách</label>
              <input type="text" placeholder="Ví dụ: 1-3, 5, 7-9" value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18] transition-all" />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Tách mỗi N trang</label>
              <input type="number" min="1" value={every}
                onChange={(e) => setEvery(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18] transition-all" />
            </div>
          )}
          <Button size="lg" onClick={process} loading={loading} fullWidth>
            <Scissors className="h-4 w-4" /> Tách PDF
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── SignTab ──────────────────────────────────────────────────────────────────
type SignType = "text" | "draw" | "upload";

// A4 width in points (pdf-lib native unit)
const PDF_A4_WIDTH_PT = 595;

/** Render text to an off-screen canvas and return a PNG blob */
async function textToBlob(text: string, fontSize: number, color: string): Promise<Blob> {
  const padding = 16;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `italic ${fontSize}px "Brush Script MT", "Dancing Script", cursive, sans-serif`;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width) + padding * 2;
  canvas.height = Math.ceil(fontSize * 1.5) + padding;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, padding, canvas.height / 2);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
}

// ─── PDF Page Viewer with draggable signature overlay ────────────────────────
interface SigPos { xPct: number; yPct: number }

function PdfSignViewer({
  fileUrl, numPages, viewPage, onPageChange,
  sigPreviewUrl, sigPos, onSigMove, sigDisplayWidth, containerWidth, onContainerWidth,
}: {
  fileUrl: string; numPages: number; viewPage: number;
  onPageChange: (p: number) => void;
  sigPreviewUrl: string | null; sigPos: SigPos | null;
  onSigMove: (pos: SigPos) => void;
  sigDisplayWidth: number; containerWidth: number;
  onContainerWidth: (w: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  // Track rendered sig height for centered click-to-place
  const [sigNaturalRatio, setSigNaturalRatio] = useState(0.35); // height/width, updated on img load

  // Measure container width for responsive PDF scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      onContainerWidth(Math.floor(entries[0].contentRect.width));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [onContainerWidth]);

  // Click on PDF to place signature — centered at click point
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging.current || !sigPreviewUrl) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const sigH = sigDisplayWidth * sigNaturalRatio;
    onSigMove({
      xPct: Math.max(0, Math.min(1 - sigDisplayWidth / rect.width, (e.clientX - rect.left - sigDisplayWidth / 2) / rect.width)),
      yPct: Math.max(0, Math.min(1 - sigH / rect.height, (e.clientY - rect.top - sigH / 2) / rect.height)),
    });
  };

  // Drag signature overlay
  const handleSigPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = true;
    const rect = containerRef.current!.getBoundingClientRect();
    // dragOffset = pointer position relative to the sig's top-left corner (in pixels)
    dragOffset.current = {
      dx: e.clientX - rect.left - (sigPos?.xPct ?? 0) * rect.width,
      dy: e.clientY - rect.top  - (sigPos?.yPct ?? 0) * rect.height,
    };
  };
  const handleSigPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!isDragging.current) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const sigH = sigDisplayWidth * sigNaturalRatio;
    onSigMove({
      xPct: Math.max(0, Math.min(1 - sigDisplayWidth / rect.width, (e.clientX - rect.left - dragOffset.current.dx) / rect.width)),
      yPct: Math.max(0, Math.min(1 - sigH / rect.height, (e.clientY - rect.top  - dragOffset.current.dy) / rect.height)),
    });
  };
  const handleSigPointerUp = () => { isDragging.current = false; };

  const containerH = containerRef.current?.offsetHeight ?? 0;
  const sigLeft = (sigPos?.xPct ?? 0) * containerWidth;
  const sigTop  = (sigPos?.yPct ?? 0) * containerH;

  return (
    <div className="flex flex-col gap-2">
      {/* Page navigation */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-gray-500">
          Trang {viewPage} / {numPages}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onPageChange(Math.max(1, viewPage - 1))} disabled={viewPage <= 1}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => onPageChange(Math.min(numPages, viewPage + 1))} disabled={viewPage >= numPages}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF canvas + sig overlay */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className={cn(
          "relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100 select-none",
          sigPreviewUrl && !sigPos ? "cursor-crosshair" : "cursor-default"
        )}
      >
        {containerWidth > 0 && (
          <Document file={fileUrl} loading={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          }>
            <Page
              pageNumber={viewPage}
              width={containerWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        )}

        {/* Signature overlay */}
        {sigPreviewUrl && sigPos && (
          <img
            src={sigPreviewUrl}
            alt="Signature preview"
            draggable={false}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.naturalWidth > 0) setSigNaturalRatio(img.naturalHeight / img.naturalWidth);
            }}
            onPointerDown={handleSigPointerDown}
            onPointerMove={handleSigPointerMove}
            onPointerUp={handleSigPointerUp}
            onClick={(e) => e.stopPropagation()} // ← prevent post-drag click from re-placing sig
            style={{
              position: "absolute",
              left: sigLeft,
              top: sigTop,
              width: sigDisplayWidth,
              cursor: isDragging.current ? "grabbing" : "grab",
              userSelect: "none",
              opacity: 0.85,
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.25))",
            }}
          />
        )}

        {/* Hint when sig ready but not placed */}
        {sigPreviewUrl && !sigPos && (
          <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
              <Move className="h-3.5 w-3.5" /> Nhấp vào PDF để đặt chữ ký
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SignTab ──────────────────────────────────────────────────────────────────
function SignTab() {
  // File state
  const [pdfFile, setPdfFile]     = useState<File | null>(null);
  const [pdfFileUrl, setPdfFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages]   = useState(0);
  const [viewPage, setViewPage]   = useState(1);

  // Signature creation
  const [signType, setSignType]         = useState<SignType>("text");
  const [signText, setSignText]         = useState("");
  const [fontSize, setFontSize]         = useState(48);
  const [fontColor, setFontColor]       = useState("#1a1a1a");
  const [uploadedSig, setUploadedSig]   = useState<File | null>(null);
  const [uploadedSigUrl, setUploadedSigUrl] = useState<string | null>(null);
  const [hasDrawing, setHasDrawing]     = useState(false);
  const [sigPreviewUrl, setSigPreviewUrl] = useState<string | null>(null);

  // Placement
  const [sigPos, setSigPos]       = useState<SigPos | null>(null);
  const [sigWidth, setSigWidth]   = useState(180);  // PDF points
  const [signPage, setSignPage]   = useState<string>("last");

  // Container width for responsive scaling
  const [containerWidth, setContainerWidth] = useState(400);

  // Misc
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  // Draw canvas
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const drawing     = useRef(false);
  const lastPos     = useRef<{ x: number; y: number } | null>(null);

  // ── Live signature preview generation ──────────────────────────────────────
  useEffect(() => {
    if (signType !== "text") return;
    if (!signText.trim()) { setSigPreviewUrl(null); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const blob = await textToBlob(signText.trim(), fontSize, fontColor);
      if (!cancelled) {
        const url = URL.createObjectURL(blob);
        setSigPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [signType, signText, fontSize, fontColor]);

  useEffect(() => {
    if (signType !== "upload") return;
    setSigPreviewUrl(uploadedSigUrl);
  }, [signType, uploadedSigUrl]);

  // ── Canvas draw helpers ─────────────────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    drawing.current = true;
    lastPos.current = getCanvasPos(e, canvas);
    e.preventDefault();
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getCanvasPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = fontColor; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    lastPos.current = pos; setHasDrawing(true); e.preventDefault();
  };
  const stopDraw = () => {
    drawing.current = false; lastPos.current = null;
    if (signType === "draw" && hasDrawing) {
      canvasRef.current?.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setSigPreviewUrl((prev) => { if (prev && signType === "draw") URL.revokeObjectURL(prev); return url; });
      }, "image/png");
    }
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false); setSigPreviewUrl(null); setSigPos(null);
  };

  // ── Computed sig display width (pixels on the rendered PDF page) ──────────
  const sigDisplayWidth = Math.round((sigWidth / PDF_A4_WIDTH_PT) * containerWidth);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handlePdfFiles = (files: File[]) => {
    if (!files[0]) return;
    const f = files[0];
    setPdfFile(f);
    if (pdfFileUrl) URL.revokeObjectURL(pdfFileUrl);
    setPdfFileUrl(URL.createObjectURL(f));
    setSigPos(null); setError("");
  };

  const handleUploadSig = (files: File[]) => {
    if (!files.length) return;
    const f = files[0];
    setUploadedSig(f);
    if (uploadedSigUrl) URL.revokeObjectURL(uploadedSigUrl);
    setUploadedSigUrl(URL.createObjectURL(f));
  };

  const handleProcess = async () => {
    if (!pdfFile) { setError("Vui lòng chọn file PDF."); return; }
    if (!sigPreviewUrl && !(signType === "draw" && hasDrawing)) {
      setError("Vui lòng tạo chữ ký trước."); return;
    }
    if (signType === "text" && !signText.trim()) { setError("Vui lòng nhập nội dung chữ ký."); return; }
    if (signType === "draw" && !hasDrawing) { setError("Vui lòng vẽ chữ ký."); return; }
    if (signType === "upload" && !uploadedSig) { setError("Vui lòng tải lên ảnh chữ ký."); return; }
    if (!sigPos) { setError("Vui lòng nhấp vào vị trí bạn muốn đặt chữ ký trên PDF."); return; }
    if (signPage !== "last" && signPage !== "first" && signPage !== "all" && (isNaN(Number(signPage)) || Number(signPage) < 1)) {
      setError("Số trang không hợp lệ."); return;
    }

    setLoading(true); setError("");
    try {
      let sigBlob: Blob;
      if (signType === "text") {
        sigBlob = await textToBlob(signText.trim(), fontSize, fontColor);
      } else if (signType === "draw") {
        sigBlob = await new Promise<Blob>((res, rej) =>
          canvasRef.current!.toBlob((b) => b ? res(b) : rej(new Error("canvas empty")), "image/png")
        );
      } else {
        sigBlob = uploadedSig!;
      }

      const pageVal = (signPage === "last" || signPage === "first" || signPage === "all")
        ? signPage : Number(signPage);

      const blob = await signPdf(pdfFile, sigBlob, {
        page: pageVal as "last" | "first" | "all",
        position: "custom",
        xPct: sigPos.xPct,
        yPct: sigPos.yPct,
        anchorFromTop: true,
        sigWidth,
      });
      setResultBlob(blob); setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ký thất bại, vui lòng thử lại.");
    } finally { setLoading(false); }
  };

  const handleDownload = () => {
    if (!resultBlob || !pdfFile) return;
    downloadBlob(resultBlob, pdfFile.name.replace(/\.pdf$/i, "") + "-signed.pdf");
  };

  const handleReset = () => {
    setPdfFile(null);
    if (pdfFileUrl) URL.revokeObjectURL(pdfFileUrl); setPdfFileUrl(null);
    setSignText(""); setUploadedSig(null);
    if (uploadedSigUrl) URL.revokeObjectURL(uploadedSigUrl); setUploadedSigUrl(null);
    setSigPreviewUrl(null); setSigPos(null);
    setResultBlob(null); setDone(false); setError("");
    setHasDrawing(false); setNumPages(0); setViewPage(1);
    clearCanvas();
  };

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done && resultBlob) return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>
      <p className="text-lg font-bold text-gray-900">Ký thành công!</p>
      <p className="text-sm text-gray-500">File PDF đã được nhúng chữ ký.</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button size="lg" onClick={handleDownload}><Download className="h-4 w-4" /> Tải PDF đã ký</Button>
        <Button variant="secondary" onClick={handleReset}><RotateCcw className="h-4 w-4" /> Ký file mới</Button>
      </div>
    </div>
  );

  // ── Upload screen ───────────────────────────────────────────────────────────
  if (!pdfFile) return (
    <UploadBox
      accept=".pdf"
      onFilesChange={handlePdfFiles}
      maxSize={50}
      label="Kéo thả file PDF cần ký"
      description="Hỗ trợ PDF · Tối đa 50MB"
    />
  );

  // ── Main editing layout ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* PDF file info row */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
        <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-[#ff7a18]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{pdfFile.name}</p>
          <p className="text-xs text-gray-400">
            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
            {numPages > 0 && ` · ${numPages} trang`}
          </p>
        </div>
        <button onClick={handleReset}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

        {/* ── Left: Signature controls ── */}
        <div className="space-y-4">
          {/* Sig type tabs */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Kiểu chữ ký</p>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { id: "text",   label: "Text",    desc: "Nhập tên" },
                { id: "draw",   label: "Vẽ tay",  desc: "Ký tay" },
                { id: "upload", label: "Tải lên", desc: "Ảnh PNG" },
              ] as { id: SignType; label: string; desc: string }[]).map((t) => (
                <button key={t.id} onClick={() => { setSignType(t.id); setError(""); setSigPos(null); setSigPreviewUrl(null); }}
                  className={cn("py-2.5 px-2 rounded-xl border text-center transition-all",
                    signType === t.id
                      ? "border-[#ff7a18] bg-orange-50 text-[#ff7a18]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                  <span className="block text-xs font-semibold">{t.label}</span>
                  <span className="block text-[10px] opacity-60 mt-0.5">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text signature */}
          {signType === "text" && (
            <div className="space-y-3">
              <input type="text" placeholder="Nguyễn Văn A" value={signText}
                onChange={(e) => { setSignText(e.target.value); setError(""); setSigPos(null); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18]" />
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">Cỡ: {fontSize}px</label>
                  <input type="range" min={24} max={96} step={4} value={fontSize}
                    onChange={(e) => { setFontSize(Number(e.target.value)); setSigPos(null); }}
                    className="w-full accent-[#ff7a18]" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">Màu</label>
                  <input type="color" value={fontColor}
                    onChange={(e) => { setFontColor(e.target.value); setSigPos(null); }}
                    className="h-8 w-12 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                </div>
              </div>
              {signText && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center overflow-hidden">
                  <span style={{ fontSize: Math.min(fontSize * 0.6, 32), color: fontColor, fontStyle: "italic", fontFamily: "'Brush Script MT', cursive" }}>
                    {signText}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Draw signature */}
          {signType === "draw" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-600">Vẽ chữ ký</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)}
                    className="h-6 w-9 rounded border border-gray-200 cursor-pointer p-0.5" />
                  <button onClick={clearCanvas}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 border border-gray-200 transition-colors">
                    <Trash2 className="h-3 w-3" /> Xóa
                  </button>
                </div>
              </div>
              <canvas ref={canvasRef} width={600} height={150}
                className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-white cursor-crosshair touch-none"
                style={{ maxHeight: 130 }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
              {!hasDrawing && <p className="text-[11px] text-gray-400 text-center">Nhấn giữ và kéo để vẽ</p>}
            </div>
          )}

          {/* Upload signature */}
          {signType === "upload" && (
            <div className="space-y-2">
              {!uploadedSigUrl ? (
                <UploadBox accept=".png,.jpg,.jpeg,.webp" onFilesChange={handleUploadSig} maxSize={5}
                  label="Tải ảnh chữ ký" description="PNG nền trong suốt tốt nhất · ≤ 5MB" />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50">
                  <img src={uploadedSigUrl} alt="sig" className="h-12 max-w-[140px] object-contain rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{uploadedSig?.name}</p>
                  </div>
                  <button onClick={() => { setUploadedSig(null); if (uploadedSigUrl) URL.revokeObjectURL(uploadedSigUrl); setUploadedSigUrl(null); setSigPreviewUrl(null); setSigPos(null); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sig size */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Kích thước: <span className="text-[#ff7a18]">{sigWidth}pt</span>
            </label>
            <input type="range" min={60} max={400} step={10} value={sigWidth}
              onChange={(e) => { setSigWidth(Number(e.target.value)); setSigPos(null); }}
              className="w-full accent-[#ff7a18]" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>Nhỏ</span><span>Lớn</span></div>
          </div>

          {/* Page to sign */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Ký vào trang</label>
            <select value={signPage} onChange={(e) => setSignPage(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18]">
              <option value="last">Trang cuối</option>
              <option value="first">Trang đầu</option>
              <option value="all">Tất cả trang</option>
              {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                <option key={n} value={String(n)}>Trang {n}</option>
              ))}
            </select>
          </div>

          {/* Sig preview badge */}
          {sigPreviewUrl && !sigPos && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
              <Move className="h-3.5 w-3.5 shrink-0" />
              <span>Nhấp vào PDF bên phải để đặt chữ ký</span>
            </div>
          )}
          {sigPos && (
            <div className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
              <span>✓ Đã đặt vị trí chữ ký</span>
              <button onClick={() => setSigPos(null)} className="underline text-green-600 hover:text-green-800">Đặt lại</button>
            </div>
          )}
        </div>

        {/* ── Right: PDF viewer ── */}
        <div className="min-w-0">
          {pdfFileUrl && (
            <PdfSignViewer
              fileUrl={pdfFileUrl}
              numPages={numPages}
              viewPage={viewPage}
              onPageChange={(p) => {
                setViewPage(p);
                setSignPage(String(p));
              }}
              sigPreviewUrl={sigPreviewUrl}
              sigPos={sigPos}
              onSigMove={(pos) => {
                setSigPos(pos);
                // Sync view page to sign page
                if (signPage !== "all" && signPage !== "first" && signPage !== "last") {
                  setSignPage(String(viewPage));
                }
              }}
              sigDisplayWidth={sigDisplayWidth}
              containerWidth={containerWidth}
              onContainerWidth={setContainerWidth}
            />
          )}
          <Document file={pdfFileUrl!} onLoadSuccess={({ numPages: n }) => { setNumPages(n); }} className="hidden" />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Submit */}
      <Button size="lg" onClick={handleProcess} loading={loading} fullWidth
        disabled={loading || !sigPos || !pdfFile}>
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang ký PDF...</>
          : <><PenTool className="h-4 w-4" /> Ký vào PDF</>}
      </Button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function PDFToolsContent() {
  const { user } = useAuth();
  const appUser = user
    ? { name: user.name || "Người dùng", email: user.email || "" }
    : { name: "Người dùng", email: "" };
  const [activeTab, setActiveTab] = useState<TabId>("img2pdf");

  return (
    <AppLayout user={appUser}>
      <div className={cn("mx-auto space-y-6", activeTab === "sign" ? "max-w-5xl" : "max-w-3xl")}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gradient-to-br from-[#ff7a18] to-amber-500 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PDF Tools</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">Chuyển ảnh sang PDF, tách và ký số file PDF</p>
        </div>

        <div className="flex gap-3">
          {tabs.map((tab) => (
            <button key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={cn("flex-1 flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all duration-200 relative",
                tab.disabled
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                  : activeTab === tab.id
                    ? "border-[#ff7a18] bg-orange-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300")}>
              <tab.icon className={cn("h-5 w-5", !tab.disabled && activeTab === tab.id ? "text-[#ff7a18]" : "text-gray-400")} />
              <span className={cn("text-sm font-semibold hidden sm:block", !tab.disabled && activeTab === tab.id ? "text-[#ff7a18]" : "text-gray-600")}>
                {tab.label}
              </span>
              {tab.disabled
                ? <span className="text-xs text-gray-400 hidden md:block">Sắp ra mắt</span>
                : <span className="text-xs text-gray-400 hidden md:block text-center leading-tight">{tab.desc}</span>}
            </button>
          ))}
        </div>

        <Card>
          {activeTab === "img2pdf" && <ImgToPdfTab />}
          {activeTab === "split"   && <SplitTab />}
          {activeTab === "sign"    && <SignTab />}
        </Card>
      </div>
    </AppLayout>
  );
}

export default function PDFToolsPage() {
  return (
    <AuthGuard>
      <PDFToolsContent />
    </AuthGuard>
  );
}
