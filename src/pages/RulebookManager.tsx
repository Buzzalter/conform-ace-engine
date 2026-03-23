import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { BookOpen, Loader2 } from "lucide-react";
import { FileDropzone } from "@/components/FileDropzone";
import { RulebookCard } from "@/components/RulebookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDocuments, uploadRulebook, deleteRulebook } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function RulebookManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: docs, isLoading } = useQuery({
    queryKey: ["rulebooks"],
    queryFn: fetchDocuments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRulebook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rulebooks"] });
      toast({ title: "Rulebook removed", description: "Document deleted from knowledge base." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete rulebook.", variant: "destructive" });
    },
  });

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        await uploadRulebook(file);
        queryClient.invalidateQueries({ queryKey: ["rulebooks"] });
        toast({ title: "Rulebook ingested", description: `${file.name} added to the knowledge graph.` });
      } catch {
        toast({ title: "Upload failed", description: "Could not ingest the rulebook.", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    },
    [queryClient]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Rulebook Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {docs ? `${docs.length} active document${docs.length !== 1 ? "s" : ""}` : "Loading…"}
        </p>
      </div>

      {uploading ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="text-sm text-primary font-medium">Ingesting into Knowledge Graph…</span>
        </div>
      ) : (
        <FileDropzone
          onFileDrop={handleUpload}
          label="Upload a conformance rulebook"
          sublabel="PDF, DOCX, or TXT — drag & drop or click to browse"
          compact
        />
      )}

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))
        ) : docs && docs.length > 0 ? (
          <AnimatePresence>
            {docs.map((doc) => (
              <RulebookCard key={doc.id} doc={doc} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No rulebooks uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
