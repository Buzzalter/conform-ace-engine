import { useNavigate } from "react-router-dom";
import { Shield, BookOpen, ShieldAlert, Gavel, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Conformance Engine",
    description:
      "Ingest operational rulebooks, run Map-Reduce conflict analysis, and conduct exhaustive compliance auditing.",
    icon: Shield,
    route: "/conformance",
    gradient: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
  },
  {
    title: "Research Assistant",
    description:
      "Ingest complex academic papers, chat across multi-domain knowledge graphs, and view exact inline PDF citations.",
    icon: BookOpen,
    route: "/research",
    gradient: "from-success/20 to-success/5",
    borderColor: "border-success/30",
    iconColor: "text-success",
  },
  {
    title: "OSINT Redaction Engine",
    description:
      "Upload sensitive documents, run automated entity detection with OSINT intelligence, and produce redacted PDFs.",
    icon: ShieldAlert,
    route: "/redaction",
    gradient: "from-destructive/20 to-destructive/5",
    borderColor: "border-destructive/30",
    iconColor: "text-destructive",
  },
  {
    title: "Bid Analyser",
    description:
      "AI-powered vendor evaluation and source selection. Score, rank, and recommend bids against an RFQ.",
    icon: Gavel,
    route: "/bid-analyser",
    gradient: "from-orange-500/20 to-orange-500/5",
    borderColor: "border-orange-500/40",
    iconColor: "text-orange-500",
  },
  {
    title: "Intelligence & Insights Hub",
    description:
      "Ingest data into Knowledge Banks, generate strategic Master Reports with Medallion lineage, chat, and export multimedia.",
    icon: Sparkles,
    route: "/insights",
    gradient: "from-purple-500/20 to-purple-500/5",
    borderColor: "border-purple-500/40",
    iconColor: "text-purple-500",
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 max-w-2xl"
      >
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">
          OmniDoc Engine
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          A unified AI framework for document intelligence. Choose a system below to get started.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {features.map((f, i) => (
          <motion.button
            key={f.route}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 * (i + 1) }}
            onClick={() => navigate(f.route)}
            className={`group text-left rounded-xl border ${f.borderColor} bg-gradient-to-br ${f.gradient} p-6 hover:scale-[1.02] transition-all duration-200 hover:shadow-lg hover:shadow-primary/5`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-card p-2.5 border border-border/50">
                <f.icon className={`h-6 w-6 ${f.iconColor}`} />
              </div>
              <h2 className="text-lg font-bold text-foreground">{f.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {f.description}
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary group-hover:gap-2.5 transition-all">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
