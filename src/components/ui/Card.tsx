import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({
  children,
  className,
  padding = "md",
  onClick,
  hoverable = false,
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl border border-gray-100",
        "shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.06)]",
        paddings[padding],
        hoverable &&
          "cursor-pointer hover:shadow-[0_4px_24px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
