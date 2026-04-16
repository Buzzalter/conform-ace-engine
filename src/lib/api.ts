const BASE = "http://localhost:8000";

export interface RulebookDocument {
  id: string;
  name: string;
  uploaded_at: string;
  bank: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  message?: string;
  priority_level?: number;
}

export interface Violation {
  title: string;
  quote: string;
  rule_broken: string;
  source_document: string;
  authority_level: string | number;
  severity: "critical" | "major" | "minor" | "recommendation";
  summary: string;
  actions: string;
}

export interface Impact {
  impact_level: "Critical" | "Warning";
  rule_affected: string;
  source_document: string;
  reasoning: string;
}

export async function fetchDocuments(): Promise<RulebookDocument[]> {
  const res = await fetch(`${BASE}/api/conformance/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function fetchBanks(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/conformance/banks`);
  if (!res.ok) throw new Error("Failed to fetch banks");
  return res.json();
}

export async function uploadRulebook(file: File, active_domains: string[], priorityLevel: number): Promise<RulebookDocument> {
  const form = new FormData();
  form.append("file", file);
  form.append("active_domains", JSON.stringify(active_domains));
  form.append("priority_level", priorityLevel.toString());
  const res = await fetch(`${BASE}/api/conformance/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to upload rulebook");
  return res.json();
}

export async function deleteRulebook(docId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/conformance/${docId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete rulebook");
}

export async function deleteKnowledgeBank(bankName: string): Promise<void> {
  const res = await fetch(`${BASE}/api/conformance/banks/${encodeURIComponent(bankName)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete Knowledge Bank");
}

export async function checkSubmission(file: File, active_domains: string[]): Promise<{ job_id: string; status: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("active_domains", JSON.stringify(active_domains));
  const res = await fetch(`${BASE}/api/submission/check`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to check submission");
  return res.json();
}

export async function fetchAuditJob(jobId: string): Promise<{ status: string; progress: number; message: string; filename: string; violations: Violation[] }> {
  const res = await fetch(`${BASE}/api/submission/job/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

export async function runIntegrityScan(bankName: string): Promise<string> {
  const res = await fetch(`${BASE}/api/conformance/banks/${encodeURIComponent(bankName)}/integrity`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to run integrity scan");
  const data = await res.json();
  return data.report;
}

export async function generateConsolidatedRulebook(bankName: string): Promise<string> {
  const res = await fetch(`${BASE}/api/conformance/banks/${encodeURIComponent(bankName)}/resolve`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to generate rulebook");
  const data = await res.json();
  return data.document;
}

export async function askChatbot(query: string, active_domains: string[], history: {role: string, content: string}[]): Promise<string> {
  const form = new FormData();
  form.append("query", query);
  form.append("active_domains", JSON.stringify(active_domains));
  form.append("history", JSON.stringify(history));
  const res = await fetch(`${BASE}/api/chat`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to get chatbot response");
  return res.text();
}

export async function simulateImpact(bankName: string, proposedChange: string): Promise<Impact[]> {
  const form = new FormData();
  form.append("proposed_change", proposedChange);
  const res = await fetch(`${BASE}/api/conformance/banks/${encodeURIComponent(bankName)}/simulate`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to simulate impact");
  const data = await res.json();
  return data.impacts;
}

// ── Redaction Engine ──

export interface RedactionEntity {
  entity: string;
  reason: string;
}

export interface RedactionAnalysis {
  required: RedactionEntity[];
  suggested: RedactionEntity[];
}

export interface RedactionDocument {
  id: string;
  name: string;
  status: "processing" | "awaiting_review" | "completed" | "failed";
  progress: number;
  message?: string;
  analysis?: RedactionAnalysis;
}

export async function fetchRedactionDocuments(): Promise<RedactionDocument[]> {
  const res = await fetch(`${BASE}/api/redaction/documents`);
  if (!res.ok) throw new Error("Failed to fetch redaction documents");
  return res.json();
}

export async function analyzeRedactionDocument(file: File, manualCriteria: string): Promise<RedactionDocument> {
  const form = new FormData();
  form.append("file", file);
  form.append("manual_criteria", manualCriteria);
  const res = await fetch(`${BASE}/api/redaction/analyze`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to analyze document");
  return res.json();
}

export async function executeRedaction(docId: string, approvedEntities: string[]): Promise<Blob> {
  const form = new FormData();
  form.append("approved_entities", JSON.stringify(approvedEntities));
  const res = await fetch(`${BASE}/api/redaction/execute/${docId}`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to execute redaction");
  return res.blob();
}
