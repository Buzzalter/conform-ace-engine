import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const phases = [
  "Running OCR parsing…",
  "Querying vector routing index…",
  "Traversing Knowledge Graph…",
  "Reasoning over conformance rules…",
  "Cross-referencing regulatory clauses…",
];

export function AnalysisLoader() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % phases.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-20">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative rounded-full bg-primary/10 p-6">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>

      <div className="h-8 flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-muted-foreground font-mono"
          >
            {phases[phase]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex gap-1.5">
        {phases.map((_, i) => (
          <div
            key={i}
            className={`h-1 w-6 rounded-full transition-colors duration-500 ${
              i <= phase ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
