const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// POST /template/update
router.post('/template/update', (req, res) => {
    try {
        const { json_prompt } = req.body;

        if (!json_prompt || typeof json_prompt !== 'object') {
            return res.status(400).json({ error: 'Missing json_prompt object in request body' });
        }

        // Validation: require system and user
        if (!json_prompt.system || !json_prompt.user) {
            return res.status(400).json({ error: 'json_prompt.system and json_prompt.user are required' });
        }

        const aiDir = path.join(__dirname, '../../ai');
        const templatePath = path.join(aiDir, 'template.json');

        // Add last_modified timestamp
        const templateToSave = {
            ...json_prompt,
            last_modified: new Date().toISOString()
        };

        // Ensure ai directory exists
        if (!fs.existsSync(aiDir)) {
            fs.mkdirSync(aiDir, { recursive: true });
        }

        // Attempt to write file with utf-8 encoding and pretty JSON
        try {
            fs.writeFileSync(templatePath, JSON.stringify(templateToSave, null, 2), 'utf-8');
        } catch (writeErr) {
            // If write failed due to permissions, try to fix ai directory permissions and retry
            console.error('Initial write failed:', writeErr);
            try {
                // Change permissions on ai directory to 755 and retry
                fs.chmodSync(aiDir, 0o755);
                fs.writeFileSync(templatePath, JSON.stringify(templateToSave, null, 2), 'utf-8');
            } catch (retryErr) {
                console.error('Retry write after chmod failed:', retryErr);
                return res.status(500).json({ error: 'Failed to write template file', details: retryErr.message });
            }
        }

        return res.json({ message: 'Template updated', last_modified: templateToSave.last_modified });

    } catch (err) {
        console.error('Error in /template/update:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
