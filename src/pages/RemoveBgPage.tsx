import { useState } from "react";
import { Download, RotateCcw, Sparkles, Info } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UploadBox from "@/components/ui/UploadBox";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/context/AuthContext";
import { removeBackground } from "@/lib/services/image.service";
import { downloadBlob } from "@/lib/api";

type Stage = "idle" | "preview" | "processing" | "done";

function RemoveBgContent() {
  const { user } = useAuth();
  const appUser = user
    ? { name: user.name || "Người dùng", email: user.email || "" }
    : { name: "Người dùng", email: "" };

  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleFiles = (files: File[]) => {
    if (files.length === 0) { setStage("idle"); return; }
    const f = files[0];
    setFile(f);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(URL.createObjectURL(f));
    setResultBlob(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setError("");
    setStage("preview");
  };

  const handleProcess = async () => {
    if (!file) return;
    setError("");
    setStage("processing");
    try {
      const blob = await removeBackground(file);
      setResultBlob(blob);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setStage("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xử lý thất bại, vui lòng thử lại");
      setStage("preview");
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const name = file.name.replace(/\.[^.]+$/, "") + "-nobg.png";
    downloadBlob(resultBlob, name);
  };

  const handleReset = () => {
    setStage("idle");
    setFile(null);
    setResultBlob(null);
    setError("");
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalUrl(null);
    setResultUrl(null);
  };

  return (
    <AppLayout user={appUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Xóa nền ảnh</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Tự động loại bỏ background bằng AI — miễn phí, nhanh chóng
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 bg-violet-50 rounded-2xl border border-violet-100">
          <Info className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
          <p className="text-sm text-violet-700">
            Hỗ trợ định dạng: <strong>JPG, PNG</strong>. Kích thước tối đa <strong>5MB</strong> mỗi ảnh.
            Ảnh sau khi xử lý sẽ có nền trong suốt (PNG).
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {stage === "idle" && (
          <Card>
            <UploadBox
              accept=".jpg,.jpeg,.png"
              onFilesChange={handleFiles}
              maxSize={5}
              label="Kéo & thả ảnh vào đây"
              description="Hỗ trợ JPG, PNG — tối đa 5MB"
            />
          </Card>
        )}

        {(stage === "preview" || stage === "processing" || stage === "done") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Ảnh gốc</p>
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {originalUrl ? (
                  <img src={originalUrl} alt="Original" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-gray-300 text-sm">Chưa có ảnh</div>
                )}
              </div>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Sau khi xử lý</p>
              <div
                className="aspect-square rounded-xl overflow-hidden flex items-center justify-center relative"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='10' height='10' fill='%23e5e7eb'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23e5e7eb'/%3E%3Crect x='10' width='10' height='10' fill='%23f9fafb'/%3E%3Crect y='10' width='10' height='10' fill='%23f9fafb'/%3E%3C/svg%3E\")",
                }}
              >
                {stage === "processing" && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-[3px] border-[#ff7a18] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-gray-600">Đang xử lý...</p>
                  </div>
                )}
                {stage === "done" && resultUrl && (
                  <img src={resultUrl} alt="Result" className="w-full h-full object-contain" />
                )}
                {stage === "preview" && (
                  <div className="text-gray-400 text-sm text-center px-4">
                    Nhấn xử lý để thấy kết quả
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {stage !== "idle" && (
          <Card className="flex flex-wrap items-center gap-3">
            {stage === "preview" && (
              <>
                <Button onClick={handleProcess} size="lg">
                  <Sparkles className="h-4 w-4" /> Xóa nền ngay
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
                  <Download className="h-4 w-4" /> Tải về PNG
                </Button>
                <Button variant="secondary" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" /> Xử lý ảnh mới
                </Button>
              </>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Chính xác cao", desc: "AI phát hiện đường viền chi tiết đến từng sợi tóc" },
            { title: "Siêu nhanh", desc: "Xử lý trong vòng 2–5 giây cho mỗi ảnh" },
            { title: "Powered by remove.bg", desc: "API xóa nền hàng đầu thế giới" },
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

export default function RemoveBgPage() {
  return (
    <AuthGuard>
      <RemoveBgContent />
    </AuthGuard>
  );
}
