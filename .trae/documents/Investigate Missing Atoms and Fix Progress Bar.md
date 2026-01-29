# Investigation & Fix Plan

## 1. Verify Database Content
I need to confirm if the atoms were actually saved to the database.
- **Action**: Run a script to list the latest entries in the `research_atoms` table.
- **Goal**: Determine if this is a *data ingestion* failure or a *frontend display* issue.

## 2. Debug Progress Bar Logic
The progress bar jumping to 100% suggests the API response is too fast, causing the "completion" logic to trigger immediately.
- **Analysis**: The current logic relies on `triggering` state. When the API returns (fast), `triggering` becomes `false`, and the `else` block forces `setProgress(100)`.
- **Fix**: Decouple the visual progress from the API call status. We should ensure the animation runs for a minimum duration (e.g., 2 seconds) even if the API returns instantly, to provide better feedback.

## 3. Debug Atom Visibility
If data exists in the DB but isn't showing in the UI:
- **Check RLS**: Verify if Row Level Security policies allow public reading of `research_atoms`.
- **Check Search Query**: Ensure the frontend component (`AtomSearchModal`) is querying correctly (e.g., not filtering by a specific user ID for global atoms).

## 4. Execution Steps
1.  **Check DB**: Run `scripts/check_db.ts` (I will create this).
2.  **Fix AdminCrawler.tsx**: Improve progress bar logic to have a guaranteed minimum duration.
3.  **Fix/Verify RLS**: Ensure `research_atoms` is globally readable.
4.  **Verify/Fix AtomSearchModal**: Ensure it queries the global pool.
