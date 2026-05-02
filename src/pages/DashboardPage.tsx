import { Link } from "react-router-dom";
import {
  ImageMinus, RefreshCw, FileText, TrendingUp, Clock, Download, ArrowRight, Image, File,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/context/AuthContext";

const tools = [
  {
    href: "/remove-bg",
    icon: ImageMinus,
    label: "Xóa nền ảnh",
    description: "Tự động xóa background ảnh chỉ trong 1 click",
    color: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    textColor: "text-violet-600",
    count: "2.3k ảnh",
  },
  {
    href: "/convert",
    icon: RefreshCw,
    label: "Convert File",
    description: "Chuyển đổi định dạng tài liệu, ảnh nhanh chóng",
    color: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    count: "150 định dạng",
  },
  {
    href: "/pdf-tools",
    icon: FileText,
    label: "PDF Tools",
    description: "Gộp, tách, ký số file PDF dễ dàng",
    color: "from-[#ff7a18] to-amber-500",
    bgLight: "bg-orange-50",
    textColor: "text-[#ff7a18]",
    count: "3 công cụ",
  },
];

const stats = [
  { label: "File đã xử lý", value: "1,248", icon: TrendingUp, change: "+12%" },
  { label: "Thời gian tiết kiệm", value: "6.5h", icon: Clock, change: "+8%" },
  { label: "Lượt tải về", value: "342", icon: Download, change: "+24%" },
];

const recentFiles = [
  { name: "banner-product.png", type: "Xóa nền", time: "2 phút trước", icon: Image, size: "2.1 MB" },
  { name: "report-q4-2024.pdf", type: "PDF merge", time: "1 giờ trước", icon: File, size: "4.8 MB" },
  { name: "presentation.pptx", type: "Convert → PDF", time: "3 giờ trước", icon: File, size: "12 MB" },
  { name: "profile-photo.jpg", type: "Xóa nền", time: "Hôm qua", icon: Image, size: "1.2 MB" },
  { name: "contract-2024.pdf", type: "PDF sign", time: "2 ngày trước", icon: File, size: "380 KB" },
];

function DashboardContent() {
  const { user } = useAuth();
  const appUser = user
    ? { name: user.name || "Người dùng", email: user.email || "" }
    : { name: "Người dùng", email: "" };
  const firstName = appUser.name.split(" ").pop();

  return (
    <AppLayout user={appUser}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Xin chào, {firstName} 👋</h1>
            <p className="text-gray-500 mt-1">
              Bạn đã xử lý <span className="font-semibold text-[#ff7a18]">1,248 file</span> trong tháng này
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                <stat.icon className="h-6 w-6 text-[#ff7a18]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </Card>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Công cụ</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Link key={tool.href} to={tool.href}>
                <Card hoverable className="group h-full flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-sm`}>
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#ff7a18] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tool.label}</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{tool.description}</p>
                  </div>
                  <div className={`mt-auto inline-flex items-center gap-1.5 text-xs font-semibold ${tool.textColor} ${tool.bgLight} px-2.5 py-1.5 rounded-full w-fit`}>
                    {tool.count}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">File gần đây</h2>
            <Link to="/history" className="text-sm text-[#ff7a18] hover:text-[#e06510] font-medium flex items-center gap-1 transition-colors">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Card padding="none">
            <div className="divide-y divide-gray-50">
              {recentFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <file.icon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{file.type} · {file.size}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{file.time}</span>
                  <button className="p-2 rounded-lg text-gray-400 hover:text-[#ff7a18] hover:bg-orange-50 transition-colors shrink-0">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
