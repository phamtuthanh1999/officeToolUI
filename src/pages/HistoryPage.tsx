import { useState } from "react";
import {
  History, Download, Trash2, Search, Image, File, RefreshCw, FileText,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";

type HistoryType = "all" | "remove-bg" | "convert" | "pdf";

const typeLabels: Record<HistoryType, string> = {
  all: "Tất cả",
  "remove-bg": "Xóa nền",
  convert: "Convert",
  pdf: "PDF",
};

const typeIcons: Record<string, React.ElementType> = {
  "Xóa nền": Image,
  Convert: RefreshCw,
  "PDF merge": FileText,
  "PDF sign": FileText,
  "PDF split": FileText,
};

const typeColors: Record<string, string> = {
  "Xóa nền": "bg-violet-100 text-violet-600",
  Convert: "bg-blue-100 text-blue-600",
  "PDF merge": "bg-orange-100 text-orange-600",
  "PDF sign": "bg-orange-100 text-orange-600",
  "PDF split": "bg-orange-100 text-orange-600",
};

const mockHistory = [
  { id: 1, name: "banner-hero.png", type: "Xóa nền", size: "2.3 MB", time: "2025-04-30 14:22" },
  { id: 2, name: "report-q1-2025.pdf", type: "PDF merge", size: "8.1 MB", time: "2025-04-30 10:05" },
  { id: 3, name: "profile-avatar.jpg", type: "Xóa nền", size: "1.1 MB", time: "2025-04-29 18:40" },
  { id: 4, name: "presentation-final.pptx", type: "Convert", size: "14.5 MB", time: "2025-04-29 09:15" },
  { id: 5, name: "contract-q2.pdf", type: "PDF sign", size: "640 KB", time: "2025-04-28 16:30" },
  { id: 6, name: "product-catalog.pdf", type: "PDF split", size: "22 MB", time: "2025-04-28 11:00" },
  { id: 7, name: "team-photo.png", type: "Xóa nền", size: "4.8 MB", time: "2025-04-27 08:45" },
  { id: 8, name: "invoice-2025.docx", type: "Convert", size: "520 KB", time: "2025-04-26 14:20" },
];

function HistoryContent() {
  const { user } = useAuth();
  const appUser = user
    ? { name: user.name || "Người dùng", email: user.email || "" }
    : { name: "Người dùng", email: "" };

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<HistoryType>("all");
  const [selected, setSelected] = useState<number[]>([]);

  const filtered = mockHistory.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "remove-bg" && item.type === "Xóa nền") ||
      (filter === "convert" && item.type === "Convert") ||
      (filter === "pdf" && item.type.startsWith("PDF"));
    return matchSearch && matchFilter;
  });

  const toggleSelect = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((f) => f.id));
  };

  return (
    <AppLayout user={appUser}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                <History className="h-5 w-5 text-gray-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử</h1>
            </div>
            <p className="text-gray-500 text-sm ml-12">{mockHistory.length} file đã xử lý</p>
          </div>
          {selected.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{selected.length} đã chọn</span>
              <Button variant="secondary" size="sm"><Download className="h-4 w-4" /> Tải về</Button>
              <Button variant="danger" size="sm"><Trash2 className="h-4 w-4" /> Xóa</Button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/30 focus:border-[#ff7a18] transition-all bg-white"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(typeLabels) as HistoryType[]).map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-sm font-medium transition-all",
                  filter === key
                    ? "bg-[#ff7a18] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {typeLabels[key]}
              </button>
            ))}
          </div>
        </div>

        <Card padding="none">
          <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
            <input
              type="checkbox"
              checked={selected.length === filtered.length && filtered.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 accent-[#ff7a18] rounded"
            />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-1">Tên file</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 hidden md:block">Loại</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 hidden sm:block">Kích thước</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-36 hidden lg:block">Thời gian</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 text-right">Thao tác</span>
          </div>

          <div className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                <History className="h-10 w-10" />
                <p className="text-sm">Không tìm thấy file nào</p>
              </div>
            ) : (
              filtered.map((item) => {
                const Icon = typeIcons[item.type] || File;
                const isSelected = selected.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 transition-colors",
                      isSelected ? "bg-orange-50/60" : "hover:bg-gray-50/70"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 accent-[#ff7a18] rounded shrink-0"
                    />
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full w-24 text-center hidden md:block",
                        typeColors[item.type] || "bg-gray-100 text-gray-600"
                      )}
                    >
                      {item.type}
                    </span>
                    <span className="text-sm text-gray-400 w-20 hidden sm:block">{item.size}</span>
                    <span className="text-sm text-gray-400 w-36 hidden lg:block">{item.time}</span>
                    <div className="flex items-center justify-end gap-1 w-20">
                      <button className="p-2 rounded-lg text-gray-400 hover:text-[#ff7a18] hover:bg-orange-50 transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-400">
                Hiển thị {filtered.length} / {mockHistory.length} file
              </p>
              <div className="flex gap-1">
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                      page === 1 ? "bg-[#ff7a18] text-white" : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

export default function HistoryPage() {
  return (
    <AuthGuard>
      <HistoryContent />
    </AuthGuard>
  );
}
