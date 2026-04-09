import { Trash2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { RulebookDocument } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: { label: "Low", className: "bg-muted text-muted-foreground border-muted-foreground/20" },
  2: { label: "Medium", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  3: { label: "High", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  4: { label: "Top Priority", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

interface RulebookCardProps {
  doc: RulebookDocument;
  onDelete: (id: string) => void;
}

export function RulebookCard({ doc, onDelete }: RulebookCardProps) {
  const priority = doc.priority_level ? priorityConfig[doc.priority_level] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
            {priority && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-semibold shrink-0 ${priority.className}`}>
                {priority.label}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(doc.uploaded_at), "MMM d, yyyy · h:mm a")}
          </p>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 text-destructive/70" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Rulebook</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{doc.name}" from the knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(doc.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
