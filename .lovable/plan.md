

# AI Conformance Checker

A sleek, enterprise-grade conformance checking application with a sophisticated dark UI.

## Design System
- **Theme**: Deep slate backgrounds (`slate-900`, `slate-950`) with electric blue accents (`blue-500/600`) and emerald success states
- **Effects**: Glassmorphism navbar/sidebar, animated gradient borders on dropzones, elevation on hover for cards
- **Typography**: Clean, minimal, generous whitespace
- **Loading**: Skeleton screens and animated text cycling

## Layout
- **Sidebar navigation** with glassmorphism effect (`backdrop-blur`, semi-transparent background)
- Two main routes: **Rulebook Manager** and **Conformance Auditor**
- Collapsible sidebar with icons (Book, Shield/Search)
- App wrapped in dark mode by default

## Pages

### 1. Rulebook Manager (`/`)
- Dashboard header with title and document count
- **Document list**: Cards for each active rulebook showing name, upload date, and a subtle trash icon with delete confirmation dialog
- **Upload zone**: Drag-and-drop area with animated gradient border on hover/dragover
- **Upload flow**: POST to `/api/conformance/upload` (multipart, key: `file`) → elegant spinner with "Ingesting into Knowledge Graph..." text
- **Delete flow**: Confirmation dialog → DELETE to `/api/conformance/{doc_id}` → toast notification
- Initial load fetches document list (GET `/api/conformance/documents` or similar — will include a fetch call)

### 2. Conformance Auditor (`/auditor`)
- Large centered drag-and-drop zone with animated gradient border
- **Upload**: POST to `/api/submission/check` (multipart, key: `file`)
- **Loading state**: Replaces dropzone with a dynamic sequence cycling through analysis phase messages with smooth fade transitions
- **Results - Violations found**: Beautiful violation cards showing:
  - Failed quote (highlighted/blockquote style)
  - Rule violated with section number badge
  - Severity pill (color-coded)
  - AI reasoning in a subtle expandable or visible section
  - Cards elevate with soft shadow on hover
- **Results - No violations**: Large animated green checkmark with "Document perfectly conforms to all rulebooks" message
- Reset button to check another document

## Components to Build
- `AppSidebar` — glassmorphism sidebar with nav links
- `FileDropzone` — reusable drag-and-drop with animated gradient border
- `RulebookCard` — document card with delete action
- `ViolationCard` — rich violation display card with hover elevation
- `AnalysisLoader` — cycling text animation component
- `ConformanceSuccess` — green checkmark success state

## API Integration (real fetch calls, no mocks)
- `GET /api/conformance/documents` — list rulebooks
- `POST /api/conformance/upload` — upload rulebook
- `DELETE /api/conformance/{doc_id}` — delete rulebook
- `POST /api/submission/check` — submit document for analysis

