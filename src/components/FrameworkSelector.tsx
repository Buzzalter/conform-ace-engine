import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, BookOpen, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RulebookDocument } from "@/lib/api";

interface FrameworkSelectorProps {
  documents: RulebookDocument[];
  activeGraphIds: string[];
  onToggle: (id: string) => void;
}

export function FrameworkSelector({ documents, activeGraphIds, onToggle }: FrameworkSelectorProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, RulebookDocument[]>();
    for (const doc of documents) {
      const bank = doc.bank || "Uncategorized";
      if (!map.has(bank)) map.set(bank, []);
      map.get(bank)!.push(doc);
    }
    return map;
  }, [documents]);

  const toggleBank = (bankDocs: RulebookDocument[]) => {
    const ids = bankDocs.map((d) => d.id);
    const allSelected = ids.every((id) => activeGraphIds.includes(id));
    if (allSelected) {
      ids.forEach((id) => onToggle(id));
    } else {
      ids.filter((id) => !activeGraphIds.includes(id)).forEach((id) => onToggle(id));
    }
  };

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
          <DialogTitle className="text-foreground">Select Knowledge Banks to Audit Against</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 mt-2 pr-3">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground text-sm">
                <BookOpen className="h-8 w-8 mb-2 opacity-40" />
                <p>No completed rulebooks available. Upload one first.</p>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([bank, bankDocs]) => {
                const allSelected = bankDocs.every((d) => activeGraphIds.includes(d.id));
                const someSelected = bankDocs.some((d) => activeGraphIds.includes(d.id));

                return (
                  <div key={bank} className="space-y-2">
                    {/* Bank-level toggle */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <Checkbox
                        checked={allSelected}
                        // @ts-ignore – indeterminate is valid on the underlying element
                        data-state={someSelected && !allSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                        onCheckedChange={() => toggleBank(bankDocs)}
                      />
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{bank}</span>
                        <span className="text-xs text-muted-foreground">
                          ({bankDocs.length} doc{bankDocs.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </label>

                    {/* Individual docs */}
                    <div className="ml-7 space-y-1.5">
                      {bankDocs.map((doc) => (
                        <label
                          key={doc.id}
                          className="flex items-center gap-3 rounded-lg border border-border/40 p-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
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
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
