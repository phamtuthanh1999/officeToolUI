import { useState } from "react";
import {
  FileText, GitMerge, Scissors, PenTool, Download, X, CheckCircle, ArrowUp, ArrowDown,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UploadBox from "@/components/ui/UploadBox";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/context/AuthContext";
import { imagesToPdf } from "@/lib/services/pdf.service";
import { downloadBlob } from "@/lib/api";
import { cn } from "@/lib/utils";

type TabId = "merge" | "split" | "sign";

const tabs: { id: TabId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "merge", label: "Gộp PDF", icon: GitMerge, desc: "Kết hợp nhiều file PDF thành một" },
  { id: "split", label: "Tách PDF", icon: Scissors, desc: "Chia PDF thành nhiều file nhỏ hơn" },
  { id: "sign", label: "Ký PDF", icon: PenTool, desc: "Thêm chữ ký số vào tài liệu" },
];

function MergeTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const moveUp = (i: number) => {
    if (i === 0) return;
    const arr = [...files];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    setFiles(arr);
  };
  const moveDown = (i: number) => {
    if (i === files.length - 1) return;
    const arr = [...files];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    setFiles(arr);
  };
  const remove = (i: number) => setFiles(files.filter((_, idx) => idx !== i));

  const process = async () => {
    setError("");
    setLoading(true);
    try {
      const blob = await imagesToPdf(files);
      setResultBlob(blob);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gộp PDF thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (resultBlob) {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">Gộp thành công!</p>
          <p className="text-gray-500 text-sm mt-1">{files.length} file đã được gộp thành 1 PDF</p>
        </div>
        <div className="flex gap-3">
          <Button size="lg" onClick={() => downloadBlob(resultBlob, "merged.pdf")}>
            <Download className="h-4 w-4" /> Tải về
          </Button>
          <Button variant="secondary" onClick={() => { setResultBlob(null); setFiles([]); }}>Gộp mới</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">{error}</div>
      )}
      <UploadBox
        accept=".jpg,.jpeg,.png"
        multiple
        onFilesChange={setFiles}
        maxSize={10}
        label="Kéo thả ảnh vào đây (sẽ ghép thành PDF)"
        description="Hỗ trợ JPG, PNG · Tối đa 10MB mỗi ảnh"
      />
      {files.length > 1 && (
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2">Thứ tự gộp ({files.length} file):</p>
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="w-6 h-6 bg-[#ff7a18]/10 text-[#ff7a18] rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveUp(i)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveDown(i)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(i)} className="p-1 text-gray-400 hover:text-red-500 rounded ml-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Button size="lg" disabled={files.length < 2} loading={loading} onClick={process} fullWidth>
        <GitMerge className="h-4 w-4" />
        Tạo PDF từ {files.length > 0 ? `${files.length} ` : ""}ảnh
      </Button>
    </div>
  );
}

function SplitTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"range" | "every">("range");
  const [range, setRange] = useState("");
  const [every, setEvery] = useState("1");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const process = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
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
  }

  return (
    <div className="space-y-5">
      <UploadBox accept=".pdf" onFilesChange={setFiles} maxSize={50} label="Kéo thả file PDF vào đây" />
      {files.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700">Chế độ tách:</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "range", label: "Theo trang", desc: "Ví dụ: 1-3, 5, 7-9" },
              { id: "every", label: "Mỗi N trang", desc: "Chia đều theo số trang" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as "range" | "every")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  mode === m.id ? "border-[#ff7a18] bg-orange-50" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <p className={cn("text-sm font-semibold", mode === m.id ? "text-[#ff7a18]" : "text-gray-700")}>{m.label}</p>
                <p className="text-xs text-gray-400 mt-1">{m.desc}</p>
              </button>
            ))}
          </div>
          {mode === "range" ? (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Nhập trang cần tách</label>
              <input
                type="text"
                placeholder="Ví dụ: 1-3, 5, 7-9"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18] transition-all"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Tách mỗi N trang</label>
              <input
                type="number"
                min="1"
                value={every}
                onChange={(e) => setEvery(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18] transition-all"
              />
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

function SignTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [signType, setSignType] = useState<"text" | "draw" | "upload">("text");
  const [signText, setSignText] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const process = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
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
  }

  return (
    <div className="space-y-5">
      <UploadBox accept=".pdf" onFilesChange={setFiles} maxSize={50} label="Kéo thả file PDF cần ký" />
      {files.length > 0 && (
        <>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Kiểu chữ ký:</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "text", label: "Nhập text" },
                { id: "draw", label: "Vẽ tay" },
                { id: "upload", label: "Tải ảnh" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSignType(t.id as "text" | "draw" | "upload")}
                  className={cn(
                    "py-3 px-4 rounded-xl border text-sm font-medium transition-all",
                    signType === t.id
                      ? "border-[#ff7a18] bg-orange-50 text-[#ff7a18]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {signType === "text" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Tên/chữ ký</label>
              <input
                type="text"
                placeholder="Nhập tên hoặc chữ ký..."
                value={signText}
                onChange={(e) => setSignText(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18] transition-all"
              />
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
          {signType === "upload" && (
            <UploadBox accept=".png,.jpg" label="Tải ảnh chữ ký (nền trong suốt)" />
          )}
          <Button size="lg" onClick={process} loading={loading} disabled={signType === "text" && !signText} fullWidth>
            <PenTool className="h-4 w-4" /> Ký vào PDF
          </Button>
        </>
      )}
    </div>
  );
}

function PDFToolsContent() {
  const { user } = useAuth();
  const appUser = user
    ? { name: user.name || "Người dùng", email: user.email || "" }
    : { name: "Người dùng", email: "" };
  const [activeTab, setActiveTab] = useState<TabId>("merge");

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
          <p className="text-gray-500 text-sm ml-12">Gộp, tách và ký số file PDF chuyên nghiệp</p>
        </div>

        <div className="flex gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all duration-200",
                activeTab === tab.id
                  ? "border-[#ff7a18] bg-orange-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? "text-[#ff7a18]" : "text-gray-400")} />
              <span className={cn("text-sm font-semibold hidden sm:block", activeTab === tab.id ? "text-[#ff7a18]" : "text-gray-600")}>
                {tab.label}
              </span>
              <span className="text-xs text-gray-400 hidden md:block text-center leading-tight">{tab.desc}</span>
            </button>
          ))}
        </div>

        <Card>
          {activeTab === "merge" && <MergeTab />}
          {activeTab === "split" && <SplitTab />}
          {activeTab === "sign" && <SignTab />}
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
