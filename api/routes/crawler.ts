import { Router } from 'express';
import { inngest } from '../lib/inngest.js';
import { supabaseAdmin } from '../lib/supabase-admin.js';

const router = Router();

// GET /api/crawler/settings
router.get('/settings', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('crawler_settings')
            .select('value')
            .eq('key', 'daily_crawl')
            .single();
        
        if (error) throw error;
        res.json(data?.value || { enabled: false, query: '', max_results: 5 });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// POST /api/crawler/settings
router.post('/settings', async (req, res) => {
    try {
        const settings = req.body;
        // Validate
        if (typeof settings.enabled !== 'boolean' || !settings.query) {
            return res.status(400).json({ error: 'Invalid settings' });
        }

        const { error } = await supabaseAdmin
            .from('crawler_settings')
            .upsert({ 
                key: 'daily_crawl', 
                value: settings,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
        
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// POST /api/crawler/trigger
router.post('/trigger', async (req, res) => {
    try {
        const { query, max } = req.body;
        if (!query) return res.status(400).json({ error: 'Query required' });

        await inngest.send({
            name: "crawler/trigger-manual",
            data: { query, max: max || 5 }
        });

        res.json({ success: true, message: 'Crawler triggered' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to trigger crawler' });
    }
});

export default router;
