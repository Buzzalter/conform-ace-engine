import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, BookOpen } from "lucide-react";
import type { RulebookDocument } from "@/lib/api";

interface FrameworkSelectorProps {
  documents: RulebookDocument[];
  activeGraphIds: string[];
  onToggle: (id: string) => void;
}

export function FrameworkSelector({ documents, activeGraphIds, onToggle }: FrameworkSelectorProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-border/50">
          <Filter className="h-4 w-4" />
          Select Frameworks
          {activeGraphIds.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/20 text-primary text-xs px-2 py-0.5 font-medium">
              {activeGraphIds.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-foreground">Select Rulebooks to Audit Against</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2 max-h-[50vh] overflow-y-auto">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground text-sm">
              <BookOpen className="h-8 w-8 mb-2 opacity-40" />
              <p>No rulebooks available. Upload one first.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <label
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border border-border/40 p-3 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  checked={activeGraphIds.includes(doc.id)}
                  onCheckedChange={() => onToggle(doc.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
