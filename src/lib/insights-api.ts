const BASE = "http://localhost:8000";

export interface InsightsDocument {
  id: string;
  name: string;
  uploaded_at?: string;
  bank?: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  message?: string;
}

export interface InsightLineage {
  silver_fact_id?: string;
  bronze_page_number?: string | number;
  bronze_raw_quote?: string;
  source_document?: string;
}

export interface KeyInsight {
  title?: string;
  insight: string;
  category?: string;
  lineage?: InsightLineage[];
}

export interface MasterReport {
  id?: string;
  report_id?: string;
  bank_name?: string;
  executive_summary: string;
  key_insights: KeyInsight[];
  generated_at?: string;
  podcast_url?: string;
  video_url?: string;
}

export async function generateReportPodcast(reportId: string, userLanguage: string = "English"): Promise<void> {
  const form = new FormData();
  form.append("user_language", userLanguage);
  const res = await fetch(
    `${BASE}/api/insights/reports/${encodeURIComponent(reportId)}/generate-podcast`,
    { method: "POST", body: form }
  );
  if (!res.ok) throw new Error("Failed to start podcast generation");
}

export async function generateReportVideo(reportId: string, userLanguage: string = "English"): Promise<void> {
  const form = new FormData();
  form.append("user_language", userLanguage);
  const res = await fetch(
    `${BASE}/api/insights/reports/${encodeURIComponent(reportId)}/generate-video`,
    { method: "POST", body: form }
  );
  if (!res.ok) throw new Error("Failed to start video generation");
}

export async function fetchInsightsDocuments(): Promise<InsightsDocument[]> {
  const res = await fetch(`${BASE}/api/insights/documents`);
  if (!res.ok) throw new Error("Failed to fetch insights documents");
  return res.json();
}

export async function fetchInsightsBanks(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/insights/banks`);
  if (!res.ok) {
    // Fallback: derive from documents if banks endpoint missing
    const docs = await fetchInsightsDocuments().catch(() => []);
    return Array.from(new Set(docs.map((d) => d.bank).filter(Boolean) as string[]));
  }
  return res.json();
}

export async function uploadInsightsDocument(
  file: File,
  activeBanks: string[]
): Promise<InsightsDocument> {
  const form = new FormData();
  form.append("file", file);
  form.append("active_banks", JSON.stringify(activeBanks));
  const res = await fetch(`${BASE}/api/insights/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to upload document");
  return res.json();
}

export async function deleteInsightsDocument(docId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/insights/documents/${docId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function generateMasterReport(
  bankName: string,
  userLanguage: string = "English"
): Promise<MasterReport> {
  const url = `${BASE}/api/insights/banks/${encodeURIComponent(
    bankName
  )}/generate?user_language=${encodeURIComponent(userLanguage)}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error("Failed to generate report");
  return res.json();
}

export async function fetchMasterReport(bankName: string): Promise<MasterReport | null> {
  const res = await fetch(
    `${BASE}/api/insights/banks/${encodeURIComponent(bankName)}/report`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch report");
  return res.json();
}

export async function askInsightsChat(
  query: string,
  activeBanks: string[],
  history: { role: string; content: string }[],
  userLanguage: string = "English"
): Promise<string> {
  const form = new FormData();
  form.append("query", query);
  form.append("active_banks", JSON.stringify(activeBanks));
  form.append("history", JSON.stringify(history));
  form.append("user_language", userLanguage);
  const res = await fetch(`${BASE}/api/insights/chat`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to get chat response");
  const data = await res.json();
  return data.response;
}

export interface MultimediaSlide {
  title?: string;
  content?: string;
  bullets?: string[];
  speaker_notes?: string;
  [k: string]: unknown;
}

export interface MultimediaResult {
  material_type: string;
  title?: string;
  slides?: MultimediaSlide[];
  script?: string;
  sections?: Array<{ heading: string; body: string }>;
  [k: string]: unknown;
}

export async function generateMultimedia(
  bankName: string,
  materialType: string,
  userLanguage: string = "English"
): Promise<MultimediaResult> {
  const form = new FormData();
  form.append("material_type", materialType);
  form.append("user_language", userLanguage);
  const res = await fetch(
    `${BASE}/api/insights/banks/${encodeURIComponent(bankName)}/multimedia`,
    { method: "POST", body: form }
  );
  if (!res.ok) throw new Error("Failed to generate multimedia");
  return res.json();
}
