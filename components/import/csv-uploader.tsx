"use client";

import { useCallback, useState, useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface CsvUploaderProps {
  onFileReady: (file: File) => void;
  onContentReady: (content: string, filename: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function CsvUploader({
  onFileReady,
  onContentReady,
  disabled = false,
}: CsvUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Invalid file type", {
          description: "Only .csv files are accepted.",
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large", {
          description: "Maximum file size is 10 MB.",
        });
        return;
      }

      onFileReady(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          let content = text;
          if (content.charCodeAt(0) === 0xfeff) {
            content = content.slice(1);
          }
          onContentReady(content, file.name);
        } else {
          toast.error("Could not read file", {
            description: "The file appears to be empty or unreadable.",
          });
        }
      };
      reader.onerror = () => {
        toast.error("Could not read file", {
          description: "An error occurred while reading the file.",
        });
      };
      reader.readAsText(file, "UTF-8");
    },
    [onFileReady, onContentReady]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [disabled, processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [disabled, processFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
        disabled
          ? "border-border opacity-50 cursor-not-allowed"
          : isDragOver
            ? "border-accent-primary bg-accent-primary/5"
            : "border-border hover:border-text-muted"
      }`}
    >
      <Upload className="mx-auto h-10 w-10 text-text-muted mb-3" />
      <p className="text-sm text-text-primary font-medium">
        Drag and drop your CSV file here
      </p>
      <p className="text-xs text-text-muted mt-1">
        or click to browse — .csv files only, max 10 MB
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
