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
  insight?: string;
  description?: string; 
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
  video_url?: string;
  audio_url?: string;
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

export function downloadMasterReportPDF(bankName: string) {
  // Opens the GET route which triggers the PDF file download
  window.open(`${BASE}/api/insights/banks/${encodeURIComponent(bankName)}/report/pdf`, '_blank');
}

// ─────────────────────────────────────────────────────────────────────────────
// History API
// ─────────────────────────────────────────────────────────────────────────────

export interface HistoryItem {
  id: string;
  title: string;
  bank_name?: string;
  created_at: string;
  // Reports
  report_id?: string;
  // Multimedia
  material_type?: string;
  audio_url?: string;
  video_url?: string;
  // Chat
  preview?: string;
  message_count?: number;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface ChatHistoryDetail extends HistoryItem {
  messages: ChatHistoryMessage[];
}

// ── Reports history ─────────────────────────────────────────────────────────
export async function fetchReportHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${BASE}/api/insights/history/reports`);
  if (!res.ok) return [];
  return res.json();
}

export async function deleteReportHistory(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/insights/history/reports/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete report from history");
}

export async function fetchReportFromHistory(id: string): Promise<MasterReport> {
  const res = await fetch(`${BASE}/api/insights/history/reports/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to load report");
  return res.json();
}

export function downloadReportFromHistory(id: string) {
  window.open(`${BASE}/api/insights/history/reports/${encodeURIComponent(id)}/pdf`, "_blank");
}

// ── Chat history ────────────────────────────────────────────────────────────
export async function fetchChatHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${BASE}/api/insights/history/chats`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchChatConversation(id: string): Promise<ChatHistoryDetail> {
  const res = await fetch(`${BASE}/api/insights/history/chats/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

export async function deleteChatHistory(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/insights/history/chats/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

// ── Multimedia history ──────────────────────────────────────────────────────
export async function fetchMultimediaHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${BASE}/api/insights/history/multimedia`);
  if (!res.ok) return [];
  return res.json();
}

export async function deleteMultimediaHistory(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/insights/history/multimedia/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete multimedia");
}

// ── Ingestion history (completed/failed docs) ───────────────────────────────
export async function fetchIngestionHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${BASE}/api/insights/history/ingestion`);
  if (!res.ok) {
    // Fallback: derive from documents endpoint
    const docs = await fetchInsightsDocuments().catch(() => []);
    return docs
      .filter((d) => d.status === "completed" || d.status === "failed")
      .map((d) => ({
        id: d.id,
        title: d.name,
        bank_name: d.bank,
        created_at: d.uploaded_at || new Date().toISOString(),
      }));
  }
  return res.json();
}

