import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { Violation } from "@/lib/api";

const severityColors: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  major: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  minor: "bg-muted text-muted-foreground border-border",
};

interface ViolationCardProps {
  violation: Violation;
  index: number;
}

export function ViolationCard({ violation, index }: ViolationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/20"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={severityColors[violation.severity]}>
            {violation.severity}
          </Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
            § {violation.section}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {violation.source_document}
        </span>
      </div>

      <blockquote className="border-l-2 border-primary/40 pl-4 py-1 mb-4 text-sm text-foreground/80 italic">
        "{violation.quote}"
      </blockquote>

      <div className="mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Rule Violated
        </p>
        <p className="text-sm text-foreground">{violation.rule}</p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          AI Reasoning
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">{violation.reasoning}</p>
      </div>
    </motion.div>
  );
}
