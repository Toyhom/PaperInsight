# Paper Insight 🧠

Paper Insight is an intelligent research assistant that helps you discover, organize, and synthesize ideas from academic papers. It automatically crawls Arxiv, extracts key "Research Atoms" (Motivation, Idea, Method), and allows you to combine them into new research proposals using LLMs.

## Features

- **🔍 Automated Crawler**: Daily or manual crawling of Arxiv papers (e.g., `cs.AI`, `cs.CV`).
- **⚛️ Atom Extraction**: Automatically extracts core concepts (Motivation, Idea, Method) from PDFs using LLMs.
- **📂 Global Library**: A searchable database of all extracted research atoms.
- **💡 Idea Synthesis**: Select atoms and use AI to generate novel research proposals.
- **📝 History**: View past synthesis reports.
- **📄 Manual Upload**: Upload local PDFs to process and add to your library.

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js (Express) + Python (PDF Parsing)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Queue/Jobs**: Inngest (Background processing)
- **LLM**: OpenAI / Compatible API

## Getting Started

### 1. Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- Supabase Project (Create one at [supabase.com](https://supabase.com))
  - *Note: This project relies on Supabase for its PostgreSQL database, pgvector search, and realtime capabilities. Even for local runs, you need a database connection (cloud or local Docker).*

### 2. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

**Required Variables (.env):**

*   `EXTRACTOR_API_KEY`: API Key for the model used to extract atoms (e.g., OpenAI, Gemini).
*   `SYNTHESIZER_API_KEY`: API Key for the model used to generate ideas.
*   `SUPABASE_URL` & `KEYS`: Your Supabase project credentials.
*   `VITE_SUPABASE_...`: Same as above, for the frontend.

### 3. Database Setup

Run the migration scripts in your Supabase SQL Editor to set up the tables:

1.  `supabase/migrations/20240129000000_init_schema.sql`
2.  `supabase/migrations/20240129000001_relax_rls.sql`
3.  `supabase/migrations/20240129000002_crawler_settings.sql`

### 4. Install Dependencies

```bash
# Install Node dependencies
npm install

# Install Python dependencies (for PDF parsing)
pip install requests feedparser pymupdf
```

### 5. Run Local Development

Start all services (Frontend, Backend, Inngest, Python Service) concurrently:

```bash
npm run dev
```

*   **Frontend**: http://localhost:5173
*   **Inngest Dashboard**: http://localhost:8288
*   **Backend API**: http://localhost:3001

## Usage

1.  **Admin Panel**: Go to `/admin` (or click Admin in the header).
    *   Trigger a manual crawl for a topic (e.g., `cat:cs.CL`).
    *   Or upload a PDF file manually.
2.  **Wait for Processing**: Check the Inngest dashboard or the progress bar.
3.  **Explore**: Go to Home, click **"+"** to browse extracted atoms.
4.  **Synthesize**: Select interesting atoms and click "Synthesize" to generate a research proposal.

## License

MIT
