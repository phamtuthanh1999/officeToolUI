import { useState, useEffect } from "react";
import {
  Settings, User, Lock, Bell, Shield, LogOut, Camera, Eye, EyeOff, ChevronRight, Trash2,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/context/AuthContext";
import { updateMe, changePassword } from "@/lib/services/auth.service";
import { cn } from "@/lib/utils";

type SectionId = "profile" | "password" | "notifications" | "security";

const sections = [
  { id: "profile" as SectionId, label: "Hồ sơ", icon: User },
  { id: "password" as SectionId, label: "Mật khẩu", icon: Lock },
  { id: "notifications" as SectionId, label: "Thông báo", icon: Bell },
  { id: "security" as SectionId, label: "Bảo mật", icon: Shield },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-200",
        checked ? "bg-[#ff7a18]" : "bg-gray-200"
      )}
    >
      <div
        className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function SettingsContent() {
  const { user, logout } = useAuth();
  const appUser = user
    ? { name: user.name || "Người dùng", email: user.email || "" }
    : { name: "Người dùng", email: "" };

  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [profile, setProfile] = useState({ name: appUser.name, email: appUser.email });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (user) {
      setProfile((p) => ({
        ...p,
        name: user.name || p.name,
        email: user.email || p.email,
      }));
    }
  }, [user]);

  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    marketing: false,
    weekly: true,
  });

  const saveProfile = async () => {
    setProfileError("");
    setProfileMessage("");
    setProfileLoading(true);
    try {
      await updateMe({ name: profile.name });
      setProfileMessage("Đã lưu thay đổi!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setProfileLoading(false);
    }
  };

  const savePassword = async () => {
    setPwError("");
    setPwMessage("");
    if (passwords.new !== passwords.confirm) {
      setPwError("Mật khẩu xác nhận không khớp");
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(passwords.current, passwords.new);
      setPwMessage("Đổi mật khẩu thành công!");
      setPasswords({ current: "", new: "", confirm: "" });
      setTimeout(() => setPwMessage(""), 3000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Đổi mật khẩu thất bại");
    } finally {
      setPwLoading(false);
    }
  };

  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppLayout user={appUser}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">Quản lý tài khoản và tùy chọn</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-56 shrink-0">
            <Card padding="sm">
              <div className="flex flex-col items-center gap-3 p-4 mb-2">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#ff7a18] to-amber-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {initials}
                  </div>
                  <button className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
                    <Camera className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-sm">{profile.name}</p>
                  <p className="text-xs text-gray-400">{profile.email}</p>
                </div>
              </div>
              <div className="space-y-0.5">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      activeSection === s.id ? "bg-orange-50 text-[#ff7a18]" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <s.icon className={cn("h-4 w-4", activeSection === s.id ? "text-[#ff7a18]" : "text-gray-400")} />
                    {s.label}
                    <ChevronRight className={cn("h-3.5 w-3.5 ml-auto", activeSection === s.id ? "text-[#ff7a18]" : "text-gray-300")} />
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
              </div>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeSection === "profile" && (
              <Card>
                <h2 className="text-lg font-bold text-gray-900 mb-6">Hồ sơ cá nhân</h2>
                {profileError && (
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{profileError}</div>
                )}
                {profileMessage && (
                  <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{profileMessage}</div>
                )}
                <div className="space-y-5">
                  <Input
                    label="Họ và tên"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={profile.email}
                    disabled
                    placeholder="you@example.com"
                  />
                  <div className="flex items-center gap-3 pt-2">
                    <Button onClick={saveProfile} loading={profileLoading}>
                      {profileMessage ? "Đã lưu!" : "Lưu thay đổi"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeSection === "password" && (
              <Card>
                <h2 className="text-lg font-bold text-gray-900 mb-6">Đổi mật khẩu</h2>
                {pwError && (
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{pwError}</div>
                )}
                {pwMessage && (
                  <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{pwMessage}</div>
                )}
                <div className="space-y-5">
                  <Input
                    label="Mật khẩu hiện tại"
                    type={showPass.current ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    placeholder="••••••••"
                    rightIcon={
                      <button type="button" onClick={() => setShowPass({ ...showPass, current: !showPass.current })}>
                        {showPass.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  <Input
                    label="Mật khẩu mới"
                    type={showPass.new ? "text" : "password"}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    placeholder="Tối thiểu 8 ký tự"
                    rightIcon={
                      <button type="button" onClick={() => setShowPass({ ...showPass, new: !showPass.new })}>
                        {showPass.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  <Input
                    label="Xác nhận mật khẩu mới"
                    type={showPass.confirm ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                    error={
                      passwords.confirm && passwords.new !== passwords.confirm
                        ? "Mật khẩu không khớp"
                        : undefined
                    }
                    rightIcon={
                      <button type="button" onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}>
                        {showPass.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  {passwords.new && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-500">Độ mạnh mật khẩu:</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => {
                          const strength =
                            passwords.new.length >= 8
                              ? (passwords.new.match(/[A-Z]/) ? 2 : 1) +
                                (passwords.new.match(/[0-9]/) ? 1 : 0) +
                                (passwords.new.match(/[^A-Za-z0-9]/) ? 1 : 0)
                              : 0;
                          return (
                            <div
                              key={level}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition-all",
                                level <= strength
                                  ? strength <= 1 ? "bg-red-400" : strength <= 2 ? "bg-yellow-400" : strength <= 3 ? "bg-blue-400" : "bg-green-500"
                                  : "bg-gray-200"
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <Button
                      onClick={savePassword}
                      loading={pwLoading}
                      disabled={!passwords.current || !passwords.new || passwords.new !== passwords.confirm}
                    >
                      Đổi mật khẩu
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeSection === "notifications" && (
              <Card>
                <h2 className="text-lg font-bold text-gray-900 mb-6">Cài đặt thông báo</h2>
                <div className="space-y-1">
                  {[
                    { key: "email", label: "Thông báo qua email", desc: "Nhận email khi file xử lý xong" },
                    { key: "browser", label: "Thông báo trình duyệt", desc: "Hiển thị popup thông báo" },
                    { key: "marketing", label: "Email marketing", desc: "Nhận tin về tính năng mới, ưu đãi" },
                    { key: "weekly", label: "Báo cáo hàng tuần", desc: "Tổng hợp thống kê sử dụng" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle
                        checked={notifications[item.key as keyof typeof notifications]}
                        onChange={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100 mt-4">
                  <Button>Lưu cài đặt</Button>
                </div>
              </Card>
            )}

            {activeSection === "security" && (
              <div className="space-y-4">
                <Card>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Bảo mật tài khoản</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Xác thực 2 bước (2FA)</p>
                        <p className="text-xs text-gray-400 mt-0.5">Bảo vệ tài khoản bằng mã OTP</p>
                      </div>
                      <Button variant="secondary" size="sm">Bật 2FA</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Phiên đăng nhập</p>
                        <p className="text-xs text-gray-400 mt-0.5">1 thiết bị đang hoạt động</p>
                      </div>
                      <Button variant="secondary" size="sm">Xem</Button>
                    </div>
                  </div>
                </Card>

                <Card className="border-red-100">
                  <h2 className="text-base font-bold text-red-600 mb-1">Vùng nguy hiểm</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Hành động không thể hoàn tác. Hãy cân nhắc kỹ trước khi thực hiện.
                  </p>
                  <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className="h-4 w-4" /> Xóa tài khoản
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Đăng xuất"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Hủy</Button>
            <Button onClick={() => logout()}>Đăng xuất</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Bạn có chắc muốn đăng xuất khỏi tài khoản không?</p>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xóa tài khoản"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
            <Button variant="danger">Xóa vĩnh viễn</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Tất cả dữ liệu, lịch sử file và cài đặt của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </p>
          <Input label="Nhập email để xác nhận" type="email" placeholder={profile.email} />
        </div>
      </Modal>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
