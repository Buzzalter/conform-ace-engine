import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Upload,
  ShieldAlert,
  Flame,
  FileText,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FileDropzone } from "@/components/FileDropzone";
import {
  fetchRedactionDocuments,
  analyzeRedactionDocument,
  executeRedaction,
  deleteRedactionDocument,
  redownloadRedaction,
  type RedactionDocument,
  type RedactionEntity,
} from "@/lib/api";

export default function RedactionEngine() {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [criteria, setCriteria] = useState("");
  const [reviewDoc, setReviewDoc] = useState<RedactionDocument | null>(null);
  const [checkedRequired, setCheckedRequired] = useState<Record<number, boolean>>({});
  const [checkedSuggested, setCheckedSuggested] = useState<Record<number, boolean>>({});
  const [burning, setBurning] = useState(false);

  // ── Fetch documents with polling ──
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["redaction-documents"],
    queryFn: fetchRedactionDocuments,
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (docs?.some((d) => d.status === "processing")) return 2000;
      return false;
    },
  });

  // ── Upload & Analyze ──
  const analyzeMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("No file selected");
      return analyzeRedactionDocument(file, criteria);
    },
    onSuccess: () => {
      toast({ title: "Document submitted", description: "Analysis has begun." });
      setFile(null);
      setCriteria("");
      qc.invalidateQueries({ queryKey: ["redaction-documents"] });
    },
    onError: () => {
      toast({ title: "Upload failed", description: "Error while processing", variant: "destructive" });
    },
  });

  // ── Delete document ──
  const deleteMutation = useMutation({
    mutationFn: (docId: string) => deleteRedactionDocument(docId),
    onSuccess: () => {
      toast({ title: "Document removed" });
      qc.invalidateQueries({ queryKey: ["redaction-documents"] });
    },
    onError: () => {
      toast({ title: "Failed to remove document", variant: "destructive" });
    },
  });

  // ── Re-download completed document ──
  const handleRedownload = useCallback(async (doc: RedactionDocument) => {
    try {
      const blob = await redownloadRedaction(doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `REDACTED_${doc.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Download started" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  }, []);

  // ── Open review modal ──
  const openReview = useCallback((doc: RedactionDocument) => {
    setReviewDoc(doc);
    const reqMap: Record<number, boolean> = {};
    doc.analysis?.required?.forEach((_, i) => { reqMap[i] = true; });
    setCheckedRequired(reqMap);
    setCheckedSuggested({});
  }, []);

  // ── Burn redactions ──
  const handleBurn = useCallback(async () => {
    if (!reviewDoc?.analysis) return;
    setBurning(true);
    try {
      const entities: string[] = [];
      reviewDoc.analysis.required.forEach((e, i) => {
        if (checkedRequired[i]) entities.push(e.entity);
      });
      reviewDoc.analysis.suggested.forEach((e, i) => {
        if (checkedSuggested[i]) entities.push(e.entity);
      });

      const blob = await executeRedaction(reviewDoc.id, entities);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `REDACTED_${reviewDoc.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: "Redaction complete", description: "Download started." });
      setReviewDoc(null);
      qc.invalidateQueries({ queryKey: ["redaction-documents"] });
    } catch {
      toast({ title: "Redaction failed", description: "Error while processing", variant: "destructive" });
    } finally {
      setBurning(false);
    }
  }, [reviewDoc, checkedRequired, checkedSuggested, qc]);

  const hasProcessing = documents.some((d) => d.status === "processing");

  // Helper: get all redacted entities from a completed doc's analysis
  const getRedactedEntities = (doc: RedactionDocument): string[] => {
    if (!doc.analysis) return [];
    return [
      ...doc.analysis.required.map((e) => e.entity),
      ...doc.analysis.suggested.map((e) => e.entity),
    ];
  };

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-7 w-7 text-destructive" />
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            OSINT Redaction Engine
          </h1>
          <p className="text-sm text-muted-foreground">
            Automated entity detection &amp; classified document redaction
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <p className="text-sm text-destructive font-medium">
          SENSITIVE DATA ZONE — All documents processed here may contain classified or personally identifiable information. Handle with care.
        </p>
      </div>

      {/* Section 1: Ingestion & Rules */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Ingestion &amp; Rules
        </h2>

        <FileDropzone
          onFileDrop={(f) => setFile(f)}
          label={file ? file.name : "Drop a PDF here or click to select"}
          sublabel="Accepts PDF files"
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Redaction Directives (What should be redacted?)
          </label>
          <Textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            placeholder='Redact all email addresses, phone numbers, and any mention of Project Zeus.'
            className="min-h-[90px] bg-secondary/50"
          />
        </div>

        <Button
          onClick={() => analyzeMutation.mutate()}
          disabled={!file || analyzeMutation.isPending}
          className="gap-2"
        >
          {analyzeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Analyze Document
        </Button>
      </section>

      {/* Section 2: Document Tracking */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Document Tracking
          {hasProcessing && (
            <Badge variant="outline" className="ml-auto text-xs animate-pulse border-primary text-primary">
              LIVE
            </Badge>
          )}
        </h2>

        {docsLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No documents submitted yet. Upload a PDF above to get started.
          </p>
        ) : (
          <TooltipProvider>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Status / Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>
                        {doc.status === "processing" ? (
                          <div className="space-y-1 max-w-xs">
                            <Progress value={doc.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">{doc.message || "Processing…"}</p>
                          </div>
                        ) : doc.status === "awaiting_review" ? (
                          <Badge variant="outline" className="border-primary/40 text-primary">
                            Awaiting Review
                          </Badge>
                        ) : doc.status === "completed" ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-accent text-accent-foreground">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                            </Badge>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="text-muted-foreground hover:text-foreground transition-colors">
                                  <Info className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="font-semibold text-xs mb-1">Redacted Entities:</p>
                                {getRedactedEntities(doc).length > 0 ? (
                                  <ul className="text-xs space-y-0.5">
                                    {getRedactedEntities(doc).map((e, i) => (
                                      <li key={i} className="text-muted-foreground">• {e}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic">No entity data available</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" /> Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.status === "awaiting_review" && (
                            <Button size="sm" variant="default" className="gap-1.5 font-semibold" onClick={() => openReview(doc)}>
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Review &amp; Redact
                            </Button>
                          )}
                          {doc.status === "completed" && (
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleRedownload(doc)}>
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </Button>
                          )}
                          {(doc.status === "completed" || doc.status === "failed") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteMutation.mutate(doc.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Clear
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        )}
      </section>

      {/* Section 3: Review Modal */}
      <Dialog open={!!reviewDoc} onOpenChange={(open) => { if (!open) setReviewDoc(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              OSINT Review — {reviewDoc?.name}
            </DialogTitle>
            <DialogDescription>
              Select the entities to redact. Required items are pre-checked. OSINT suggestions require manual approval.
            </DialogDescription>
          </DialogHeader>

          {reviewDoc?.analysis && (
            <div className="space-y-6 mt-2">
              {/* Part A: Required */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Required Redactions
                </h3>
                <div className="space-y-2">
                  {reviewDoc.analysis.required.map((ent, i) => (
                    <label
                      key={`req-${i}`}
                      className="flex items-start gap-3 rounded-md border border-border bg-secondary/30 p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                    >
                      <Checkbox
                        checked={!!checkedRequired[i]}
                        onCheckedChange={(v) => setCheckedRequired((prev) => ({ ...prev, [i]: !!v }))}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-sm font-medium text-foreground">{ent.entity}</span>
                        <p className="text-xs text-muted-foreground">{ent.reason}</p>
                      </div>
                    </label>
                  ))}
                  {reviewDoc.analysis.required.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No required redactions found.</p>
                  )}
                </div>
              </div>

              {/* Part B: Suggested (OSINT) */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Intelligence Risk Suggestions (OSINT)
                </h3>
                <div className="space-y-2">
                  {reviewDoc.analysis.suggested.map((ent, i) => (
                    <label
                      key={`sug-${i}`}
                      className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 cursor-pointer hover:bg-destructive/10 transition-colors"
                    >
                      <Checkbox
                        checked={!!checkedSuggested[i]}
                        onCheckedChange={(v) => setCheckedSuggested((prev) => ({ ...prev, [i]: !!v }))}
                        className="mt-0.5"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{ent.entity}</span>
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            WEB INTEL
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{ent.reason}</p>
                      </div>
                    </label>
                  ))}
                  {reviewDoc.analysis.suggested.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No OSINT suggestions returned.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setReviewDoc(null)} disabled={burning}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2 font-semibold"
              onClick={handleBurn}
              disabled={burning}
            >
              {burning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
              Burn Redactions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
