import { useState, useEffect, useCallback } from "react";
import {
  FileText, Scissors, PenTool, Download, X, CheckCircle,
  ArrowUp, ArrowDown, Loader2, AlertCircle, Image as ImageIcon,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UploadBox from "@/components/ui/UploadBox";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/context/AuthContext";
import { downloadBlob } from "@/lib/api";
import { convertFiles as convertFilesApi } from "@/lib/services/convert.service";
import { cn } from "@/lib/utils";

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
  { id: "sign",    label: "Ký PDF",    icon: PenTool,   desc: "Thêm chữ ký số vào tài liệu",        disabled: true },
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

// ─── SignTab (placeholder) ────────────────────────────────────────────────────
function SignTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [signType, setSignType] = useState<"text" | "draw" | "upload">("text");
  const [signText, setSignText] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const process = async () => { setLoading(true); await new Promise((r) => setTimeout(r, 2000)); setLoading(false); setDone(true); };

  if (done) return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>
      <p className="text-lg font-bold text-gray-900">Ký thành công!</p>
      <div className="flex gap-3">
        <Button size="lg"><Download className="h-4 w-4" /> Tải PDF đã ký</Button>
        <Button variant="secondary" onClick={() => { setDone(false); setFiles([]); setSignText(""); }}>Ký mới</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <UploadBox accept=".pdf" onFilesChange={setFiles} maxSize={50} label="Kéo thả file PDF cần ký" />
      {files.length > 0 && (
        <>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Kiểu chữ ký:</p>
            <div className="grid grid-cols-3 gap-3">
              {[{ id: "text", label: "Nhập text" }, { id: "draw", label: "Vẽ tay" }, { id: "upload", label: "Tải ảnh" }].map((t) => (
                <button key={t.id} onClick={() => setSignType(t.id as "text" | "draw" | "upload")}
                  className={cn("py-3 px-4 rounded-xl border text-sm font-medium transition-all",
                    signType === t.id ? "border-[#ff7a18] bg-orange-50 text-[#ff7a18]" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {signType === "text" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Tên/chữ ký</label>
              <input type="text" placeholder="Nhập tên hoặc chữ ký..." value={signText}
                onChange={(e) => setSignText(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18] transition-all" />
              {signText && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <span className="text-2xl text-gray-700">{signText}</span>
                </div>
              )}
            </div>
          )}
          {signType === "draw" && (
            <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center h-32 flex items-center justify-center">
              <p className="text-sm text-gray-400">Canvas vẽ tay (chức năng sắp ra mắt)</p>
            </div>
          )}
          {signType === "upload" && <UploadBox accept=".png,.jpg" label="Tải ảnh chữ ký (nền trong suốt)" />}
          <Button size="lg" onClick={process} loading={loading} disabled={signType === "text" && !signText} fullWidth>
            <PenTool className="h-4 w-4" /> Ký vào PDF
          </Button>
        </>
      )}
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
      <div className="max-w-3xl mx-auto space-y-6">
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
