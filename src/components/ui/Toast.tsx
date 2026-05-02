import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

const styles = {
  success: "border-green-200 bg-green-50",
  error: "border-red-200 bg-red-50",
  warning: "border-yellow-200 bg-yellow-50",
  info: "border-blue-200 bg-blue-50",
};

function Toast({ id, message, type = "info", duration = 3500, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-soft text-sm font-medium text-gray-800",
        "transition-all duration-300",
        styles[type],
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Simple global toast store
export type ToastItem = { id: string; message: string; type: ToastType };
type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export const toast = {
  show(message: string, type: ToastType = "info") {
    const id = Math.random().toString(36).slice(2);
    toasts = [...toasts, { id, message, type }];
    notify();
  },
  success(message: string) { this.show(message, "success"); },
  error(message: string) { this.show(message, "error"); },
  warning(message: string) { this.show(message, "warning"); },
  info(message: string) { this.show(message, "info"); },
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((l) => l !== setItems);
    };
  }, []);

  const remove = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {items.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <Toast {...item} onClose={remove} />
        </div>
      ))}
    </div>
  );
}
