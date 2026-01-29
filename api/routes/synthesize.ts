import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { AppConfig } from '../lib/config.js';
import { Prompts } from '../lib/prompts.js';
import OpenAI from 'openai';

const router = Router();

const synthesizerLLM = new OpenAI({
  apiKey: AppConfig.llm.synthesizer.apiKey,
  baseURL: AppConfig.llm.synthesizer.baseUrl,
});

router.post('/', async (req, res) => {
    try {
        const { atomIds, userId } = req.body; // Expect userId from client for now if not using middleware
        
        if (!atomIds || !Array.isArray(atomIds)) {
            return res.status(400).json({ error: 'Invalid atomIds' });
        }

        // Fetch atoms
        const { data: atoms, error } = await supabaseAdmin
            .from('research_atoms')
            .select('*, papers(title, arxiv_id)')
            .in('id', atomIds);

        if (error || !atoms) {
            console.error('Fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch atoms' });
        }

        // Validation
        const hasMotivation = atoms.some(a => a.type === 'Motivation');
        const hasIdea = atoms.some(a => a.type === 'Idea');
        const hasMethod = atoms.some(a => a.type === 'Method');

        if (!hasMotivation || !hasIdea || !hasMethod) {
            return res.status(400).json({ 
                error: 'Missing required atoms. Need at least 1 Motivation, 1 Idea, and 1 Method.' 
            });
        }

        // Check User Limits
        if (userId && userId !== '00000000-0000-0000-0000-000000000000') {
            const { data: profile, error: pError } = await supabaseAdmin
                .from('profiles')
                .select('synthesis_count, synthesis_limit')
                .eq('id', userId)
                .single();
            
            if (pError && pError.code !== 'PGRST116') {
                console.error('Profile fetch error:', pError);
                // Fail open or closed? Let's fail open for now but log it
            }

            if (profile) {
                if (profile.synthesis_count >= profile.synthesis_limit) {
                    return res.status(403).json({ 
                        error: `Daily limit reached (${profile.synthesis_count}/${profile.synthesis_limit}). Please upgrade your plan.` 
                    });
                }
            }
        }

        // Prepare prompt
        const motivationText = atoms.filter(a => a.type === 'Motivation').map(a => `[Motivation] ${a.content_en} (Source: ${a.papers?.title})`).join('\n');
        const ideaText = atoms.filter(a => a.type === 'Idea').map(a => `[Idea] ${a.content_en} (Source: ${a.papers?.title})`).join('\n');
        const methodText = atoms.filter(a => a.type === 'Method').map(a => `[Method] ${a.content_en} (Source: ${a.papers?.title})`).join('\n');

        const inputAtoms = `${motivationText}\n${ideaText}\n${methodText}`;

        // Call LLM
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await synthesizerLLM.chat.completions.create({
            model: AppConfig.llm.synthesizer.modelName || 'gpt-4',
            messages: [
                { role: 'system', content: Prompts.synthesisSystem },
                { role: 'user', content: `**[Input Atoms]**\n${inputAtoms}\n\n**[Output Synthesis]**` }
            ],
            stream: true,
        });

        let fullContent = "";

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                fullContent += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }
        
        res.write(`data: [DONE]\n\n`);
        res.end();

        // Save report to DB asynchronously
        if (userId && userId !== '00000000-0000-0000-0000-000000000000') {
            await supabaseAdmin.from('synthesis_reports').insert({
                user_id: userId,
                input_atoms: atomIds,
                result_markdown: fullContent
            });

            // Increment usage count
            // Note: This is not atomic with the check above, but good enough for soft limits
            await supabaseAdmin.rpc('increment_synthesis_count', { user_id: userId });
        }
        
    } catch (e) {
        console.error(e);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.end();
        }
    }
});

export default router;
