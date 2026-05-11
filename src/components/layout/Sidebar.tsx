import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/context/AuthContext";
import {
  LayoutDashboard, Maximize2, RefreshCw, FileText, History, Settings, Zap, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/resize", icon: Maximize2, label: "Thay đổi size ảnh" },
  { href: "/convert", icon: RefreshCw, label: "Convert file" },
  { href: "/pdf-tools", icon: FileText, label: "PDF Tools" },
  { href: "/history", icon: History, label: "Lịch sử" },
];

const bottomItems = [{ href: "/settings", icon: Settings, label: "Cài đặt" }];

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#ff7a18] rounded-xl flex items-center justify-center shadow-sm">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Office Tools</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
          Công cụ
        </p>
        {navItems.map((item) => {
          const active =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-orange-50 text-[#ff7a18]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(active ? "text-[#ff7a18]" : "text-gray-400")}
                style={{ width: "18px", height: "18px" }}
              />
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 bg-[#ff7a18] rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        {bottomItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-orange-50 text-[#ff7a18]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                style={{ width: "18px", height: "18px" }}
                className={active ? "text-[#ff7a18]" : "text-gray-400"}
              />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <LogOut style={{ width: "18px", height: "18px" }} className="text-gray-400" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
