const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const PPTXGenJS = require('pptxgenjs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generateDeck', async (req, res) => {
    try {
        // Extract required fields
        const { idea, audience, tone, goal } = req.body;

        // Validate all required fields
        if (!idea || !audience || !tone || !goal) {
            return res.status(400).json({
                error: 'Missing required fields. Please provide idea, audience, tone, and goal.'
            });
        }

        // Read template
        const templatePath = path.join(__dirname, '../../ai/template.json');
        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Prepare prompt using template
        const prompt = `Create a pitch deck based on the following:
        Business Idea: ${idea}
        Target Audience: ${audience}
        Tone: ${tone}
        Goal: ${goal}
        
        Use this template structure: ${JSON.stringify(template)}
        
        Return only valid JSON.`;

        // Call Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse Gemini response to ensure valid JSON
        let deck;
        try {
            deck = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError);
            return res.status(500).json({
                error: 'Invalid response format from AI service'
            });
        }

        // Ensure storage directory exists.
        // Prefer Electron-provided app path when available; otherwise fall back to repo-local storage.
        const storageBase = process.env.ELECTRON_APP_PATH
            ? path.join(process.env.ELECTRON_APP_PATH, 'storage')
            : path.join(__dirname, '../../storage');
        const storageDir = path.join(storageBase, 'decks');
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        // Generate timestamp for filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `deck-${timestamp}.json`;
        const filePath = path.join(storageDir, filename);

        // Save deck to file
        fs.writeFileSync(filePath, JSON.stringify(deck, null, 2));

        // Return the generated deck
        res.json(deck);

    } catch (error) {
        console.error('Error generating deck:', error);
        res.status(500).json({
            error: 'Failed to generate deck'
        });
    }
});

// POST /pptx (mounted at /api/export, so full path is /api/export/pptx)
router.post('/pptx', async (req, res) => {
    try {
        const deckData = req.body;
        
        // Validate deck structure
        if (!deckData || !deckData.slides || !Array.isArray(deckData.slides)) {
            return res.status(400).json({ error: 'Invalid deck data. Expected deck object with slides array.' });
        }

    const pptx = new PPTXGenJS();
        pptx.layout = 'LAYOUT_WIDE';
        
        // Add title slide if title exists
        if (deckData.title) {
            const titleSlide = pptx.addSlide();
            titleSlide.addText(deckData.title, {
                x: 0.5,
                y: 2,
                w: 9,
                h: 1.5,
                fontSize: 44,
                bold: true,
                align: 'center',
                color: '363636'
            });
        }

        // Sort slides by id to ensure order
        const sortedSlides = [...deckData.slides].sort((a, b) => (a.id || 0) - (b.id || 0));

        // Add content slides
        sortedSlides.forEach((slide, idx) => {
        const slidePptx = pptx.addSlide();
            
            // Slide title
            slidePptx.addText(slide.title || `Slide ${idx + 1}`, {
                x: 0.5,
                y: 0.5,
                w: 9,
                h: 0.8,
                fontSize: 32,
                bold: true,
                color: '363636'
            });
            
            // Bullet points
            if (slide.bullets && Array.isArray(slide.bullets) && slide.bullets.length > 0) {
                const bulletText = slide.bullets.map(bullet => `• ${bullet}`).join('\n');
                slidePptx.addText(bulletText, {
                    x: 0.8,
                    y: 1.8,
                    w: 8.4,
                    h: 4,
                    fontSize: 18,
                    color: '363636',
                    bullet: { type: 'number', code: '1.' }
                });
            }
        });

        // Use writeToBuffer for Node.js environment
        const buffer = await pptx.write({ outputType: 'nodebuffer' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename="${(deckData.title || 'deck').replace(/[^a-z0-9]/gi, '_')}.pptx"`);
        res.send(buffer);
    } catch (error) {
        console.error('PPTX export error:', error);
        res.status(500).json({ error: 'Failed to generate PPTX', details: error.message });
    }
});

// POST /pdf (mounted at /api/export, so full path is /api/export/pdf)
router.post('/pdf', async (req, res) => {
    try {
        const deckData = req.body;
        
        // Validate deck structure
        if (!deckData || !deckData.slides || !Array.isArray(deckData.slides)) {
            return res.status(400).json({ error: 'Invalid deck data. Expected deck object with slides array.' });
        }

    const pdfDoc = await PDFDocument.create();
        const width = 595.28; // A4 width in points
        const height = 841.89; // A4 height in points
        const margin = 50;
        const lineHeight = 18;
        
        // Embed fonts once
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Sort slides by id to ensure order
        const sortedSlides = [...deckData.slides].sort((a, b) => (a.id || 0) - (b.id || 0));

        // Add title page if title exists
        if (deckData.title) {
            const titlePage = pdfDoc.addPage();
            titlePage.drawText(deckData.title, {
                x: margin,
                y: height - margin - 60,
                size: 36,
                font: boldFont
            });
        }

        // Add content slides
        sortedSlides.forEach((slide) => {
            let page = pdfDoc.addPage();
            let yPos = height - margin - 60;
            
            // Slide title
            const title = slide.title || 'Untitled Slide';
            page.drawText(title, {
                x: margin,
                y: yPos,
                size: 24,
                font: boldFont
            });
            
            yPos -= 50;
            
            // Bullet points (simplified - one bullet per line)
            if (slide.bullets && Array.isArray(slide.bullets) && slide.bullets.length > 0) {
                slide.bullets.forEach((bullet) => {
                    // Check if we need a new page
                    if (yPos < margin + 60) {
                        page = pdfDoc.addPage();
                        yPos = height - margin - 60;
                    }
                    
                    // Draw bullet point (simple version)
                    const bulletText = `• ${bullet}`;
                    page.drawText(bulletText, {
                        x: margin + 20,
                        y: yPos,
                        size: 14,
                        font: regularFont,
                        maxWidth: width - (margin * 2) - 40
                    });
                    yPos -= lineHeight + 8;
                });
            }
    });

        const pdfBytes = await pdfDoc.save();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${(deckData.title || 'deck').replace(/[^a-z0-9]/gi, '_')}.pdf"`);
        res.end(Buffer.from(pdfBytes), 'binary');
    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
});

module.exports = router;