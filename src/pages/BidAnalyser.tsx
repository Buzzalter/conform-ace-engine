import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gavel,
  FileText,
  Trash2,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Trophy,
  DollarSign,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Play,
  HelpCircle,
  MessageSquare,
  Shield,
  Lightbulb,
  Skull,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { FileDropzone } from "@/components/FileDropzone";
import {
  uploadRFQ,
  getRFQs,
  deleteRFQ,
  uploadBid,
  getBids,
  deleteBid,
  runEvaluation,
  runDraftEvaluation,
  type RFQDocument,
  type BidDocument,
  type EvaluationResult,
  type DraftEvaluation,
} from "@/lib/api";

export default function BidAnalyser() {
  const qc = useQueryClient();
  const [viewRFQ, setViewRFQ] = useState<RFQDocument | null>(null);
  const [selectedRFQId, setSelectedRFQId] = useState<string>("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // ── Red-Team state ──
  const [redTeamRFQId, setRedTeamRFQId] = useState<string>("");
  const [redTeamEvaluation, setRedTeamEvaluation] = useState<DraftEvaluation | null>(null);

  // ── RFQ Queries ──
  const { data: rfqs = [], isLoading: rfqsLoading } = useQuery({
    queryKey: ["bid-rfqs"],
    queryFn: getRFQs,
    refetchInterval: (q) =>
      q.state.data?.some((r) => r.status === "processing") ? 2000 : false,
  });

  const uploadRFQMutation = useMutation({
    mutationFn: (file: File) => uploadRFQ(file),
    onSuccess: () => {
      toast({ title: "RFQ uploaded", description: "Processing started." });
      qc.invalidateQueries({ queryKey: ["bid-rfqs"] });
    },
    onError: () => toast({ title: "Upload failed", variant: "destructive" }),
  });

  const deleteRFQMutation = useMutation({
    mutationFn: (id: string) => deleteRFQ(id),
    onSuccess: () => {
      toast({ title: "RFQ deleted" });
      qc.invalidateQueries({ queryKey: ["bid-rfqs"] });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  // ── Bid Queries ──
  const { data: bids = [], isLoading: bidsLoading } = useQuery({
    queryKey: ["bid-bids", selectedRFQId],
    queryFn: () => getBids(selectedRFQId),
    enabled: !!selectedRFQId,
    refetchInterval: (q) =>
      q.state.data?.some((b) => b.status === "processing") ? 2000 : false,
  });

  const uploadBidMutation = useMutation({
    mutationFn: (file: File) => uploadBid(selectedRFQId, file),
    onSuccess: () => {
      toast({ title: "Bid uploaded" });
      qc.invalidateQueries({ queryKey: ["bid-bids", selectedRFQId] });
    },
    onError: () => toast({ title: "Bid upload failed", variant: "destructive" }),
  });

  const deleteBidMutation = useMutation({
    mutationFn: (id: string) => deleteBid(id),
    onSuccess: () => {
      toast({ title: "Bid removed" });
      qc.invalidateQueries({ queryKey: ["bid-bids", selectedRFQId] });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const evaluateMutation = useMutation({
    mutationFn: () => runEvaluation(selectedRFQId),
    onSuccess: (data) => {
      setEvaluation(data.evaluation);
      toast({ title: "Analysis complete" });
    },
    onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
  });

  // ── Red-Team queries ──
  const { data: redTeamBids = [], isLoading: redTeamBidsLoading } = useQuery({
    queryKey: ["bid-bids", redTeamRFQId],
    queryFn: () => getBids(redTeamRFQId),
    enabled: !!redTeamRFQId,
    refetchInterval: (q) =>
      q.state.data?.some((b) => b.status === "processing") ? 2000 : false,
  });

  const uploadDraftBidMutation = useMutation({
    mutationFn: (file: File) => uploadBid(redTeamRFQId, file),
    onSuccess: () => {
      toast({ title: "Draft bid uploaded" });
      qc.invalidateQueries({ queryKey: ["bid-bids", redTeamRFQId] });
    },
    onError: () => toast({ title: "Upload failed", variant: "destructive" }),
  });

  const deleteDraftBidMutation = useMutation({
    mutationFn: (id: string) => deleteBid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bid-bids", redTeamRFQId] });
    },
  });

  const draftEvalMutation = useMutation({
    mutationFn: (bidId: string) => runDraftEvaluation(redTeamRFQId, bidId),
    onSuccess: (data) => {
      setRedTeamEvaluation(data.evaluation);
      toast({ title: "Red-Team critique complete" });
    },
    onError: () => toast({ title: "Critique failed", variant: "destructive" }),
  });

  const completedRFQs = useMemo(
    () => rfqs.filter((r) => r.status === "completed"),
    [rfqs]
  );

  const allBidsReady = useMemo(
    () => bids.length > 0 && bids.every((b) => b.status === "completed"),
    [bids]
  );

  const handleClearResults = useCallback(() => {
    setEvaluation(null);
  }, []);

  const handleClearRedTeam = useCallback(() => {
    setRedTeamEvaluation(null);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Gavel className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Bid Analyser</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered vendor evaluation and source selection
          </p>
        </div>
      </div>

      <Tabs defaultValue="rfqs" className="flex-1 flex flex-col">
        <TabsList className="self-start">
          <TabsTrigger value="rfqs">1. Problem Statements (RFQs)</TabsTrigger>
          <TabsTrigger value="bids" disabled={completedRFQs.length === 0}>
            2. Bid Evaluation
          </TabsTrigger>
          <TabsTrigger value="redteam" disabled={completedRFQs.length === 0}>
            3. Supplier Red-Team (Draft Review)
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: RFQs ── */}
        <TabsContent value="rfqs" className="space-y-6 mt-4">
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Upload Problem Statement / RFQ
            </h2>
            <FileDropzone
              onFileDrop={(f) => uploadRFQMutation.mutate(f)}
              label={uploadRFQMutation.isPending ? "Uploading…" : "Drop RFQ PDF here or click to browse"}
              sublabel="Accepts PDF files"
              disabled={uploadRFQMutation.isPending}
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Uploaded RFQs</h2>
            {rfqsLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : rfqs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No RFQs uploaded yet.
              </p>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Status / Progress</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfqs.map((rfq) => (
                      <TableRow key={rfq.id}>
                        <TableCell className="font-medium">{rfq.name}</TableCell>
                        <TableCell>
                          {rfq.status === "processing" ? (
                            <div className="space-y-1 max-w-xs">
                              <Progress value={rfq.progress} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                {rfq.message || "Processing…"}
                              </p>
                            </div>
                          ) : rfq.status === "completed" ? (
                            <Badge variant="outline" className="border-primary/40 text-primary">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" /> Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {rfq.status === "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => setViewRFQ(rfq)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Understanding
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteRFQMutation.mutate(rfq.id)}
                              disabled={deleteRFQMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </TabsContent>

        {/* ── Tab 2: Bid Evaluation ── */}
        <TabsContent value="bids" className="space-y-6 mt-4">
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Select RFQ</h2>
            <Select value={selectedRFQId} onValueChange={setSelectedRFQId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Choose a completed RFQ…" />
              </SelectTrigger>
              <SelectContent>
                {completedRFQs.map((rfq) => (
                  <SelectItem key={rfq.id} value={rfq.id}>
                    {rfq.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {selectedRFQId && (
            <>
              {!evaluation && (
              <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Upload Bids
                </h2>
                <FileDropzone
                  onFileDrop={(f) => uploadBidMutation.mutate(f)}
                  label={uploadBidMutation.isPending ? "Uploading…" : "Drop bid PDFs here or click to browse"}
                  sublabel="Upload one or more bid documents"
                  disabled={uploadBidMutation.isPending}
                />
              </section>
              )}

              {!evaluation && (
              <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Uploaded Bids</h2>
                {bidsLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : bids.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No bids uploaded for this RFQ yet.
                  </p>
                ) : (
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filename</TableHead>
                          <TableHead>Status / Progress</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bids.map((bid: BidDocument) => (
                          <TableRow key={bid.id}>
                            <TableCell className="font-medium">{bid.name}</TableCell>
                            <TableCell>
                              {bid.status === "processing" ? (
                                <div className="space-y-1 max-w-xs">
                                  <Progress value={bid.progress} className="h-2" />
                                  <p className="text-xs text-muted-foreground">
                                    {bid.message || "Processing…"}
                                  </p>
                                </div>
                              ) : bid.status === "completed" ? (
                                <Badge variant="outline" className="border-primary/40 text-primary">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" /> Failed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteBidMutation.mutate(bid.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={() => evaluateMutation.mutate()}
                    disabled={!allBidsReady || evaluateMutation.isPending}
                    className="gap-2"
                  >
                    {evaluateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Run Analysis &amp; Rank Bids
                  </Button>
                </div>
              </section>
              )}

              {evaluation && (
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={handleClearResults} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Start Again / Clear Results
                  </Button>
                </div>
              )}

              {/* ── Results ── */}
              {evaluation && (
                <section className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Trophy className="h-5 w-5 text-primary" />
                          Best Technical Solution
                        </CardTitle>
                        <CardDescription className="text-foreground font-semibold pt-1">
                          {evaluation.best_technical?.bid_name || "—"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {evaluation.best_technical?.reasoning || "No reasoning available."}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-success/40 bg-gradient-to-br from-success/10 to-success/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <DollarSign className="h-5 w-5 text-success" />
                          Best Value for Money
                        </CardTitle>
                        <CardDescription className="text-foreground font-semibold pt-1">
                          {evaluation.best_value?.bid_name || "—"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {evaluation.best_value?.reasoning || "No reasoning available."}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-accent/60 bg-gradient-to-br from-accent/20 to-accent/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Sparkles className="h-5 w-5 text-accent-foreground" />
                          Overall Recommendation
                        </CardTitle>
                        <CardDescription className="text-foreground font-semibold pt-1">
                          {evaluation.overall_recommendation?.bid_name || "—"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {evaluation.overall_recommendation?.reasoning || "No reasoning available."}
                        </p>
                        {evaluation.overall_recommendation?.risk_warnings &&
                          evaluation.overall_recommendation.risk_warnings.length > 0 && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2.5 space-y-1">
                              <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Risk Warnings
                              </p>
                              <ul className="text-xs text-destructive/90 space-y-0.5 pl-4 list-disc">
                                {evaluation.overall_recommendation.risk_warnings.map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  </div>

                  {evaluation.ranking && evaluation.ranking.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Ranked Bids</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {evaluation.ranking.map((r) => {
                          const hasDebrief =
                            (r.supplier_feedback && r.supplier_feedback.trim().length > 0) ||
                            (r.clarification_questions && r.clarification_questions.length > 0);
                          return (
                            <div
                              key={r.rank}
                              className="rounded-lg border border-border bg-secondary/30 p-5 space-y-4"
                            >
                              {/* Header */}
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold">
                                  {r.rank}
                                </div>
                                <p className="text-base font-semibold text-foreground flex-1 min-w-0 truncate">
                                  {r.bid_name}
                                </p>
                                {typeof r.technical_score_out_of_10 === "number" && (
                                  <Badge variant="outline" className="border-primary/40 text-primary gap-1">
                                    <Trophy className="h-3 w-3" />
                                    Technical {r.technical_score_out_of_10}/10
                                  </Badge>
                                )}
                                {typeof r.value_score_out_of_10 === "number" && (
                                  <Badge variant="outline" className="border-success/40 text-success gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Value {r.value_score_out_of_10}/10
                                  </Badge>
                                )}
                              </div>

                              {/* Executive Summary */}
                              {(r.proposed_solution_summary || r.summary) && (
                                <p className="text-sm text-foreground leading-relaxed">
                                  {r.proposed_solution_summary || r.summary}
                                </p>
                              )}

                              {r.solution_assessment && (
                                <div className="rounded-md border-l-2 border-primary/60 bg-primary/5 px-3 py-2.5 space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3" />
                                    AI Assessment
                                  </p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {r.solution_assessment}
                                  </p>
                                </div>
                              )}

                              {/* Pros & Cons */}
                              {((r.pros && r.pros.length > 0) || (r.cons && r.cons.length > 0)) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {r.pros && r.pros.length > 0 && (
                                    <div className="rounded-md border border-success/30 bg-success/5 p-3 space-y-2">
                                      <p className="text-xs font-semibold text-success flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Pros
                                      </p>
                                      <ul className="space-y-1.5">
                                        {r.pros.map((p, i) => (
                                          <li key={i} className="text-xs text-foreground/90 flex items-start gap-2 leading-relaxed">
                                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success" />
                                            <span>{p}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {r.cons && r.cons.length > 0 && (
                                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                                      <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                                        <XCircle className="h-3.5 w-3.5" />
                                        Cons
                                      </p>
                                      <ul className="space-y-1.5">
                                        {r.cons.map((c, i) => (
                                          <li key={i} className="text-xs text-foreground/90 flex items-start gap-2 leading-relaxed">
                                            <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
                                            <span>{c}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Debrief Accordion */}
                              {hasDebrief && (
                                <Accordion type="single" collapsible>
                                  <AccordionItem value="debrief" className="border border-border rounded-md bg-card/50">
                                    <AccordionTrigger className="px-3 py-2.5 text-xs font-medium text-primary hover:no-underline">
                                      <span className="flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Supplier Debrief &amp; Clarifications
                                      </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4 pt-1 space-y-4">
                                      {r.supplier_feedback && (
                                        <div className="space-y-1.5">
                                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Supplier Feedback
                                          </p>
                                          <blockquote className="border-l-2 border-primary/40 pl-3 py-1.5 text-sm text-foreground/90 italic leading-relaxed">
                                            {r.supplier_feedback}
                                          </blockquote>
                                        </div>
                                      )}
                                      {r.clarification_questions && r.clarification_questions.length > 0 && (
                                        <div className="space-y-2">
                                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                            <HelpCircle className="h-3.5 w-3.5 text-primary" />
                                            Questions for Supplier
                                          </p>
                                          <ol className="space-y-1.5 pl-1 list-none counter-reset-questions">
                                            {r.clarification_questions.map((q, i) => (
                                              <li
                                                key={i}
                                                className="text-sm text-foreground/90 flex items-start gap-2.5 leading-relaxed"
                                              >
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-semibold mt-0.5">
                                                  {i + 1}
                                                </span>
                                                <span>{q}</span>
                                              </li>
                                            ))}
                                          </ol>
                                        </div>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                </section>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Tab 3: Supplier Red-Team ── */}
        <TabsContent value="redteam" className="space-y-6 mt-4">
          <section className="rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent p-5 space-y-2">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Skull className="h-5 w-5 text-destructive" />
              Red-Team Draft Review
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload your draft bid before submission. The AI will brutally critique it against the RFQ — exposing gaps, weaknesses, and competitive vulnerabilities.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Select Target RFQ</h2>
            <Select
              value={redTeamRFQId}
              onValueChange={(v) => {
                setRedTeamRFQId(v);
                setRedTeamEvaluation(null);
              }}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Choose a completed RFQ…" />
              </SelectTrigger>
              <SelectContent>
                {completedRFQs.map((rfq) => (
                  <SelectItem key={rfq.id} value={rfq.id}>
                    {rfq.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {redTeamRFQId && !redTeamEvaluation && (
            <>
              <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-destructive" />
                  Upload Your Draft Bid
                </h2>
                <FileDropzone
                  onFileDrop={(f) => uploadDraftBidMutation.mutate(f)}
                  label={uploadDraftBidMutation.isPending ? "Uploading…" : "Drop draft bid PDF here or click to browse"}
                  sublabel="Upload a single draft bid for critique"
                  disabled={uploadDraftBidMutation.isPending}
                />
              </section>

              {redTeamBids.length > 0 && (
                <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Draft Bids</h2>
                  {redTeamBidsLoading ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                  ) : (
                    <div className="rounded-md border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Filename</TableHead>
                            <TableHead>Status / Progress</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {redTeamBids.map((bid) => (
                            <TableRow key={bid.id}>
                              <TableCell className="font-medium">{bid.name}</TableCell>
                              <TableCell>
                                {bid.status === "processing" ? (
                                  <div className="space-y-1 max-w-xs">
                                    <Progress value={bid.progress} className="h-2" />
                                    <p className="text-xs text-muted-foreground">
                                      {bid.message || "Processing…"}
                                    </p>
                                  </div>
                                ) : bid.status === "completed" ? (
                                  <Badge variant="outline" className="border-primary/40 text-primary">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" /> Failed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {bid.status === "completed" && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="gap-1.5"
                                      onClick={() => draftEvalMutation.mutate(bid.id)}
                                      disabled={draftEvalMutation.isPending}
                                    >
                                      {draftEvalMutation.isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Skull className="h-3.5 w-3.5" />
                                      )}
                                      Critique My Draft Bid
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-1.5 text-muted-foreground hover:text-destructive"
                                    onClick={() => deleteDraftBidMutation.mutate(bid.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {/* ── Red-Team Results ── */}
          {redTeamEvaluation && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleClearRedTeam} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Clear &amp; Start Over
                </Button>
              </div>

              {/* Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary" />
                      Compliance Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-primary tabular-nums">
                        {redTeamEvaluation.compliance_score_out_of_10 ?? "—"}
                      </span>
                      <span className="text-2xl text-muted-foreground font-medium">/10</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-destructive/40 bg-gradient-to-br from-destructive/10 to-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                      <Trophy className="h-4 w-4 text-destructive" />
                      Competitiveness Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-destructive tabular-nums">
                        {redTeamEvaluation.competitiveness_score_out_of_10 ?? "—"}
                      </span>
                      <span className="text-2xl text-muted-foreground font-medium">/10</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Executive Summary */}
              {redTeamEvaluation.executive_summary && (
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {redTeamEvaluation.executive_summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Critical Gaps */}
              {redTeamEvaluation.missing_requirements && redTeamEvaluation.missing_requirements.length > 0 && (
                <Card className="border-destructive/40 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase tracking-wider text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Critical Gaps — Missing Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5">
                      {redTeamEvaluation.missing_requirements.map((m, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2.5 leading-relaxed">
                          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Technical Vulnerabilities */}
              {redTeamEvaluation.technical_flaws && redTeamEvaluation.technical_flaws.length > 0 && (
                <Card className="border-warning/40 bg-warning/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Technical Vulnerabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5">
                      {redTeamEvaluation.technical_flaws.map((t, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2.5 leading-relaxed">
                          <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Strategic Edge */}
              {redTeamEvaluation.creative_suggestions && redTeamEvaluation.creative_suggestions.length > 0 && (
                <Card className="border-success/40 bg-success/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase tracking-wider text-success flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Strategic Edge — Creative Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5">
                      {redTeamEvaluation.creative_suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2.5 leading-relaxed">
                          <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-success" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Commercial Assessment */}
              {redTeamEvaluation.pricing_feedback && (
                <Card className="border-l-4 border-l-success">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      Commercial Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {redTeamEvaluation.pricing_feedback}
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>
          )}
        </TabsContent>
      </Tabs>

      {/* ── RFQ Understanding Dialog ── */}
      <Dialog open={!!viewRFQ} onOpenChange={(o) => !o && setViewRFQ(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              AI Understanding — {viewRFQ?.name}
            </DialogTitle>
            <DialogDescription>
              Extracted rubric the AI will use to evaluate vendor bids.
            </DialogDescription>
          </DialogHeader>
          {viewRFQ?.understanding ? (
            <div className="space-y-4 mt-2">
              {Object.entries(viewRFQ.understanding).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </p>
                  {Array.isArray(value) ? (
                    <ul className="text-sm text-foreground space-y-1 pl-4 list-disc">
                      {value.map((v, i) => (
                        <li key={i}>{String(v)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value ?? "—")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No understanding data available.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
