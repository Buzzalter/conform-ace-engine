import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence } from "framer-motion";
import { BookOpen, Shield, Loader2, RotateCcw, ChevronDown, AlertCircle } from "lucide-react";
import { FileDropzone } from "@/components/FileDropzone";
import { RulebookCard } from "@/components/RulebookCard";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import { ConformanceSuccess } from "@/components/ConformanceSuccess";
import { ViolationCard } from "@/components/ViolationCard";
import { FrameworkSelector } from "@/components/FrameworkSelector";
import { BankCombobox } from "@/components/BankCombobox";
import { ChatDrawer } from "@/components/ChatDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  fetchDocuments,
  fetchBanks,
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
  const [selectedBank, setSelectedBank] = useState("");
  const [auditState, setAuditState] = useState<AuditState>("idle");
  const [violations, setViolations] = useState<Violation[]>([]);
  const [jobsOpen, setJobsOpen] = useState(true);

  const { data: docs, isLoading } = useQuery({
    queryKey: ["rulebooks"],
    queryFn: fetchDocuments,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.some((d) => d.status === "processing")) return 3000;
      return false;
    },
  });

  const { data: banks = [] } = useQuery({
    queryKey: ["banks"],
    queryFn: fetchBanks,
  });

  const processingDocs = docs?.filter((d) => d.status === "processing") ?? [];
  const completedDocs = docs?.filter((d) => d.status === "completed") ?? [];
  const failedDocs = docs?.filter((d) => d.status === "failed") ?? [];

  const deleteMutation = useMutation({
    mutationFn: deleteRulebook,
    onSuccess: (_d, deletedId) => {
      qc.invalidateQueries({ queryKey: ["rulebooks"] });
      qc.invalidateQueries({ queryKey: ["banks"] });
      // No need to filter activeGraphIds by doc ID since we store bank names
      toast({ title: "Rulebook removed", description: "Document deleted from knowledge base." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete rulebook.", variant: "destructive" });
    },
  });

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      const bank = selectedBank.trim() || file.name;
      try {
        await uploadRulebook(file, [bank]);
        qc.invalidateQueries({ queryKey: ["rulebooks"] });
        qc.invalidateQueries({ queryKey: ["banks"] });
        setSelectedBank("");
        toast({ title: "Rulebook ingested", description: `${file.name} added to "${bank}".` });
      } catch {
        toast({ title: "Upload failed", description: "Could not ingest the rulebook.", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    },
    [qc, selectedBank]
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
            {/* Active Ingestion Jobs */}
            {processingDocs.length > 0 && (
              <Collapsible open={jobsOpen} onOpenChange={setJobsOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Active Ingestions ({processingDocs.length})
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${jobsOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {processingDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 rounded-lg border border-border/40 bg-secondary/50 px-4 py-3"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                          {doc.bank && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                              {doc.bank}
                            </span>
                          )}
                        </div>
                        <Progress value={doc.progress} className="h-2" />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{doc.progress}%</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Failed docs warning */}
            {failedDocs.length > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">{failedDocs.length} document{failedDocs.length !== 1 ? "s" : ""} failed to process</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {failedDocs.map((d) => d.name).join(", ")}
                  </p>
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                {docs ? `${completedDocs.length} active document${completedDocs.length !== 1 ? "s" : ""}` : "Loading…"}
                {processingDocs.length > 0 && ` · ${processingDocs.length} processing`}
              </p>
            </div>

            {uploading ? (
              <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-sm text-primary font-medium">Ingesting into Knowledge Graph…</span>
              </div>
            ) : (
              <div className="space-y-3">
                <BankCombobox banks={banks} value={selectedBank} onChange={setSelectedBank} />
                <FileDropzone
                  onFileDrop={handleUpload}
                  label="Upload a conformance rulebook"
                  sublabel="PDF, DOCX, or TXT — drag & drop or click to browse"
                  compact
                />
              </div>
            )}

            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))
              ) : completedDocs.length > 0 ? (
                <AnimatePresence>
                  {completedDocs.map((doc) => (
                    <RulebookCard key={doc.id} doc={doc} onDelete={(id) => deleteMutation.mutate(id)} />
                  ))}
                </AnimatePresence>
              ) : (
                !processingDocs.length && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">No rulebooks uploaded yet</p>
                  </div>
                )
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Conformance Auditor */}
          <TabsContent value="auditor" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <FrameworkSelector
                documents={completedDocs}
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
