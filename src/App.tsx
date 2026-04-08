import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence } from "framer-motion";
import { BookOpen, Shield, Loader2, RotateCcw } from "lucide-react";
import { FileDropzone } from "@/components/FileDropzone";
import { RulebookCard } from "@/components/RulebookCard";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import { ConformanceSuccess } from "@/components/ConformanceSuccess";
import { ViolationCard } from "@/components/ViolationCard";
import { FrameworkSelector } from "@/components/FrameworkSelector";
import { ChatDrawer } from "@/components/ChatDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  fetchDocuments,
  uploadRulebook,
  deleteRulebook,
  checkSubmission,
  type Violation,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

type AuditState = "idle" | "loading" | "results";

function Dashboard() {
  const qc = useQueryClient();
  const [activeGraphIds, setActiveGraphIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [auditState, setAuditState] = useState<AuditState>("idle");
  const [violations, setViolations] = useState<Violation[]>([]);

  const { data: docs, isLoading } = useQuery({
    queryKey: ["rulebooks"],
    queryFn: fetchDocuments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRulebook,
    onSuccess: (_d, deletedId) => {
      qc.invalidateQueries({ queryKey: ["rulebooks"] });
      setActiveGraphIds((prev) => prev.filter((id) => id !== deletedId));
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
        await uploadRulebook(file, [file.name]);
        qc.invalidateQueries({ queryKey: ["rulebooks"] });
        toast({ title: "Rulebook ingested", description: `${file.name} added to the knowledge graph.` });
      } catch {
        toast({ title: "Upload failed", description: "Could not ingest the rulebook.", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    },
    [qc]
  );

  const handleSubmit = useCallback(
    async (file: File) => {
      if (activeGraphIds.length === 0) {
        toast({
          title: "No frameworks selected",
          description: "Please select at least one rulebook to audit against.",
          variant: "destructive",
        });
        return;
      }
      setAuditState("loading");
      try {
        const result = await checkSubmission(file, activeGraphIds);
        setViolations(result);
        setAuditState("results");
      } catch {
        toast({ title: "Analysis failed", description: "Could not process the submission.", variant: "destructive" });
        setAuditState("idle");
      }
    },
    [activeGraphIds]
  );

  const resetAudit = () => {
    setAuditState("idle");
    setViolations([]);
  };

  const toggleFramework = (id: string) => {
    setActiveGraphIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Knowledge Engine
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Intelligent document analysis powered by your knowledge banks
          </p>
        </div>

        <Tabs defaultValue="knowledge" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass">
            <TabsTrigger value="knowledge" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Knowledge Bank
            </TabsTrigger>
            <TabsTrigger value="auditor" className="gap-2">
              <Shield className="h-4 w-4" />
              Document Auditor
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Knowledge Base */}
          <TabsContent value="knowledge" className="mt-6 space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
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
          </TabsContent>

          {/* Tab 2: Conformance Auditor */}
          <TabsContent value="auditor" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <FrameworkSelector
                documents={docs ?? []}
                activeGraphIds={activeGraphIds}
                onToggle={toggleFramework}
              />
              {auditState === "results" && (
                <Button variant="outline" size="sm" onClick={resetAudit} className="gap-2 border-border/50">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Check Another
                </Button>
              )}
            </div>

            {auditState === "idle" && (
              <FileDropzone
                onFileDrop={handleSubmit}
                label="Upload submission document"
                sublabel="Drop your document here for AI conformance analysis"
              />
            )}

            {auditState === "loading" && <AnalysisLoader />}

            {auditState === "results" && (
              <>
                {violations.length === 0 ? (
                  <ConformanceSuccess />
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Found <span className="text-destructive font-semibold">{violations.length}</span> violation
                      {violations.length !== 1 ? "s" : ""}
                    </p>
                    {violations.map((v, i) => (
                      <ViolationCard key={i} violation={v} index={i} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ChatDrawer activeGraphIds={activeGraphIds} />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Dashboard />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
