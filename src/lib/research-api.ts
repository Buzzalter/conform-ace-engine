const BASE = "http://localhost:8000";

export interface ResearchDocument {
  id: string;
  name: string;
  topics: string[];
  uploaded_at: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  message?: string;
}

export interface Citation {
  cite_id: string;
  doc_name: string;
  page_num: number;
  quote: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
}

export async function fetchResearchTopics(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/research/topics`);
  if (!res.ok) throw new Error("Failed to fetch topics");
  return res.json();
}

export async function fetchResearchDocuments(): Promise<ResearchDocument[]> {
  const res = await fetch(`${BASE}/api/research/documents`);
  if (!res.ok) throw new Error("Failed to fetch research documents");
  return res.json();
}

export async function uploadResearchDocument(file: File, activeTopics: string[]): Promise<ResearchDocument> {
  const form = new FormData();
  form.append("file", file);
  form.append("active_topics", JSON.stringify(activeTopics));
  const res = await fetch(`${BASE}/api/research/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to upload research document");
  return res.json();
}

export async function researchChat(query: string, activeTopics: string[]): Promise<ChatResponse> {
  const form = new FormData();
  form.append("query", query);
  form.append("active_topics", JSON.stringify(activeTopics));
  const res = await fetch(`${BASE}/api/research/chat`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to get research chat response");
  return res.json();
}
