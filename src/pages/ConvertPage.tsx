import { useState } from "react";
import {
  RefreshCw, ChevronDown, Download, RotateCcw, CheckCircle, Info,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UploadBox from "@/components/ui/UploadBox";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";

const FORMAT_GROUPS = [
  { group: "Tài liệu", formats: ["PDF", "DOCX", "DOC", "TXT", "RTF", "ODT"] },
  { group: "Hình ảnh", formats: ["PNG", "JPG", "WEBP", "BMP", "GIF", "TIFF", "SVG"] },
  { group: "Bảng tính", formats: ["XLSX", "XLS", "CSV", "ODS"] },
  { group: "Trình chiếu", formats: ["PPTX", "PPT", "ODP"] },
];

type Stage = "idle" | "ready" | "converting" | "done";

function ConvertContent() {
  const { user } = useAuth();
  const appUser = user
    ? { name: user.name || "Người dùng", email: user.email || "" }
    : { name: "Người dùng", email: "" };

  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");

  const handleFiles = (f: File[]) => {
    setFiles(f);
    if (f.length > 0) setStage("ready");
    else setStage("idle");
  };

  const handleConvert = async () => {
    if (!targetFormat) return;
    setStage("converting");
    await new Promise((r) => setTimeout(r, 2200));
    setStage("done");
  };

  const handleReset = () => {
    setFiles([]);
    setTargetFormat("");
    setStage("idle");
  };

  const canConvert = files.length > 0 && targetFormat !== "";

  return (
    <AppLayout user={appUser}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Convert File</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Chuyển đổi tài liệu, hình ảnh sang hơn 150 định dạng
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { step: "1", label: "Tải lên file", active: true },
            { step: "2", label: "Chọn định dạng", active: stage !== "idle" },
            { step: "3", label: "Tải về kết quả", active: stage === "done" },
          ].map((s) => (
            <div
              key={s.step}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl border transition-all",
                s.active ? "border-[#ff7a18]/30 bg-orange-50" : "border-gray-100 bg-white"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  s.active ? "bg-[#ff7a18] text-white" : "bg-gray-100 text-gray-400"
                )}
              >
                {s.step}
              </div>
              <span className={cn("text-sm font-medium", s.active ? "text-gray-800" : "text-gray-400")}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Bước 1: Chọn file cần convert</h2>
          <UploadBox
            multiple
            onFilesChange={handleFiles}
            maxSize={50}
            label="Kéo & thả file vào đây"
            description="Hỗ trợ hầu hết các định dạng phổ biến · Tối đa 50MB"
          />
        </Card>

        {stage !== "idle" && (
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Bước 2: Chọn định dạng đầu ra</h2>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm transition-all",
                  dropdownOpen
                    ? "border-[#ff7a18] ring-2 ring-[#ff7a18]/20"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span className={targetFormat ? "text-gray-900 font-medium" : "text-gray-400"}>
                  {targetFormat || "Chọn định dạng đầu ra..."}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", dropdownOpen && "rotate-180")} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                  <div className="max-h-72 overflow-y-auto p-2">
                    {FORMAT_GROUPS.map((group) => (
                      <div key={group.group}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                          {group.group}
                        </p>
                        <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                          {group.formats.map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => { setTargetFormat(fmt); setDropdownOpen(false); }}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                targetFormat === fmt
                                  ? "bg-[#ff7a18] text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              {fmt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {stage === "done" ? (
          <Card className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-lg">Hoàn thành!</p>
              <p className="text-gray-500 text-sm mt-1">
                {files.length} file đã được chuyển đổi sang {targetFormat}
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="lg">
                <Download className="h-4 w-4" /> Tải về tất cả
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" /> Convert mới
              </Button>
            </div>
          </Card>
        ) : (
          stage !== "idle" && (
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={handleConvert}
                loading={stage === "converting"}
                disabled={!canConvert || stage === "converting"}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className="h-4 w-4" />
                {stage === "converting" ? "Đang convert..." : "Bắt đầu convert"}
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" /> Làm lại
              </Button>
            </div>
          )
        )}

        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            File sau khi convert sẽ được lưu trong <strong>Lịch sử</strong> và
            có thể tải lại trong vòng <strong>7 ngày</strong>.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

export default function ConvertPage() {
  return (
    <AuthGuard>
      <ConvertContent />
    </AuthGuard>
  );
}
