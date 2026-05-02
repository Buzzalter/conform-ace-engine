import { useState } from "react";
import { ChevronDown, History, Trash2, Download, Eye, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { HistoryItem } from "@/lib/insights-api";

interface HistoryPaneProps {
  title: string;
  description?: string;
  items: HistoryItem[];
  loading?: boolean;
  emptyHint?: string;
  showDownload?: boolean;
  showView?: boolean;
  onView?: (item: HistoryItem) => void;
  onDownload?: (item: HistoryItem) => void;
  onDelete?: (item: HistoryItem) => void;
  defaultOpen?: boolean;
  renderBadge?: (item: HistoryItem) => React.ReactNode;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export function HistoryPane({
  title,
  description,
  items,
  loading,
  emptyHint = "No history yet.",
  showDownload = false,
  showView = false,
  onView,
  onDownload,
  onDelete,
  defaultOpen = false,
  renderBadge,
}: HistoryPaneProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="glass border-border/60 overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <History className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-secondary/60">
                    {items.length}
                  </Badge>
                </div>
                {description && (
                  <p className="text-[11px] text-muted-foreground truncate">{description}</p>
                )}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                open && "rotate-180"
              )}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-1.5">
            {loading ? (
              <>
                <Skeleton className="h-12 rounded-md" />
                <Skeleton className="h-12 rounded-md" />
              </>
            ) : items.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                {emptyHint}
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 rounded-md border border-border/40 bg-secondary/30 hover:bg-secondary/60 transition-colors px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      {item.bank_name && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                          {item.bank_name}
                        </Badge>
                      )}
                      {renderBadge?.(item)}
                    </div>
                    {item.preview && (
                      <p className="text-[11px] text-muted-foreground truncate italic">
                        “{item.preview}”
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(item.created_at)}
                      {item.message_count !== undefined && ` · ${item.message_count} msgs`}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                    {showView && onView && (
                      <button
                        onClick={() => onView(item)}
                        className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {showDownload && onDownload && (
                      <button
                        onClick={() => onDownload(item)}
                        className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove “{item.title}” from history. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(item)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Read-only chat conversation viewer (used inside a Dialog)
export function ChatConversationView({
  messages,
  loading,
}: {
  messages: { role: string; content: string }[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }
  if (!messages || messages.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-6">No messages.</p>;
  }
  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
      {messages.map((m, i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            m.role === "user"
              ? "bg-primary/10 border border-primary/20 ml-6"
              : "bg-secondary/60 border border-border/40 mr-6"
          )}
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            {m.role}
          </div>
          <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {m.content}
          </div>
        </div>
      ))}
    </div>
  );
}
