import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { motion } from "framer-motion";
import {
  Sparkles, Upload, FileText, Loader2, Trash2, Globe, Send, Bot, User,
  Search, Trophy, Database, HardDrive, Wand2, Presentation, Mic, FileBarChart,
  ChevronLeft, ChevronRight, Video, RefreshCw, FileDown
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileDropzone } from "@/components/FileDropzone";
import { BankCombobox } from "@/components/BankCombobox";
import { CustomAudioPlayer } from "@/components/CustomAudioPlayer";
import { HistoryPane, ChatConversationView } from "@/components/HistoryPane";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { markdownComponents } from "@/lib/markdown-components";
import { toast } from "@/hooks/use-toast";
import {
  fetchInsightsDocuments, fetchInsightsBanks, uploadInsightsDocument,
  deleteInsightsDocument, generateMasterReport, fetchMasterReport,
  askInsightsChat, generateMultimedia, downloadMasterReportPDF,
  fetchReportHistory, deleteReportHistory, fetchReportFromHistory, downloadReportFromHistory,
  fetchChatHistory, fetchChatConversation, deleteChatHistory,
  fetchMultimediaHistory, deleteMultimediaHistory,
  fetchIngestionHistory,
  type MasterReport, type KeyInsight, type MultimediaResult, type HistoryItem, type ChatHistoryDetail,
} from "@/lib/insights-api";

const MATERIAL_TYPES = [
  { id: "video", label: "AI Video Briefing", icon: Video,
    description: "Generates a continuous, frame-chained news briefing video using LTX-Video." },
  { id: "podcast", label: "AI Podcast", icon: Mic,
    description: "Generates a long-form, multi-speaker conversational podcast using VibeVoice." }
];

