import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { Violation } from "@/lib/api";
import { AlertTriangle, BookOpen, CheckCircle2, FileText, Lightbulb } from "lucide-react";

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
      </div>
    </motion.div>
  );
}
