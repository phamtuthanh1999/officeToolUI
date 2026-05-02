import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell, Search, Menu, X, Zap,
  LayoutDashboard, ImageMinus, RefreshCw, FileText, History, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/AuthContext";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/remove-bg", icon: ImageMinus, label: "Xóa nền" },
  { href: "/convert", icon: RefreshCw, label: "Convert" },
  { href: "/pdf-tools", icon: FileText, label: "PDF" },
  { href: "/history", icon: History, label: "Lịch sử" },
  { href: "/settings", icon: Settings, label: "Cài đặt" },
];

interface NavbarProps {
  user?: { name: string; email: string; avatar?: string };
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 h-16 flex items-center px-4 lg:px-6 gap-4">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xs hidden sm:flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-400 hover:border-gray-300 transition-colors cursor-pointer">
          <Search className="h-4 w-4 shrink-0" />
          <span>Tìm kiếm...</span>
          <kbd className="ml-auto text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono hidden md:block">
            ⌘K
          </kbd>
        </div>

        <div className="flex-1 lg:hidden" />

        {/* Right */}
        <div className="flex items-center gap-2">
          <button className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff7a18] rounded-full" />
          </button>
          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#ff7a18] to-[#ff9a4d] rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user?.name || "Người dùng"}
                </p>
                <p className="text-xs text-gray-400 leading-tight">{user?.email || ""}</p>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#ff7a18] rounded-xl flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white fill-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">Office Tools</span>
              </div>
              <button
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-orange-50 text-[#ff7a18]"
                        : "text-gray-600 hover:bg-gray-50"
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
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
