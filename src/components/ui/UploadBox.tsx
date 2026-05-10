import { useCallback, useState, useRef, useEffect } from "react";
import { UploadCloud, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadBoxProps {
  accept?: string;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  maxSize?: number; // MB
  label?: string;
  description?: string;
}

export default function UploadBox({
  accept,
  multiple = false,
  onFilesChange,
  maxSize = 10,
  label = "Kéo & thả file vào đây",
  description,
}: UploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tạo / huỷ object URL khi danh sách file thay đổi
  useEffect(() => {
    const urls = files.map((f) =>
      f.type.startsWith("image/") ? URL.createObjectURL(f) : null
    );
    setPreviews(urls);
    return () => {
      urls.forEach((u) => { if (u) URL.revokeObjectURL(u); });
    };
  }, [files]);

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const valid = Array.from(incoming).filter(
        (f) => f.size <= maxSize * 1024 * 1024
      );
      const updated = multiple ? [...files, ...valid] : valid;
      setFiles(updated);
      onFilesChange?.(updated);
    },
    [files, maxSize, multiple, onFilesChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-[#ff7a18] bg-orange-50"
            : "border-gray-200 hover:border-[#ff7a18] hover:bg-orange-50/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
              isDragging ? "bg-[#ff7a18]/20" : "bg-gray-100"
            )}
          >
            <UploadCloud
              className={cn(
                "h-7 w-7 transition-colors",
                isDragging ? "text-[#ff7a18]" : "text-gray-400"
              )}
            />
          </div>
          <div>
            <p className="font-semibold text-gray-700">{label}</p>
            <p className="text-sm text-gray-400 mt-1">
              {description || `Hoặc click để chọn file (tối đa ${maxSize}MB)`}
            </p>
            {accept && (
              <p className="text-xs text-gray-400 mt-1">
                Định dạng: {accept.replace(/\./g, "").toUpperCase()}
              </p>
            )}
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl"
            >
              {/* Thumbnail nếu là ảnh, icon file nếu không phải */}
              {previews[i] ? (
                <img
                  src={previews[i]!}
                  alt={file.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                />
              ) : (
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <File className="h-5 w-5 text-[#ff7a18]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
