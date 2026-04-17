import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Violation } from "@/lib/api";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Lightbulb,
  Search,
  Trophy,
  Database,
  HardDrive,
} from "lucide-react";

const severityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: "bg-destructive/15 text-destructive border-destructive/30", label: "Critical" },
  major: { color: "bg-orange-500/15 text-orange-400 border-orange-500/30", label: "Major" },
  minor: { color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: "Minor" },
  recommendation: { color: "bg-blue-500/15 text-blue-400 border-blue-500/30", label: "Recommendation" },
};

interface ViolationCardProps {
  violation: Violation;
  index: number;
}

export function ViolationCard({ violation, index }: ViolationCardProps) {
  const severity = severityConfig[violation.severity] ?? severityConfig.minor;
  const [lineageOpen, setLineageOpen] = useState(false);
  const lineage = violation.lineage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
          <h3 className="text-sm font-semibold text-foreground leading-snug">{violation.title}</h3>
        </div>
        <Badge variant="outline" className={`${severity.color} shrink-0 text-[11px]`}>
          {severity.label}
        </Badge>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {/* The Error — quote from the uploaded document */}
        <div className="border-l-[3px] border-destructive/40 pl-4 py-2 bg-destructive/5 rounded-r-lg">
          <p className="text-[11px] font-medium text-destructive/70 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            Document Extract
          </p>
          <p className="text-sm text-foreground/80 italic leading-relaxed">"{violation.quote}"</p>
        </div>

        {/* The Rule */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            Rule Violated
          </p>
          <p className="text-sm text-foreground leading-relaxed">{violation.rule_broken}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
              {violation.source_document}
            </Badge>
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px]">
              Authority: {violation.authority_level}
            </Badge>
          </div>
        </div>

        {/* AI Summary */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3" />
            AI Summary
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{violation.summary}</p>
        </div>

        {/* Resolution */}
        <div className="border-l-[3px] border-emerald-500/40 pl-4 py-2 bg-emerald-500/5 rounded-r-lg">
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Required Actions
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{violation.actions}</p>
        </div>

        {/* Trace Lineage */}
        {lineage && (
          <div className="pt-2 border-t border-border/60">
            <Dialog open={lineageOpen} onOpenChange={setLineageOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 gap-1.5"
                >
                  <Search className="h-3.5 w-3.5" />
                  Trace Lineage
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Medallion Data Lineage
                  </DialogTitle>
                  <DialogDescription>
                    Trace how the AI formed this conclusion — from raw source text to the final ruling.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-2">
                  {/* GOLD */}
                  <div className="rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-yellow-600 dark:text-yellow-400 font-semibold">
                          Gold Layer
                        </p>
                        <p className="text-xs font-medium text-foreground">AI Conclusion</p>
                      </div>
                    </div>
                    <div className="space-y-2 pl-9">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Rule Broken</p>
                        <p className="text-sm text-foreground leading-relaxed">{violation.rule_broken}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Summary</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{violation.summary}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="h-4 w-px bg-border" />
                  </div>

                  {/* SILVER */}
                  <div className="rounded-lg border border-slate-400/30 bg-gradient-to-br from-slate-400/10 to-slate-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-full bg-slate-400/20 flex items-center justify-center">
                        <Database className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Silver Layer
                        </p>
                        <p className="text-xs font-medium text-foreground">Knowledge Graph</p>
                      </div>
                    </div>
                    <div className="space-y-2 pl-9">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                          Silver Rule ID
                        </p>
                        <code className="text-xs font-mono text-foreground bg-muted/60 px-2 py-0.5 rounded inline-block">
                          {lineage.silver_rule_id ?? "—"}
                        </code>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                          Source Document
                        </p>
                        <p className="text-sm text-foreground">{violation.source_document}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="h-4 w-px bg-border" />
                  </div>

                  {/* BRONZE */}
                  <div className="rounded-lg border border-orange-700/30 bg-gradient-to-br from-orange-700/10 to-amber-700/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-full bg-orange-700/20 flex items-center justify-center">
                        <HardDrive className="h-3.5 w-3.5 text-orange-600 dark:text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-orange-600 dark:text-orange-500 font-semibold">
                          Bronze Layer
                        </p>
                        <p className="text-xs font-medium text-foreground">Raw Source Data</p>
                      </div>
                    </div>
                    <div className="space-y-2 pl-9">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Page Number</p>
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 text-xs font-semibold">
                          Page {lineage.bronze_page_number ?? "—"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                          Raw OCR Quote
                        </p>
                        <pre className="text-xs font-mono text-muted-foreground bg-muted/40 border border-border rounded-md p-3 whitespace-pre-wrap break-words max-h-64 overflow-auto leading-relaxed">
{lineage.bronze_raw_quote ?? "No raw text available."}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </motion.div>
  );
}
