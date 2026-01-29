import { inngest } from "../lib/inngest.js";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import { AppConfig } from "../lib/config.js";
import { Prompts } from "../lib/prompts.js";
import OpenAI from "openai";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

// Setup OpenAI for Extractor
const extractorLLM = new OpenAI({
  apiKey: AppConfig.llm.extractor.apiKey,
  baseURL: AppConfig.llm.extractor.baseUrl,
});

const parser = new XMLParser();

export const processLocalPaper = inngest.createFunction(
  { id: "process-local-paper" },
  { event: "paper/process-local" },
  async ({ step, event }) => {
      const { pdfUrl, title, arxiv_id } = event.data;
      
      console.log(`Processing local paper: ${title} (${pdfUrl})`);

      // Step 1: Parse PDF
      const rawText = await step.run("parse-local-pdf", async () => {
          try {
              // Now we pass the URL (Supabase Storage URL) to the python service
              // The python service logic should handle downloading from URL.
              
              const response = await axios.post('http://localhost:8000', { 
                  url: pdfUrl 
              });
              return response.data.text;
          } catch (e) {
              console.error("Local PDF parse failed:", e);
              throw new Error("PDF parsing failed");
          }
      });

      // Step 2: Extract Atoms (Same logic as ingestPapers)
      const atoms = await step.run("extract-atoms", async () => {
        const completion = await extractorLLM.chat.completions.create({
          model: AppConfig.llm.extractor.modelName || "gpt-3.5-turbo",
          messages: [
            { role: "system", content: Prompts.extractionSystem },
            { role: "user", content: `Title: ${title}\n\nContent:\n${rawText.substring(0, 15000)}` }
          ],
          response_format: { type: "json_object" }
        });
        const content = completion.choices[0].message.content;
        return JSON.parse(content || "{}");
      });

      // Step 3: Save to DB
      await step.run("save-db", async () => {
        // Insert Paper
        const { data: paperData, error: pError } = await supabaseAdmin
            .from("papers")
            .insert({
                arxiv_id: arxiv_id, // "manual-timestamp"
                title: title,
                pdf_url: pdfUrl, // Now a proper URL
                raw_text_summary: rawText.substring(0, 50000),
                is_processed: true
            })
            .select()
            .single();
            
        if (pError) throw pError;

        // Insert Atoms
        const atomList = atoms.atoms || [];
        if (atomList.length === 0 && atoms.motivation) {
             atomList.push({ type: 'Motivation', content_en: atoms.motivation, content_cn: atoms.motivation_cn || '' });
             atomList.push({ type: 'Idea', content_en: atoms.idea, content_cn: atoms.idea_cn || '' });
             atomList.push({ type: 'Method', content_en: atoms.method, content_cn: atoms.method_cn || '' });
        }

        const atomInserts = atomList.map((a: any) => ({
             paper_id: paperData.id, 
             type: a.type, 
             content_en: a.content_en, 
             content_cn: a.content_cn 
        }));
        
        await supabaseAdmin.from("research_atoms").insert(atomInserts);
      });
      
      return { success: true, arxiv_id };
  }
);
export const ingestPapers = inngest.createFunction(
  { id: "ingest-papers" },
  [{ cron: "0 0 * * *" }, { event: "crawler/trigger-manual" }],
  async ({ step, event }) => {
    const papers = await step.run("fetch-arxiv-daily", async () => {
      let query = 'cat:cs.AI';
      let maxResults = 5;

      // Check manual event
      if (event.name === "crawler/trigger-manual" && event.data) {
          if (event.data.query) query = event.data.query;
          if (event.data.max) maxResults = event.data.max;
          console.log(`Manual trigger: ${query}, max: ${maxResults}`);
      } else {
          // Check DB settings for Cron
          const { data: settings } = await supabaseAdmin
              .from('crawler_settings')
              .select('value')
              .eq('key', 'daily_crawl')
              .single();
          
          if (settings?.value) {
              if (settings.value.enabled === false) {
                  console.log("Daily crawl disabled by config.");
                  return [];
              }
              if (settings.value.query) query = settings.value.query;
              if (settings.value.max_results) maxResults = settings.value.max_results;
          }
      }

      console.log(`Fetching ${maxResults} papers from Arxiv (${query})...`);
      const response = await axios.get('http://export.arxiv.org/api/query', {
        params: {
            search_query: query,
            start: 0,
            max_results: maxResults,
            sortBy: 'submittedDate',
            sortOrder: 'descending'
        }
      });
      
      const parsed = parser.parse(response.data);
      const entries = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
      
      // Handle empty result
      if (!entries || entries.length === 0 || !entries[0]) return [];

      return entries.map((entry: any) => {
          const arxivId = entry.id.split('/abs/')[1];
          const pdfLink = Array.isArray(entry.link) 
            ? entry.link.find((l: any) => l['@_title'] === 'pdf' || l['@_type'] === 'application/pdf') 
            : null;
            
          return {
              arxiv_id: arxivId,
              title: entry.title.replace(/\n/g, ' ').trim(),
              pdf_url: pdfLink ? pdfLink['@_href'] : `http://arxiv.org/pdf/${arxivId}.pdf`,
              summary: entry.summary.replace(/\n/g, ' ').trim()
          };
      });
    });

    const results = [];

    for (const paper of papers) {
      // Step 2: Filter existing
      const exists = await step.run(`check-exists-${paper.arxiv_id}`, async () => {
        const { data } = await supabaseAdmin
          .from("papers")
          .select("id")
          .eq("arxiv_id", paper.arxiv_id)
          .single();
        return !!data;
      });

      if (exists) {
        console.log(`Paper ${paper.arxiv_id} already exists. Skipping.`);
        results.push({ arxiv_id: paper.arxiv_id, status: 'skipped' });
        continue;
      }

      // Step 3: Download & Upload (Skipped for now, using direct URL for parsing)
      // Ideally we should upload to Blob storage to avoid hotlinking Arxiv
      
      // Step 4: Parse PDF
      // Try to call local python service. If fails, fallback to summary.
      const rawText = await step.run(`parse-pdf-${paper.arxiv_id}`, async () => {
         try {
             // In local dev, we call localhost:8000
             // In prod, this should be another function or service
             const response = await axios.post('http://localhost:8000', { url: paper.pdf_url });
             return response.data.text || paper.summary;
         } catch (e) {
             console.error(`Failed to parse PDF for ${paper.arxiv_id}:`, e);
             return paper.summary; // Fallback to abstract
         }
      });
      
      // Step 5: Extract Atoms
      const atoms = await step.run(`extract-atoms-${paper.arxiv_id}`, async () => {
        const completion = await extractorLLM.chat.completions.create({
          model: AppConfig.llm.extractor.modelName || "gpt-3.5-turbo",
          messages: [
            { role: "system", content: Prompts.extractionSystem },
            { role: "user", content: `Title: ${paper.title}\n\nContent:\n${rawText.substring(0, 15000)}` } // Truncate to avoid context limit
          ],
          response_format: { type: "json_object" }
        });
        
        const content = completion.choices[0].message.content;
        return JSON.parse(content || "{}");
      });

      // Step 6: Save to DB
      await step.run(`save-db-${paper.arxiv_id}`, async () => {
        // Insert Paper
        const { data: paperData, error: pError } = await supabaseAdmin
            .from("papers")
            .insert({
                arxiv_id: paper.arxiv_id,
                title: paper.title,
                pdf_url: paper.pdf_url,
                raw_text_summary: rawText.substring(0, 50000), // Postgres text limit safety
                is_processed: true
            })
            .select()
            .single();
            
        if (pError) throw pError;

        if (!paperData) throw new Error("Failed to insert paper");

        // Insert Atoms
        const atomList = atoms.atoms || [];
        // Fallback for flat structure if model hallucinates
        if (atomList.length === 0 && atoms.motivation) {
             atomList.push({ type: 'Motivation', content_en: atoms.motivation, content_cn: atoms.motivation_cn || '' });
             atomList.push({ type: 'Idea', content_en: atoms.idea, content_cn: atoms.idea_cn || '' });
             atomList.push({ type: 'Method', content_en: atoms.method, content_cn: atoms.method_cn || '' });
        }

        const atomInserts = atomList.map((a: any) => ({
             paper_id: paperData.id, 
             type: a.type, 
             content_en: a.content_en, 
             content_cn: a.content_cn 
        }));
        
        const { error: aError } = await supabaseAdmin
            .from("research_atoms")
            .insert(atomInserts);
            
        if (aError) throw aError;
        
        // Auto-add to "All Users" (Global Library Concept)
        // Since we don't have a specific global library table separate from research_atoms, 
        // research_atoms IS the global library.
        // Users can search it via useAtomSearch (which queries research_atoms).
      });
      
      results.push({ arxiv_id: paper.arxiv_id, status: 'processed' });
    }
    
    return { success: true, count: papers.length, results };
  }
);
