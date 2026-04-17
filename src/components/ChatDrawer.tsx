import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Bot, User, RotateCcw, MessageSquare, ArrowLeft, AlertTriangle, Database, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { askChatbot } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  graphIds: string[];
  messages: Message[];
}

interface ChatDrawerProps {
  activeGraphIds: string[];
  disabled?: boolean;
}

const STORAGE_KEY = "chat_sessions";

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function ChatDrawer({ activeGraphIds, disabled }: ChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>(loadSessions);
  const [viewingPastSessionId, setViewingPastSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const { language } = useLanguage();

  const saveCurrentChat = useCallback(() => {
    if (messages.length === 0) return;
    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "…" : "")
      : "Untitled";
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title,
      timestamp: new Date().toISOString(),
      graphIds: [...activeGraphIds],
      messages: [...messages],
    };
    setSavedSessions((prev) => {
      const next = [session, ...prev];
      persistSessions(next);
      return next;
    });
  }, [messages, activeGraphIds]);

  // Clear history when active knowledge graphs change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveCurrentChat();
    setMessages([]);
    setViewingPastSessionId(null);
    toast("Chat history cleared due to knowledge graph changes.");
  }, [activeGraphIds]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, viewingPastSessionId]);

  const handleNewConversation = useCallback(() => {
    saveCurrentChat();
    setMessages([]);
    setInput("");
    setViewingPastSessionId(null);
  }, [saveCurrentChat]);

  const handleSend = useCallback(async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await askChatbot(query, activeGraphIds, history, language);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that request." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, activeGraphIds, messages, language]);

  const viewingSession = viewingPastSessionId
    ? savedSessions.find((s) => s.id === viewingPastSessionId)
    : null;

  const displayMessages = viewingSession ? viewingSession.messages : messages;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground pl-4 pr-5 py-3 shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-105"
      >
        <Bot className="h-5 w-5" />
        <span className="text-sm font-semibold">Document Querying</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[70vh] glass border-t border-border/50 p-0 flex flex-col">
          <SheetHeader className="px-6 pt-4 pb-2 border-b border-border/40">
            <div className="flex items-center justify-between w-full pr-8">
              <SheetTitle className="flex items-center gap-2 text-foreground">
                <Bot className="h-5 w-5 text-primary" />
                Document Querying
              </SheetTitle>
              <Button
                variant="default"
                size="sm"
                onClick={handleNewConversation}
                className="h-7 text-xs gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                New Chat
              </Button>
            </div>
            {activeGraphIds.length > 0 && (
              <div className="flex items-center gap-1.5 px-6 pb-3 flex-wrap">
                <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground mr-1">Active:</span>
                {activeGraphIds.map((id) => (
                  <Badge key={id} variant="secondary" className="text-[11px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                    {id}
                  </Badge>
                ))}
              </div>
            )}
          </SheetHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar — saved sessions */}
            <div className="w-56 shrink-0 border-r border-border/40 flex flex-col">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                History
              </div>
              <ScrollArea className="flex-1">
                <div className="px-2 pb-2 space-y-1">
                  {/* Active chat entry */}
                  <button
                    onClick={() => setViewingPastSessionId(null)}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                      viewingPastSessionId === null
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Active Chat</span>
                    </div>
                  </button>

                  {savedSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setViewingPastSessionId(session.id)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 text-sm transition-colors",
                        viewingPastSessionId === session.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <p className="truncate text-xs">{session.title}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">
                        {new Date(session.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </button>
                  ))}

                  {savedSessions.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/50 px-3 py-4 text-center">
                      No past sessions
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {viewingSession && (
                <div className="px-4 py-2 bg-accent/50 border-b border-border/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-accent-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                    <span>Viewing past conversation (Read-Only). Knowledge graphs may have changed.</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs shrink-0"
                    onClick={() => setViewingPastSessionId(null)}
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Return to Active Chat
                  </Button>
                </div>
              )}

              <ScrollArea className="flex-1">
                <div ref={scrollRef} className="px-6 py-4 space-y-4">
                  {displayMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                      <Bot className="h-10 w-10 mb-3 opacity-40" />
                      <p>Query your knowledge banks</p>
                    </div>
                  )}
                  {displayMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-h3:text-base prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-foreground prose-strong:font-bold">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && !viewingSession && (
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

              {/* Input — hidden in read-only mode */}
              {!viewingSession && (
                <div className="px-6 py-3 border-t border-border/40">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about your knowledge banks…"
                      className="bg-secondary border-border/50"
                      disabled={loading}
                    />
                    <Button type="submit" size="icon" disabled={loading || !input.trim() || disabled}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
