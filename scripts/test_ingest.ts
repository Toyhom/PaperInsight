import { ingestPapers } from '../api/functions/ingest.js';

// Mock event object
const mockEvent = {
    name: "crawler/trigger-manual",
    data: {
        query: "cat:cs.AI",
        max: 3 // Small number for testing
    }
};

// Mock step object (Inngest simulation)
const mockStep = {
    run: async (name, callback) => {
        console.log(`\n🔹 [Step: ${name}] Running...`);
        const result = await callback();
        console.log(`✅ [Step: ${name}] Completed.`);
        return result;
    }
};

const runTest = async () => {
    console.log("🚀 Starting Ingest Test (Manual Trigger Simulation)...");
    
    try {
        // We need to bypass the Inngest wrapper and call the handler directly
        // The handler is the 3rd argument in createFunction
        // BUT since we can't easily unwrap it here, we will rely on the fact that
        // the function is exported. 
        // However, Inngest functions are objects. The actual handler is internal.
        
        // Alternative: Re-implement the core logic here for testing? 
        // No, that duplicates code.
        
        // Better approach: Call the actual endpoint or use the Inngest CLI.
        // But the user asked for a "single test code".
        
        // Let's create a script that calls the API endpoint directly, which then calls Inngest.
        // Wait, that requires the server to be running.
        
        // Let's write a script that imports the same logic as ingest.ts but without Inngest wrapper
        // for pure logic testing.
        // OR, just use fetch to call the local endpoint if server is up.
        
        console.log("Calling local API endpoint...");
        const response = await fetch('http://localhost:3001/api/crawler/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'cat:cs.CV', max: 2 })
        });
        
        if (response.ok) {
            console.log("✅ API Triggered Successfully.");
            console.log("Check the Inngest Dev Server (http://localhost:8288) for execution logs.");
        } else {
            console.error("❌ API Call Failed:", await response.text());
        }

    } catch (e) {
        console.error("❌ Test Failed:", e);
    }
};

runTest();
