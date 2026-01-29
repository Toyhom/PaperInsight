import { serve } from "inngest/express";
import { inngest } from "../lib/inngest.js";
import { ingestPapers, processLocalPaper } from "../functions/ingest.js";

// Create an API that serves Inngest functions
export const inngestRoute = serve({
  client: inngest,
  functions: [
    ingestPapers,
    processLocalPaper
  ],
});
