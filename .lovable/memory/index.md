# Memory: index.md
Updated: now

# Project Memory

## Core
Design: High-end minimal enterprise. Deep slate bg, electric blue/emerald accents. Glassmorphism, animated gradients.
Typography: Inter primary, JetBrains Mono for code. Page titles centered & bold.
Tech Stack: FastAPI backend at http://localhost:8000, React Router DOM, @tanstack/react-query, shadcn.
App Structure: Persistent left sidebar. OmniDoc Engine contains Conformance Engine and Research Assistant.
CLIR: Global LanguageProvider; pass `user_language` to backend endpoints (FormData or query param per endpoint).

## Memories
- [UI Patterns](mem://style/ui-patterns) — Sidebar navigation, tabbed engines, glassmorphism, responsive routing
- [Project Identity](mem://project/identity) — OmniDoc Engine unified framework details for Conformance and Research modules
- [Knowledge Scoping](mem://features/knowledge-scoping) — Global state for active Knowledge Banks and document filtering rules
- [Document Querying](mem://features/document-querying) — Document Auditor slide-up drawer chat with localStorage archiving
- [Knowledge Bank Upload](mem://features/knowledge-bank-upload) — Upload document modal, priority levels, and badge color coding
- [Ingestion Tracking](mem://features/ingestion-tracking) — Real-time progress polling for Conformance and Research modules
- [Auditor Workflow](mem://features/auditor-workflow) — Document Auditor async background job polling and state rendering
- [Knowledge Management](mem://features/knowledge-management) — Bulk deletion logic for documents and Knowledge Banks
- [Integrity Scan](mem://features/integrity-scan) — Analyse Bank for contradictions and doctrine resolution workflow
- [HITL Doctrine Editor](mem://features/doctrine-editor) — Human-in-the-Loop markdown editor and PDF export for rulebooks
- [Impact Simulator](mem://features/impact-simulator) — Blast Radius analysis of proposed doctrine changes
- [Auditor Results](mem://features/auditor-results) — Structured violation cards with severity and resolution sections
- [Research Ingestion](mem://features/research-ingestion) — Academic document topic tagging and deletion rules
- [Research Chat](mem://features/research-chat) — Split-screen UI, inline citation parsing, LaTeX math support
- [API Integration](mem://tech/api-integration) — FastAPI backend details, multipart uploads, and schema differences
- [CLIR Language](mem://features/clir-language) — Global language selector, localStorage persistence, user_language propagation
