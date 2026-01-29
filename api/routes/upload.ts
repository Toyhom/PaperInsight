import { Router } from 'express';
import multer from 'multer';
import { inngest } from '../lib/inngest.js';
import { supabaseAdmin } from '../lib/supabase-admin.js';
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

        const filePath = req.file.path;
        const originalName = req.file.originalname;
        const fileContent = fs.readFileSync(filePath);

        // Upload to Supabase Storage
        // Bucket must be created: 'papers' (public or signed url)
        const fileName = `manual/${Date.now()}-${originalName}`;
        const { data, error } = await supabaseAdmin
            .storage
            .from('papers')
            .upload(fileName, fileContent, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            res.status(500).json({ error: 'Storage upload failed' });
            return;
        }

        // Get Public URL (assuming bucket is public for simplicity)
        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('papers')
            .getPublicUrl(fileName);

        // Trigger Inngest with URL instead of local path
        await inngest.send({
            name: "paper/process-local",
            data: {
                pdfUrl: publicUrl, // Changed from filePath
                title: originalName,
                arxiv_id: `manual-${Date.now()}` 
            }
        });

        // Cleanup local file
        fs.unlinkSync(filePath);

        res.json({ success: true, message: 'File uploaded and processing started' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload processing failed' });
    }
});

export default router;
