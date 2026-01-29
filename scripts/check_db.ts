import { supabaseAdmin } from '../api/lib/supabase-admin.js';

async function checkDB() {
    console.log("🔍 Checking Database Content...");

    // 1. Count Papers
    const { count: paperCount, error: pError } = await supabaseAdmin
        .from('papers')
        .select('*', { count: 'exact', head: true });
    
    if (pError) console.error("❌ Error counting papers:", pError);
    else console.log(`📄 Total Papers: ${paperCount}`);

    // 2. Count Atoms
    const { count: atomCount, error: aError } = await supabaseAdmin
        .from('research_atoms')
        .select('*', { count: 'exact', head: true });

    if (aError) console.error("❌ Error counting atoms:", aError);
    else console.log(`⚛️ Total Atoms: ${atomCount}`);

    // 3. List recent atoms
    const { data: atoms, error: lError } = await supabaseAdmin
        .from('research_atoms')
        .select('id, type, content_en, created_at, papers(title)')
        .order('created_at', { ascending: false })
        .limit(5);

    if (lError) console.error("❌ Error listing atoms:", lError);
    else {
        console.log("\n🕒 Recent 5 Atoms:");
        atoms.forEach((a: any) => {
            console.log(`   - [${a.type}] ${a.content_en.substring(0, 50)}... (Paper: ${a.papers?.title?.substring(0, 30)}...)`);
        });
    }
}

checkDB();
