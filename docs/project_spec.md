# Paper Insight - System Development Whitepaper

## 1. Project Overview
**Project**: SaaS platform for auxiliary scientific research inspiration generation.
**Core Value**: The system automatically crawls and structures papers (not displayed to users) in the background, dismantling them into "Research Atoms" (Motivation, Idea, Method). Users search for these atoms on the frontend, add them to a "candidate pool", and use high-IQ AI models to organically combine these atoms to generate new research ideas.

## 2. Architecture & Stack
### 2.1 Core Tech Stack
- **Deployment**: Vercel (Frontend + Serverless Functions)
- **Frontend**: Next.js 14 (App Router, TypeScript)
- **UI Components**: Shadcn/UI + Tailwind CSS + Lucide Icons
- **Database**: Supabase (PostgreSQL + pgvector)
- **Object Storage**: Vercel Blob (or Supabase Storage) - for PDF storage
- **Async Queue**: Inngest - to solve Vercel function timeouts (crawler and analysis)
- **AI Integration**: OpenAI SDK (supports compatible interfaces like DeepSeek, GPT-4)

### 2.2 Environment Separation (Req 1)
Use Next.js standard environment variables.
- **Development**: Local run, connects to Supabase Dev project, uses test API Keys.
- **Production**: Vercel deployment, connects to Supabase Prod project, uses formal API Keys.
- **Configuration**: Managed via `.env.local` (local) and Vercel Dashboard (online).

## 3. Global Configuration & Prompt Management (Req 4, 8)
### 3.1 Config Structure (`lib/config.ts`)
Global config singleton managing all URLs and Keys.
```typescript
// lib/config.ts
export const AppConfig = {
  env: process.env.NODE_ENV, // 'development' | 'production'
  
  // Model Config (Req 4)
  llm: {
    extractor: {
      // Cheap model for atom extraction (e.g., gpt-4o-mini, deepseek-v3)
      apiKey: process.env.EXTRACTOR_API_KEY,
      baseUrl: process.env.EXTRACTOR_BASE_URL,
      modelName: process.env.EXTRACTOR_MODEL_NAME,
    },
    synthesizer: {
      // Smart model for logic synthesis (e.g., gpt-4o, deepseek-r1)
      apiKey: process.env.SYNTHESIZER_API_KEY,
      baseUrl: process.env.SYNTHESIZER_BASE_URL,
      modelName: process.env.SYNTHESIZER_MODEL_NAME,
    }
  },
  
  // Crawler Config
  crawler: {
    cronSecret: process.env.CRON_SECRET, // Protect cron jobs
  }
}
```

### 3.2 Prompt Repository (`lib/prompts.ts`) (Req 8)
Dedicated file for Prompts.
```typescript
// lib/prompts.ts
export const Prompts = {
  // Extraction Prompt (Note: Ignore content after conclusion)
  extractionSystem: `You are a strict academic parser.
  Task: Extract 'Motivation', 'Idea', and 'Method' atoms from the provided paper text.
  Constraint: Ignore any text related to 'Conclusion', 'Future Work', or 'References'. Focus only on the problem definition and methodology.
  Output: Return a JSON object: { "motivation": "...", "idea": "...", "method": "..." }.`,

  // Synthesis Prompt
  synthesisSystem: `You are a Principal Investigator.
  Task: Analyze the compatibility of the user-provided Research Atoms.
  Inputs provided:
  - Motivation: {motivation_text}
  - Idea: {idea_text}
  - Method: {method_text}
  
  Instructions:
  1. Evaluate if this specific Method can theoretically solve the Motivation using the core Idea.
  2. Propose a concrete experiment design.
  3. Output a structured report.`
}
```

## 4. Database Design (Schema) (Req 2, 3, 5)
Supabase tables:

1.  **papers** (Admin/System only)
    -   `id`: UUID
    -   `arxiv_id`: String (Unique)
    -   `title`: String (En/Cn)
    -   `pdf_url`: String (Blob URL)
    -   `raw_text_summary`: String (Extracted raw text, up to conclusion)
    -   `is_processed`: Boolean

2.  **research_atoms** (Global Atom Library)
    -   `id`: UUID
    -   `paper_id`: UUID (FK)
    -   `type`: Enum ('Motivation', 'Idea', 'Method')
    -   `content_en`: Text
    -   `content_cn`: Text
    -   `embedding`: Vector (Optional, for semantic search)

3.  **user_candidates** (User Candidate Pool - Persistent)
    -   `id`: UUID
    -   `user_id`: UUID
    -   `atom_id`: UUID (FK)
    -   `added_at`: Timestamp
    -   *Note*: Ensures selected atoms persist after refresh.

4.  **synthesis_reports** (Synthesis Results)
    -   `id`: UUID
    -   `user_id`: UUID
    -   `input_atoms`: JSONB (Records used atoms)
    -   `result_markdown`: Text (AI generated analysis)

## 5. Backend Workflow
### 5.1 Ingestion & Extraction (Admin/Cron Only)
**Logic**: Cron -> Download -> Truncate Text -> Cheap Model -> Save to Atom Lib.
**Endpoint**: `/api/cron/ingest` (Key protected)
**Inngest Job** (`functions/ingest.ts`):
1.  **Fetch**: Get today's list from Arxiv.
2.  **Filter**: Exclude existing.
3.  **Download**: PDF to Vercel Blob.
4.  **Parse**: PyMuPDF (Vercel Python Function). *Logic*: Stop at keywords (Reference, Conclusion).
5.  **Extract**: Use `AppConfig.llm.extractor` + `Prompts.extractionSystem`. Save to `research_atoms`.

### 5.2 Atom Synthesis (User Action)
**Logic**: User Click -> Validate -> Smart Model -> Stream Result.
**Endpoint**: `/api/synthesize`
**Action**:
1.  Receive `atom_ids`.
2.  **Validate**: Must have 1 Motivation, 1 Idea, 1 Method.
3.  Fetch full text.
4.  Use `AppConfig.llm.synthesizer` + `Prompts.synthesisSystem`.
5.  Stream result or save to `synthesis_reports`.

## 6. Frontend UX (Req 5, 6, 7)
### 6.1 Layout
-   **Top Nav**: Settings (Lang), API Key Config.
-   **Left: Candidate List** (Req 6):
    -   Show added atom cards (Type tag, short content, source title).
    -   Source: `user_candidates` table.
-   **Bottom Button**: "Synthesize".
-   **Right/Main: Synthesis Result**:
    -   Markdown report.
    -   Hover on atoms to show source paper info.

### 6.2 Interaction: Global Atom Search Modal (Req 5)
-   **Trigger**: "+" button on sidebar.
-   **UI**: Large Modal.
    -   Search box.
    -   Filter by Type.
    -   List global `research_atoms`.
    -   **Action**: "Add" button -> Adds to `user_candidates` -> Close modal.

## 7. Implementation Steps (Summary)
1.  **Init**: Next.js 14, Supabase setup, Config/Prompts lib.
2.  **Backend (Ingest)**: Inngest, Python PDF parser, Extractor LLM integration.
3.  **Frontend (Search)**: Atom Search Modal, Candidate List Sidebar, Persistence.
4.  **Backend (Synthesis)**: `/api/synthesize`, Validation, Smart Model integration.
5.  **Frontend (Result)**: Display Markdown, References.
