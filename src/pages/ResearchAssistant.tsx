import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileDropzone } from "@/components/FileDropzone";
import { TopicCombobox } from "@/components/TopicCombobox";
import { Upload, Loader2, Send, X, FileText, BookOpen, MessageSquare } from "lucide-react";
import {
  fetchResearchTopics,
  fetchResearchDocuments,
  uploadResearchDocument,
  researchChat,
  type Citation,
  type ChatResponse,
} from "@/lib/research-api";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

// Parse <cite id="X"/> tags in markdown and render as clickable badges
function CitationRenderer({
  content,
  citations,
  onCiteClick,
}: {
  content: string;
  citations: Citation[];
  onCiteClick: (c: Citation) => void;
}) {
  // Split on <cite id="..."/> patterns
  const parts = content.split(/(<cite\s+id="[^"]*"\s*\/>)/g);

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      {parts.map((part, i) => {
        const match = part.match(/<cite\s+id="([^"]*)"\s*\/>/);
        if (match) {
          const citeId = match[1];
          const citation = citations.find((c) => c.cite_id === citeId);
          const idx = citations.findIndex((c) => c.cite_id === citeId);
          if (citation) {
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onCiteClick(citation)}
                    className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded bg-primary/20 text-primary text-[11px] font-bold hover:bg-primary/30 transition-colors mx-0.5 align-baseline"
                  >
                    {idx + 1}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-semibold text-xs">{citation.doc_name} — p.{citation.page_num}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic line-clamp-3">"{citation.quote}"</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          return <span key={i} className="text-muted-foreground text-xs">[?]</span>;
        }
        // Render normal markdown
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
            {part}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}

export default function ResearchAssistant() {
  const qc = useQueryClient();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTopics, setUploadTopics] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Chat state
  const [chatTopics, setChatTopics] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: topics = [] } = useQuery({
    queryKey: ["researchTopics"],
    queryFn: fetchResearchTopics,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["researchDocs"],
    queryFn: fetchResearchDocuments,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.some((d) => d.status === "processing")) return 3000;
      return false;
    },
  });

  const allTopics = Array.from(new Set([...topics, ...uploadTopics, ...chatTopics]));

  const handleUpload = useCallback(async () => {
    if (!uploadFile || uploadTopics.length === 0) return;
    setUploading(true);
    try {
      await uploadResearchDocument(uploadFile, uploadTopics);
      qc.invalidateQueries({ queryKey: ["researchDocs"] });
      qc.invalidateQueries({ queryKey: ["researchTopics"] });
      setUploadFile(null);
      setUploadTopics([]);
      toast({ title: "Document uploaded", description: `${uploadFile.name} is being processed.` });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [uploadFile, uploadTopics, qc]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || chatTopics.length === 0) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res: ChatResponse = await researchChat(userMsg.content, chatTopics);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer, citations: res.citations },
      ]);
    } catch {
      toast({ title: "Chat error", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }, [input, chatTopics]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Research Assistant</h1>
        <p className="text-muted-foreground text-sm mt-2">Ingest academic papers and chat with inline PDF citations</p>
      </div>

      <Tabs defaultValue="ingestion" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass">
          <TabsTrigger value="ingestion" className="gap-2"><Upload className="h-4 w-4" />Ingestion</TabsTrigger>
          <TabsTrigger value="chat" className="gap-2"><MessageSquare className="h-4 w-4" />Chat</TabsTrigger>
        </TabsList>

        {/* Ingestion Tab */}
        <TabsContent value="ingestion" className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-card/50 p-6 space-y-5">
            <FileDropzone
              onFileDrop={(f) => setUploadFile(f)}
              label="Upload Research PDF"
              sublabel="Drop your academic paper here"
            />
            {uploadFile && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                <span className="truncate">{uploadFile.name}</span>
                <button onClick={() => setUploadFile(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Research Topics</label>
              <TopicCombobox topics={allTopics} selected={uploadTopics} onChange={setUploadTopics} placeholder="Select or create topics…" />
            </div>
            <Button onClick={handleUpload} disabled={!uploadFile || uploadTopics.length === 0 || uploading} className="w-full gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </Button>
          </div>

          {/* Document Table */}
          {docs.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Document</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Topics</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-3 text-foreground font-medium truncate max-w-[200px]">{doc.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {doc.topics?.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <Progress value={doc.progress} className="h-2" />
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {doc.status === "completed" ? "Done" : doc.status === "failed" ? "Failed" : doc.message || `${doc.progress}%`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-6">
          {/* Topic Selector Bar */}
          <div className="mb-4">
            <TopicCombobox topics={allTopics} selected={chatTopics} onChange={setChatTopics} placeholder="Select topics to query against…" />
          </div>

          <div className="flex gap-0 rounded-xl border border-border overflow-hidden" style={{ height: "calc(100vh - 340px)" }}>
            {/* Chat Area */}
            <div className={`flex flex-col transition-all duration-300 ${activeCitation ? "w-1/2" : "w-full"}`}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Ask a question about your research papers</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-foreground"}`}>
                      {msg.role === "assistant" && msg.citations ? (
                        <CitationRenderer content={msg.content} citations={msg.citations} onCiteClick={setActiveCitation} />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/70 rounded-xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-3 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder={chatTopics.length === 0 ? "Select topics first…" : "Ask about your research…"}
                  disabled={chatTopics.length === 0}
                  className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button size="icon" onClick={handleSend} disabled={!input.trim() || sending || chatTopics.length === 0}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* PDF Preview Pane */}
            <AnimatePresence>
              {activeCitation && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "50%", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-l border-border bg-card flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{activeCitation.doc_name}</p>
                      <p className="text-xs text-muted-foreground">Page {activeCitation.page_num}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setActiveCitation(null)} className="shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="rounded-lg border border-border bg-secondary/20 p-6 space-y-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Simulated PDF View</span>
                      </div>
                      <hr className="border-border" />
                      <blockquote className="border-l-4 border-primary/50 pl-4 italic text-foreground leading-relaxed text-sm">
                        "{activeCitation.quote}"
                      </blockquote>
                      <p className="text-[11px] text-muted-foreground">
                        Source: {activeCitation.doc_name}, Page {activeCitation.page_num}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
