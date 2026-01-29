import { Router } from 'express';
import multer from 'multer';
import { inngest } from '../lib/inngest.js';
import path from 'path';
import fs from 'fs';

// Force restart
const router = Router();

// Configure multer for disk storage temporarily
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
             res.status(400).json({ error: 'No file uploaded' });
             return;
        }

        const filePath = path.resolve(req.file.path);
        const originalName = req.file.originalname;

        // In a real production app, we should upload this file to S3/Supabase Storage
        // For this local prototype, we'll pass the local path to the Inngest function
        // OR read it here. 
        
        // Since Inngest runs asynchronously, passing a local temp path is risky if the worker is separate.
        // But here we are all local.
        
        // Better approach: Trigger an event with the file info, 
        // and let the Inngest function handle the "parsing" (which calls the python service).
        
        // NOTE: The python service expects a URL. 
        // If we want to support local files, we might need to modify the python service 
        // OR make the python service read from a shared volume 
        // OR (simplest for now) expose this file via a temporary static route.
        
        // Let's go with the "Static Route" approach for simplicity.
        // We need to move the file to a public folder? No, let's just use the absolute path
        // and update the python service to handle local paths if it starts with 'file://' 
        // or just 'c:/...'
        
        // Wait, the python service is `api/parse-pdf.py`. Let's check it.
        // It uses `requests.get(url)`. It won't work with local files easily unless we mock it.
        
        // ALTERNATIVE: Upload to Supabase Storage first.
        // That is the "Correct" way.
        
        // Let's skip complex storage for now and cheat:
        // We will trigger a NEW Inngest event `paper/process-local` 
        // that takes the file path, reads it, and sends the CONTENT to the LLM directly,
        // bypassing the "download PDF" step.
        
        await inngest.send({
            name: "paper/process-local",
            data: {
                filePath: filePath,
                title: originalName,
                // We generate a fake ID or hash for consistency
                arxiv_id: `manual-${Date.now()}` 
            }
        });

        res.json({ success: true, message: 'File accepted for processing' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload processing failed' });
    }
});

export default router;
