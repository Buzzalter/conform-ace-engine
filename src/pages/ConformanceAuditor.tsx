import { useState, useCallback } from "react";
import { FileDropzone } from "@/components/FileDropzone";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import { ConformanceSuccess } from "@/components/ConformanceSuccess";
import { ViolationCard } from "@/components/ViolationCard";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { checkSubmission, type Violation } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type State = "idle" | "loading" | "results";

export default function ConformanceAuditor() {
  const [state, setState] = useState<State>("idle");
  const [violations, setViolations] = useState<Violation[]>([]);

  const handleSubmit = useCallback(async (file: File) => {
    setState("loading");
    try {
      const result = await checkSubmission(file);
      setViolations(result);
      setState("results");
    } catch {
      toast({ title: "Analysis failed", description: "Could not process the submission.", variant: "destructive" });
      setState("idle");
    }
  }, []);

  const reset = () => {
    setState("idle");
    setViolations([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Conformance Auditor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Submit a document to check against all active rulebooks
          </p>
        </div>
        {state === "results" && (
          <Button variant="outline" size="sm" onClick={reset} className="gap-2 border-border">
            <RotateCcw className="h-3.5 w-3.5" />
            Check Another
          </Button>
        )}
      </div>

      {state === "idle" && (
        <FileDropzone
          onFileDrop={handleSubmit}
          label="Upload submission document"
          sublabel="Drop your document here for AI conformance analysis"
        />
      )}

      {state === "loading" && <AnalysisLoader />}

      {state === "results" && (
        <>
          {violations.length === 0 ? (
            <ConformanceSuccess />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found <span className="text-destructive font-semibold">{violations.length}</span> violation{violations.length !== 1 ? "s" : ""}
              </p>
              {violations.map((v, i) => (
                <ViolationCard key={i} violation={v} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
