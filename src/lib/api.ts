const BASE = "http://localhost:8000";

export interface RulebookDocument {
  id: string;
  name: string;
  uploaded_at: string;
}

export interface Violation {
  quote: string;
  rule: string;
  section: string;
  severity: "critical" | "major" | "minor";
  source_document: string;
  reasoning: string;
}

export async function fetchDocuments(): Promise<RulebookDocument[]> {
  const res = await fetch(`${BASE}/api/conformance/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function uploadRulebook(file: File): Promise<RulebookDocument> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/conformance/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to upload rulebook");
  return res.json();
}

export async function deleteRulebook(docId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/conformance/${docId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete rulebook");
}

export async function checkSubmission(file: File): Promise<Violation[]> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/submission/check`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to check submission");
  return res.json();
}
