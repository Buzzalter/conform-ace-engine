import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function ConformanceSuccess() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="flex flex-col items-center justify-center gap-6 py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="rounded-full bg-success/10 p-6"
      >
        <CheckCircle2 className="h-16 w-16 text-success" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Perfect Conformance</h2>
        <p className="text-muted-foreground">
          Document perfectly conforms to all rulebooks.
        </p>
      </div>
    </motion.div>
  );
}
