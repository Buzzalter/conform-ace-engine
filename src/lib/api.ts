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

export async function uploadRulebook(file: File, active_domains: string[]): Promise<RulebookDocument> {
  const form = new FormData();
  form.append("file", file);
  form.append("active_domains", JSON.stringify(active_domains));
  const res = await fetch(`${BASE}/api/conformance/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to upload rulebook");
  return res.json();
}

export async function deleteRulebook(docId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/conformance/${docId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete rulebook");
}

export async function checkSubmission(file: File, active_domains: string[]): Promise<Violation[]> {
  const form = new FormData();
  form.append("file", file);
  form.append("active_domains", JSON.stringify(active_domains));
  const res = await fetch(`${BASE}/api/submission/check`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to check submission");
  return res.json();
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
