import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/FileDropzone";
import { BankCombobox } from "@/components/BankCombobox";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_LEVELS = [
  { value: 4, label: "Priority 4 — Statutory / National Law", sublabel: "Highest" },
  { value: 3, label: "Priority 3 — Organisational Policy / Regulation", sublabel: "" },
  { value: 2, label: "Priority 2 — Departmental / Operational Order", sublabel: "" },
  { value: 1, label: "Priority 1 — Local Guidance / Best Practice", sublabel: "Lowest" },
];

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banks: string[];
  onSubmit: (file: File, bankName: string, priorityLevel: number) => void;
  onDeleteBank?: (bankName: string) => void;
  uploading?: boolean;
}

export function UploadModal({ open, onOpenChange, banks, onSubmit, onDeleteBank, uploading }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState("");
  const [priority, setPriority] = useState<number | null>(null);

  const canSubmit = !!file && !!selectedBank.trim() && priority !== null && !uploading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(file!, selectedBank.trim(), priority!);
    // Reset on next open
    setFile(null);
    setSelectedBank("");
    setPriority(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setFile(null);
      setSelectedBank("");
      setPriority(null);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Upload className="h-5 w-5" />
            Upload New Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* File Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Document File</Label>
            {file ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                <button
                  onClick={() => setFile(null)}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <FileDropzone
                onFileDrop={setFile}
                label="Drop a document here"
                sublabel="PDF, DOCX, or TXT"
                compact
              />
            )}
          </div>

          {/* Knowledge Bank Assignment */}
          <div className="space-y-2">
            <BankCombobox
              banks={banks}
              value={selectedBank}
              onChange={setSelectedBank}
              onDeleteBank={onDeleteBank}
            />
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Document Priority Level</Label>
            <div className="grid gap-2">
              {PRIORITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setPriority(level.value)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all text-sm",
                    priority === level.value
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:bg-secondary"
                  )}
                >
                  <span className={cn("font-medium", priority === level.value && "text-foreground")}>
                    {level.label}
                  </span>
                  {level.sublabel && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      priority === level.value
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {level.sublabel}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {uploading ? "Ingesting…" : "Ingest Document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
