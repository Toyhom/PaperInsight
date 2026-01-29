import { supabaseAdmin } from '../api/lib/supabase-admin.js';
import { Prompts } from '../api/lib/prompts.js';
import { AppConfig } from '../api/lib/config.js';
import OpenAI from "openai";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

// 1. Setup
const extractorLLM = new OpenAI({
  apiKey: AppConfig.llm.extractor.apiKey,
  baseURL: AppConfig.llm.extractor.baseUrl,
});

const parser = new XMLParser();
const QUERY = 'cat:cs.CV'; // Use CV for variety
const MAX_RESULTS = 10;

async function runSeeder() {
    console.log(`🔍 1. Fetching ${MAX_RESULTS} papers from Arxiv (${QUERY})...`);
    
    // 2. Fetch from Arxiv
    const response = await axios.get('http://export.arxiv.org/api/query', {
        params: {
            search_query: QUERY,
            start: 0,
            max_results: MAX_RESULTS,
            sortBy: 'submittedDate',
            sortOrder: 'descending'
        }
    });
    
    const parsed = parser.parse(response.data);
    const entries = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
    
    if (!entries || entries.length === 0) {
        console.error("❌ No papers found!");
        return;
    }

    console.log(`✅ Found ${entries.length} papers. Starting processing...`);

    for (const [i, entry] of entries.entries()) {
        const arxivId = entry.id.split('/abs/')[1];
        const title = entry.title.replace(/\n/g, ' ').trim();
        
        let pdfUrl = `http://arxiv.org/pdf/${arxivId}.pdf`;
        if (entry.link && Array.isArray(entry.link)) {
             const pdfLink = entry.link.find((l: any) => l['@_title'] === 'pdf' || l['@_type'] === 'application/pdf');
             if (pdfLink) pdfUrl = pdfLink['@_href'];
        } else if (entry.link && entry.link['@_href']) {
             // Single link case
             if (entry.link['@_type'] === 'application/pdf') pdfUrl = entry.link['@_href'];
        }
        
        console.log(`\n📄 [${i+1}/${entries.length}] Processing: ${title.substring(0, 50)}...`);

        // 3. Check if exists
        const { data: existing } = await supabaseAdmin.from("papers").select("id").eq("arxiv_id", arxivId).single();
        if (existing) {
            console.log("   ⚠️ Already exists. Skipping.");
            continue;
        }

        // 4. Parse PDF (Local Python Service)
        let rawText = "";
        try {
            console.log("   ⬇️  Downloading & Parsing PDF...");
            // Note: Assuming python service is running on localhost:8000
            const pdfRes = await axios.post('http://localhost:8000', { url: pdfUrl });
            rawText = pdfRes.data.text;
            console.log(`   ✅ Extracted ${rawText.length} chars.`);
        } catch (e) {
            console.error("   ❌ PDF Parse Failed. Using Summary fallback.");
            rawText = entry.summary.replace(/\n/g, ' ').trim();
        }

        // 5. LLM Extraction
        console.log("   🧠 Extracting Atoms with LLM...");
        let atoms: any = {};
        try {
            const completion = await extractorLLM.chat.completions.create({
                model: AppConfig.llm.extractor.modelName || "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: Prompts.extractionSystem },
                    { role: "user", content: `Title: ${title}\n\nContent:\n${rawText.substring(0, 15000)}` }
                ],
                response_format: { type: "json_object" }
            });
            const content = completion.choices[0].message.content;
            atoms = JSON.parse(content || "{}");
        } catch (e) {
            console.error("   ❌ LLM Failed:", e);
            continue;
        }

        // 6. Save to DB
        console.log("   💾 Saving to Database...");
        
        // Insert Paper
        const { data: paperData, error: pError } = await supabaseAdmin
            .from("papers")
            .insert({
                arxiv_id: arxivId,
                title: title,
                pdf_url: pdfUrl,
                raw_text_summary: rawText.substring(0, 50000),
                is_processed: true
            })
            .select()
            .single();

        if (pError) {
            console.error("   ❌ DB Error (Paper):", pError.message);
            continue;
        }

        // Normalize Atoms
        const atomList = atoms.atoms || [];
        if (atomList.length === 0 && atoms.motivation) {
             atomList.push({ type: 'Motivation', content_en: atoms.motivation, content_cn: atoms.motivation_cn || '' });
             atomList.push({ type: 'Idea', content_en: atoms.idea, content_cn: atoms.idea_cn || '' });
             atomList.push({ type: 'Method', content_en: atoms.method, content_cn: atoms.method_cn || '' });
        }

        if (atomList.length > 0) {
            const atomInserts = atomList.map((a: any) => ({
                paper_id: paperData.id, 
                type: a.type, 
                content_en: a.content_en, 
                content_cn: a.content_cn 
            }));
            
            const { error: aError } = await supabaseAdmin.from("research_atoms").insert(atomInserts);
            if (aError) console.error("   ❌ DB Error (Atoms):", aError.message);
            else console.log(`   ✅ Saved ${atomList.length} atoms.`);
        } else {
            console.warn("   ⚠️ No atoms extracted.");
        }
    }
    
    console.log("\n🎉 Seeding Completed!");
}

runSeeder();
