import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";

interface FileDropzoneProps {
  onFileDrop: (file: File) => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function FileDropzone({
  onFileDrop,
  label = "Drop a file here",
  sublabel = "or click to browse",
  disabled = false,
  compact = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFileDrop(file);
    },
    [onFileDrop, disabled]
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileDrop(file);
    };
    input.click();
  }, [onFileDrop, disabled]);

  return (
    <motion.div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-xl cursor-pointer transition-all duration-300 ${
        compact ? "p-6" : "p-12"
      } ${isDragging ? "gradient-border" : "border-2 border-dashed border-border"} ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/40"
      }`}
      whileHover={disabled ? {} : { scale: 1.005 }}
      animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
    >
      <div className="flex flex-col items-center justify-center text-center gap-3">
        <div
          className={`rounded-full p-4 transition-colors ${
            isDragging ? "bg-primary/20" : "bg-muted"
          }`}
        >
          <Upload
            className={`h-6 w-6 transition-colors ${
              isDragging ? "text-primary" : "text-muted-foreground"
            }`}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
        </div>
      </div>
    </motion.div>
  );
}
