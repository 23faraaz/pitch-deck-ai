const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// POST /template/update - Update template configuration
router.post('/update', async (req, res) => {
    try {
        const { json_prompt } = req.body;
        
        // Validation: Check if json_prompt.system and json_prompt.user exist
        if (!json_prompt) {
            return res.status(400).json({
                error: 'Validation Failed',
                message: 'json_prompt object is required'
            });
        }
        
        if (!json_prompt.system) {
            return res.status(400).json({
                error: 'Validation Failed',
                message: 'json_prompt.system is required'
            });
        }
        
        if (!json_prompt.user) {
            return res.status(400).json({
                error: 'Validation Failed',
                message: 'json_prompt.user is required'
            });
        }
        
        // Add timestamp
        const updatedTemplate = {
            ...json_prompt,
            last_modified: new Date().toISOString()
        };
        
        // Define template file path
        const templatePath = path.join(__dirname, '..', '..', 'ai', 'template.json');
        
        try {
            // Write to file with proper encoding
            fs.writeFileSync(templatePath, JSON.stringify(updatedTemplate, null, 2), 'utf-8');
            
            res.json({
                success: true,
                message: 'Template updated successfully',
                last_modified: updatedTemplate.last_modified
            });
            
        } catch (writeError) {
            // Handle permission errors
            if (writeError.code === 'EACCES' || writeError.code === 'EPERM') {
                console.error('Permission error writing template:', writeError);
                
                // Try to fix permissions on the ai directory
                try {
                    const aiDir = path.join(__dirname, '..', '..', 'ai');
                    // On Windows, we'll try to ensure the directory is writable
                    if (process.platform !== 'win32') {
                        fs.chmodSync(aiDir, 0o755);
                    }
                    
                    // Retry writing the file
                    fs.writeFileSync(templatePath, JSON.stringify(updatedTemplate, null, 2), 'utf-8');
                    
                    res.json({
                        success: true,
                        message: 'Template updated successfully (after fixing permissions)',
                        last_modified: updatedTemplate.last_modified
                    });
                    
                } catch (retryError) {
                    console.error('Failed to fix permissions and write template:', retryError);
                    return res.status(500).json({
                        error: 'Permission Error',
                        message: 'Unable to write template file due to permission restrictions',
                        details: retryError.message
                    });
                }
            } else {
                console.error('Write error:', writeError);
                return res.status(500).json({
                    error: 'Write Failed',
                    message: 'Failed to update template file',
                    details: writeError.message
                });
            }
        }
        
    } catch (error) {
        console.error('Template update error:', error);
        res.status(500).json({
            error: 'Template Update Failed',
            message: error.message
        });
    }
});

// Health check for template routes (must be before /:templateId route)
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'templateRoutes',
        version: '1.2'
    });
});

// Placeholder route for template management
// This will be implemented in subsequent prompts per ADD v1.2
router.get('/', async (req, res) => {
    try {
        // TODO: Implement template listing functionality
        res.status(501).json({
            error: 'Not Implemented',
            message: 'Template listing endpoint - implementation pending',
            availableTemplates: [
                'startup-classic',
                'tech-innovation',
                'healthcare-solution',
                'fintech-platform',
                'ecommerce-venture'
            ]
        });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({
            error: 'Template Fetch Failed',
            message: error.message
        });
    }
});

router.get('/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        // TODO: Implement specific template retrieval
        res.status(501).json({
            error: 'Not Implemented',
            message: `Template retrieval for '${templateId}' - implementation pending`,
            templateId: templateId
        });
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({
            error: 'Template Fetch Failed',
            message: error.message
        });
    }
});

module.exports = router;