export default function InsightsHub() {
  const { language } = useLanguage();

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Intelligence &amp; Insights Hub
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Ingest raw data, generate strategic Master Reports with Medallion lineage, chat with your knowledge, and export multimedia.
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Globe className="h-3 w-3" />
          <span>AI output synthesized in <span className="font-medium text-foreground">{language}</span>.</span>
        </div>
      </div>

      <Tabs defaultValue="ingest" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass">
          <TabsTrigger value="ingest" className="gap-2"><Upload className="h-4 w-4" />Data Ingestion</TabsTrigger>
          <TabsTrigger value="report" className="gap-2"><FileBarChart className="h-4 w-4" />Master Report</TabsTrigger>
          <TabsTrigger value="chat" className="gap-2"><Bot className="h-4 w-4" />AI Chat</TabsTrigger>
          <TabsTrigger value="multimedia" className="gap-2"><Wand2 className="h-4 w-4" />Multimedia Factory</TabsTrigger>
        </TabsList>

        <TabsContent value="ingest" className="mt-6"><IngestTab /></TabsContent>
        <TabsContent value="report" className="mt-6"><ReportTab /></TabsContent>
        <TabsContent value="chat" className="mt-6"><ChatTab /></TabsContent>
        <TabsContent value="multimedia" className="mt-6"><MultimediaTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1: Ingestion
// ─────────────────────────────────────────────────────────────────────────────
function IngestTab() {
  const qc = useQueryClient();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [bankName, setBankName] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: docs, isLoading } = useQuery({
    queryKey: ["insightsDocs"],
    queryFn: fetchInsightsDocuments,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.some((d) => d.status === "processing")) return 3000;
      return false;
    },
  });

  const { data: banks = [] } = useQuery({
    queryKey: ["insightsBanks"],
    queryFn: fetchInsightsBanks,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInsightsDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insightsDocs"] });
      qc.invalidateQueries({ queryKey: ["insightsBanks"] });
      toast({ title: "Document removed" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const handleUpload = useCallback(async () => {
    if (!pendingFile || !bankName.trim()) return;
    setUploading(true);
    try {
      await uploadInsightsDocument(pendingFile, [bankName.trim()]);
      qc.invalidateQueries({ queryKey: ["insightsDocs"] });
      qc.invalidateQueries({ queryKey: ["insightsBanks"] });
      toast({ title: "Ingestion started", description: `${pendingFile.name} → "${bankName.trim()}"` });
      setPendingFile(null);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [pendingFile, bankName, qc]);

  return (
    <div className="space-y-6">
      <Card className="glass border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" /> Upload Raw Data
          </CardTitle>
          <CardDescription>
            Specify a Knowledge Bank (new or existing), then drop a document to ingest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BankCombobox banks={banks} value={bankName} onChange={setBankName} />
          {pendingFile ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">{pendingFile.name}</span>
              <button onClick={() => setPendingFile(null)} className="p-1 rounded-md hover:bg-muted">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <FileDropzone
              onFileDrop={setPendingFile}
              label="Drop a document to ingest"
              sublabel="PDF, DOCX, TXT, CSV"
              compact
            />
          )}
          <Button
            onClick={handleUpload}
            disabled={!pendingFile || !bankName.trim() || uploading}
            className="w-full"
          >
            {uploading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>) : "Ingest into Knowledge Bank"}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Ingested Documents</CardTitle>
          <CardDescription>Real-time progress updates while documents are processed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
          ) : !docs || docs.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">
              No documents yet. Upload one above to get started.
            </div>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/40 px-4 py-3"
              >
                {doc.status === "processing" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                ) : doc.status === "failed" ? (
                  <FileText className="h-4 w-4 text-destructive shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    {doc.bank && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {doc.bank}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        doc.status === "completed" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                        doc.status === "processing" && "bg-primary/10 text-primary border-primary/20",
                        doc.status === "failed" && "bg-destructive/10 text-destructive border-destructive/20",
                      )}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                  {doc.status === "processing" && <Progress value={doc.progress} className="h-2" />}
                  {doc.message && (
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{doc.message}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(doc.id)}
                  className="p-1.5 rounded hover:bg-destructive/10"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-destructive/70" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: Master Report
// ─────────────────────────────────────────────────────────────────────────────
function ReportTab() {
  const { language } = useLanguage();
  const { data: banks = [] } = useQuery({
    queryKey: ["insightsBanks"],
    queryFn: fetchInsightsBanks,
  });

  const [selectedBank, setSelectedBank] = useState("");
  const [report, setReport] = useState<MasterReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Auto-fetch existing report when bank changes
  useEffect(() => {
    if (!selectedBank) { setReport(null); return; }
    let cancelled = false;
    setLoading(true);
    fetchMasterReport(selectedBank)
      .then((r) => { if (!cancelled) setReport(r); })
      .catch(() => { if (!cancelled) setReport(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedBank]);


  

  const handleGenerate = async () => {
    if (!selectedBank) return;
    setGenerating(true);
    try {
      const r = await generateMasterReport(selectedBank, language);
      setReport(r);
      toast({ title: "Master Report generated" });
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedBank) return;
    try {
      const r = await fetchMasterReport(selectedBank);
      setReport(r);
      toast({ title: "Report refreshed" });
    } catch {
      toast({ title: "Refresh failed", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-6">
      <Card className="glass border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-primary" /> Strategic Master Report
          </CardTitle>
          <CardDescription>
            Synthesize a strategic report across all documents in a Knowledge Bank, with full Medallion data lineage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-sm">Knowledge Bank</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger><SelectValue placeholder="Select a bank…" /></SelectTrigger>
                <SelectContent>
                  {banks.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">No banks available — ingest documents first.</div>
                  ) : banks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!selectedBank || generating}
              className="gap-2"
            >
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4" />Generate Strategic Report</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <Skeleton className="h-40 rounded-xl" />}

      {report && !loading && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadMasterReportPDF(selectedBank)} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
              <FileDown className="h-4 w-4" /> Export PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-1.5 text-muted-foreground">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {report.executive_summary || "_No summary returned._"}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 px-1 uppercase tracking-wider">
              Key Insights ({report.key_insights?.length ?? 0})
            </h3>
            <div className="space-y-3">
              {(report.key_insights ?? []).map((insight, i) => (
                <KeyInsightCard key={i} insight={insight} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyInsightCard({ insight, index }: { insight: KeyInsight; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden hover:border-primary/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base leading-snug">
              {insight.title || `Insight #${index + 1}`}
            </CardTitle>
            {insight.category && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">
                {insight.category}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {insight.description || insight.insight || "_No description provided._"}
            </ReactMarkdown>
          </div>

          {insight.lineage && insight.lineage.length > 0 && (
            <Accordion type="single" collapsible className="border-t border-border/60 pt-1">
              <AccordionItem value="lineage" className="border-0">
                <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:no-underline">
                  <span className="flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5" />
                    🔍 Trace Lineage ({insight.lineage.length} source{insight.lineage.length !== 1 ? "s" : ""})
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {insight.lineage.map((l, j) => (
                    <div key={j} className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-slate-400/10 text-slate-400 border-slate-400/30 text-[10px] gap-1">
                          <Database className="h-3 w-3" /> Silver
                        </Badge>
                        <code className="text-[11px] font-mono text-foreground bg-background/60 px-1.5 py-0.5 rounded">
                          {l.silver_fact_id ?? "—"}
                        </code>
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30 text-[10px] gap-1">
                          <HardDrive className="h-3 w-3" /> Bronze · Page {l.bronze_page_number ?? "—"}
                        </Badge>
                        {l.source_document && (
                          <span className="text-[11px] text-muted-foreground truncate">{l.source_document}</span>
                        )}
                      </div>
                      <pre className="text-xs font-mono text-muted-foreground bg-background/60 border border-border/60 rounded p-2.5 whitespace-pre-wrap break-words max-h-48 overflow-auto leading-relaxed">
{l.bronze_raw_quote ?? "No raw text available."}
                      </pre>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3: Chat
// ─────────────────────────────────────────────────────────────────────────────
interface ChatMessage { role: "user" | "assistant"; content: string }

const chatMarkdownComponents = {
  ...markdownComponents,
  // Allow native HTML <details>/<summary> from backend lineage blocks
  details: ({ children }: any) => (
    <details className="my-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm [&[open]>summary]:mb-2">
      {children}
    </details>
  ),
  summary: ({ children }: any) => (
    <summary className="cursor-pointer text-xs font-semibold text-primary uppercase tracking-wider select-none">
      {children}
    </summary>
  ),
  pre: ({ children }: any) => (
    <pre className="text-[11px] font-mono text-muted-foreground bg-background/60 border border-border/60 rounded p-2 whitespace-pre-wrap break-words my-2 leading-relaxed">
      {children}
    </pre>
  ),
};

function ChatTab() {
  const { language } = useLanguage();
  const { data: banks = [] } = useQuery({
    queryKey: ["insightsBanks"],
    queryFn: fetchInsightsBanks,
  });

  const [activeBanks, setActiveBanks] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const toggleBank = (b: string) => {
    setActiveBanks((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((p) => [...p, { role: "user", content: q }]);
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await askInsightsChat(q, activeBanks, history, language);
      setMessages((p) => [...p, { role: "assistant", content: response }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Sorry, I couldn't process that." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass border-border/60 flex flex-col h-[70vh]">
      <CardHeader className="border-b border-border/40 shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" /> Insights Chat Assistant
        </CardTitle>
        <CardDescription>Query active Knowledge Banks. Bronze/Silver lineage will render as collapsible blocks.</CardDescription>
        <div className="flex items-center gap-1.5 flex-wrap pt-2">
          <span className="text-[11px] text-muted-foreground mr-1">Active Banks:</span>
          {banks.length === 0 ? (
            <span className="text-[11px] text-muted-foreground italic">No banks — ingest documents first.</span>
          ) : (
            banks.map((b) => (
              <button
                key={b}
                onClick={() => toggleBank(b)}
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                  activeBanks.includes(b)
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary/50 text-muted-foreground border-border/40 hover:bg-secondary"
                )}
              >
                {b}
              </button>
            ))
          )}
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
              <Bot className="h-10 w-10 mb-3 opacity-40" />
              <p>Ask a question about your knowledge banks.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[78%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                )}
              >
                {m.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={chatMarkdownComponents}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
              {m.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-secondary rounded-xl px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-6 py-3 border-t border-border/40 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Globe className="h-3 w-3" />
          <span>Responses synthesized in <span className="font-medium text-foreground">{language}</span></span>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your insights…"
            className="bg-secondary border-border/50"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 4: Multimedia Factory
// ─────────────────────────────────────────────────────────────────────────────
function MultimediaTab() {
  const { language } = useLanguage();
  const { data: banks = [] } = useQuery({
    queryKey: ["insightsBanks"],
    queryFn: fetchInsightsBanks,
  });

  const [selectedBank, setSelectedBank] = useState("");
  const [materialType, setMaterialType] = useState<string>(MATERIAL_TYPES[0].id);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MultimediaResult | null>(null);

  const handleGenerate = async () => {
    if (!selectedBank) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await generateMultimedia(selectedBank, materialType, language);
      setResult(r);
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" /> Multimedia Factory
          </CardTitle>
          <CardDescription>Generate ready-to-use deliverables from a Knowledge Bank.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Knowledge Bank</Label>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger><SelectValue placeholder="Select a bank…" /></SelectTrigger>
              <SelectContent>
                {banks.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground">No banks available.</div>
                ) : banks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Material Type</Label>
            <div className="flex flex-wrap justify-center gap-3">
              {MATERIAL_TYPES.map((m) => {
                const Icon = m.icon;
                const active = materialType === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMaterialType(m.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 p-4 rounded-lg border text-left transition-all w-full sm:w-[280px]",
                      active
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border/50 bg-secondary/40 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-sm font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                        {m.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground leading-snug">{m.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={!selectedBank || loading} className="w-full gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4" />Generate Material</>}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <MultimediaResultView 
          result={result}
          bankName={selectedBank} 
          userLanguage={language} 
          onUpdate={setResult} 
        />
      )}
    </div>
  );
}

function MultimediaResultView({ 
  result, 
  bankName, 
  userLanguage, 
  onUpdate 
}: { 
  result: MultimediaResult; 
  bankName?: string; 
  userLanguage?: string;
  onUpdate?: (data: MultimediaResult) => void;
}) {

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (result.status === "processing" && bankName && onUpdate) {
      interval = setInterval(async () => {
         try {
            const form = new FormData();
            form.append("material_type", result.material_type);
            form.append("user_language", userLanguage || "English");
            form.append("action", "poll");
            
            // Ping the backend to check the status
            const res = await fetch(`http://localhost:8000/api/insights/banks/${encodeURIComponent(bankName)}/multimedia`, {
              method: "POST",
              body: form
            });
            const data = await res.json();
            
            // If the backend says success, it finished! Update the UI and stop polling.
            if (data.status === "success") {
              onUpdate(data);
              clearInterval(interval);
            }
         } catch (e) {
           console.error("Polling error:", e);
         }
      }, 10000); 
    }
    
    return () => clearInterval(interval);
  }, [result.status, bankName, result.material_type, userLanguage, onUpdate]);

  if (result.status === "processing") {
    const isPodcast = result.material_type === "podcast";
    const MediaIcon = isPodcast ? Mic : Video;
    return (
      <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-6 text-center relative">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          </div>

          {/* Custom themed spinner */}
          <div className="relative h-24 w-24 flex items-center justify-center">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/60 animate-spin" style={{ animationDuration: "1.8s" }} />
            {/* Inner counter-rotating ring */}
            <div className="absolute inset-3 rounded-full border border-transparent border-b-primary/70 border-l-primary/40 animate-spin" style={{ animationDuration: "2.5s", animationDirection: "reverse" }} />
            {/* Pulsing core */}
            <div className="absolute inset-6 rounded-full bg-primary/15 animate-pulse" />
            {/* Center icon */}
            <MediaIcon className="relative h-7 w-7 text-primary z-10" />
          </div>

          <div className="space-y-2 relative z-10">
            <CardTitle className="text-xl">
              Synthesizing {isPodcast ? "AI Podcast" : "Video Briefing"}…
            </CardTitle>
            <p className="text-muted-foreground max-w-md mx-auto">
              This is a heavy GPU workflow that takes 10-20 minutes depending on the size of the report. The AI is chunking the script and generating the media sequentially.
            </p>
            <p className="text-sm font-medium text-primary mt-4">
              You can safely navigate away! Come back later and click the generate button again to view your final media.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result.video_url) {
    const videoSrc = result.video_url.startsWith("http")
      ? result.video_url
      : `http://localhost:8000${result.video_url}`;
    return (
      <Card className="glass border-border/60 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" /> Generated Video Briefing
          </CardTitle>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <a href={videoSrc} download aria-label="Download video">
              <FileDown className="h-4 w-4" /> Download
            </a>
          </Button>
        </CardHeader>
        <CardContent className="flex justify-center bg-black/50 p-6">
          <video
            src={videoSrc}
            controls
            autoPlay
            className="max-w-full rounded-xl shadow-2xl border border-border/40"
            style={{ maxHeight: '60vh' }}
          />
        </CardContent>
      </Card>
    );
  }


  if (result.audio_url) {
    return (
      <Card className="glass border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" /> Generated AI Podcast
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <CustomAudioPlayer
            src={`http://localhost:8000${result.audio_url}`}
            title={result.title || "AI Podcast Briefing"}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Generated Material</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs font-mono text-muted-foreground bg-muted/40 border border-border rounded-md p-3 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}
