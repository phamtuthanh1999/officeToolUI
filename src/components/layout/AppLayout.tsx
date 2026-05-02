import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { ToastContainer } from "@/components/ui/Toast";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: { name: string; email: string; avatar?: string };
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}
