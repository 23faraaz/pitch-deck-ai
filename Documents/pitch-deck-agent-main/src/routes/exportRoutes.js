const express = require('express');
const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const router = express.Router();

// Helper function to load deck data
async function loadDeck(deckId) {
    const deckStoragePath = process.env.STORAGE_PATH || path.join(__dirname, '../../storage/decks');
    const deckFileName = `${deckId}.json`;
    const deckFilePath = path.join(deckStoragePath, deckFileName);

    if (!fs.existsSync(deckFilePath)) {
        throw new Error('Deck not found');
    }

    const deckContent = fs.readFileSync(deckFilePath, 'utf8');
    const deckData = JSON.parse(deckContent);
    return deckData;
}



// POST /export/pptx - Redirect to browser presentation
router.post('/pptx', async (req, res) => {
    try {
        const { deckId } = req.body;
        
        if (!deckId) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'deckId is required'
            });
        }

        // Return success with presentation URL
        res.json({
            success: true,
            message: 'Opening presentation in browser...',
            presentationUrl: `/api/export/presentation/${deckId}`
        });

    } catch (error) {
        console.error('Presentation redirect error:', error);
        res.status(500).json({
            error: 'Export Failed',
            message: error.message
        });
    }
});

// POST /export/pdf - Export deck as PDF document
router.post('/pdf', async (req, res) => {
    try {
        const { deckId } = req.body;
        
        if (!deckId) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'deckId is required'
            });
        }

        // Load and validate deck
        const deckData = await loadDeck(deckId);
        
        if (!deckData.slides || !Array.isArray(deckData.slides)) {
            return res.status(400).json({
                error: 'Invalid Deck',
                message: 'Deck must contain slides array'
            });
        }

        // Create PDF document
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        // Add slides as PDF pages
        for (const slideData of deckData.slides) {
            const page = pdfDoc.addPage([612, 792]); // Letter size
            const { width, height } = page.getSize();
            
            let yPosition = height - 80;
            
            // Add title
            if (slideData.title) {
                page.drawText(slideData.title, {
                    x: 50,
                    y: yPosition,
                    size: 20,
                    font: helveticaBold,
                    color: rgb(0, 0, 0)
                });
                yPosition -= 50;
            }
            
            // Add content
            if (slideData.content) {
                if (Array.isArray(slideData.content)) {
                    for (const item of slideData.content) {
                        if (item && item.trim() && yPosition > 50) {
                            page.drawText(`• ${item}`, {
                                x: 70,
                                y: yPosition,
                                size: 12,
                                font: helveticaFont,
                                color: rgb(0, 0, 0)
                            });
                            yPosition -= 20;
                        }
                    }
                } else if (typeof slideData.content === 'string' && slideData.content.trim()) {
                    const lines = slideData.content.trim().split('\n');
                    for (const line of lines) {
                        if (line.trim() && yPosition > 50) {
                            page.drawText(line.trim(), {
                                x: 50,
                                y: yPosition,
                                size: 12,
                                font: helveticaFont,
                                color: rgb(0, 0, 0)
                            });
                            yPosition -= 20;
                        }
                    }
                }
            }
        }
        
        // Generate PDF bytes
        const pdfBytes = await pdfDoc.save();
        
        // Generate filename
        const cleanTitle = (deckData.metadata?.deckTitle || 'pitch-deck')
            .replace(/[^a-zA-Z0-9\s-_]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
        const filename = `${cleanTitle}.pdf`;
        
        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Export PDF error:', error);
        res.status(500).json({
            error: 'Export Failed',
            message: error.message
        });
    }
});

// POST /export/generate-pptx - Generate actual PowerPoint file
router.post('/generate-pptx', async (req, res) => {
    try {
        const { deckId, slides } = req.body;
        
        if (!deckId && !slides) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Either deckId or slides data is required'
            });
        }

        let deckData;
        if (deckId) {
            // Load deck from storage
            deckData = await loadDeck(deckId);
        } else {
            // Use provided slides data
            deckData = { slides, metadata: { deckTitle: 'Pitch Deck' } };
        }
        
        if (!deckData.slides || !Array.isArray(deckData.slides)) {
            return res.status(400).json({
                error: 'Invalid Deck',
                message: 'Deck must contain slides array'
            });
        }

        console.log(`Generating PowerPoint for deck with ${deckData.slides.length} slides`);

        // Create PowerPoint presentation using PptxGenJS
        const pptx = new PptxGenJS();
        
        // Set presentation properties
        pptx.author = 'Pitch Deck Generator';
        pptx.company = 'Pitch Deck Agent';
        pptx.subject = deckData.metadata?.deckTitle || 'Pitch Deck';
        pptx.title = deckData.metadata?.deckTitle || 'Pitch Deck';

        // Add slides to presentation
        for (let i = 0; i < deckData.slides.length; i++) {
            const slideData = deckData.slides[i];
            const slide = pptx.addSlide();
            
            // Set slide layout and background
            slide.background = { fill: 'FFFFFF' };
            
            // Add slide number in bottom right
            slide.addText(`${i + 1}`, {
                x: 9.0,
                y: 6.8,
                w: 1.0,
                h: 0.3,
                fontSize: 12,
                color: '666666',
                align: 'right'
            });
            
            // Add title if exists
            if (slideData.title) {
                slide.addText(slideData.title, {
                    x: 0.5,
                    y: 0.5,
                    w: 9.0,
                    h: 1.2,
                    fontSize: 28,
                    bold: true,
                    color: '1f2937',
                    align: 'left',
                    valign: 'top',
                    wrap: true
                });
            }
            
            // Add content
            let contentY = slideData.title ? 2.0 : 1.0;
            
            if (slideData.content) {
                if (Array.isArray(slideData.content)) {
                    // Handle bullet points
                    for (let j = 0; j < slideData.content.length; j++) {
                        const item = slideData.content[j];
                        if (item && item.trim()) {
                            slide.addText(`• ${item}`, {
                                x: 0.7,
                                y: contentY + (j * 0.4),
                                w: 8.5,
                                h: 0.4,
                                fontSize: 16,
                                color: '374151',
                                align: 'left',
                                wrap: true
                            });
                        }
                    }
                } else if (typeof slideData.content === 'string') {
                    // Handle text content
                    const lines = slideData.content.split('\n').filter(line => line.trim());
                    
                    for (let j = 0; j < lines.length; j++) {
                        slide.addText(lines[j], {
                            x: 0.5,
                            y: contentY + (j * 0.3),
                            w: 9.0,
                            h: 0.3,
                            fontSize: 14,
                            color: '374151',
                            align: 'left',
                            wrap: true
                        });
                    }
                }
            }
            
            // Add speaker notes if available
            if (slideData.speakerNotes) {
                slide.addNotes(slideData.speakerNotes);
            }
        }
        
        // Generate PowerPoint file
        const pptxBuffer = await pptx.write('nodebuffer');
        
        // Generate filename
        const cleanTitle = (deckData.metadata?.deckTitle || 'pitch-deck')
            .replace(/[^a-zA-Z0-9\s-_]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
        const filename = `${cleanTitle}.pptx`;
        
        console.log(`Generated PowerPoint file: ${filename} (${pptxBuffer.length} bytes)`);
        
        // Send PowerPoint file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pptxBuffer.length);
        res.send(pptxBuffer);

    } catch (error) {
        console.error('PowerPoint generation error:', error);
        res.status(500).json({
            error: 'Export Failed',
            message: `Failed to generate PowerPoint: ${error.message}`
        });
    }
});

// POST /export/generate-html - Generate HTML presentation (Google Slides compatible)
router.post('/generate-html', async (req, res) => {
    try {
        const { deckId, slides } = req.body;
        
        if (!deckId && !slides) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Either deckId or slides data is required'
            });
        }

        let deckData;
        if (deckId) {
            deckData = await loadDeck(deckId);
        } else {
            deckData = { slides, metadata: { deckTitle: 'Pitch Deck' } };
        }
        
        if (!deckData.slides || !Array.isArray(deckData.slides)) {
            return res.status(400).json({
                error: 'Invalid Deck',
                message: 'Deck must contain slides array'
            });
        }

        console.log(`Generating HTML presentation for deck with ${deckData.slides.length} slides`);

        // Generate HTML presentation
        let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${deckData.metadata?.deckTitle || 'Pitch Deck'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .slide { 
            width: 800px; 
            height: 600px; 
            background: white; 
            margin: 20px auto; 
            padding: 40px; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
            page-break-after: always; 
            box-sizing: border-box;
        }
        .slide-title { 
            font-size: 32px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 10px;
        }
        .slide-content { 
            font-size: 18px; 
            line-height: 1.6; 
            color: #374151; 
        }
        .slide-content ul { 
            list-style-type: disc; 
            padding-left: 20px; 
        }
        .slide-content li { 
            margin: 10px 0; 
        }
        .slide-number { 
            position: absolute; 
            bottom: 20px; 
            right: 20px; 
            color: #9ca3af; 
            font-size: 14px; 
        }
        @media print { 
            body { background: white; } 
            .slide { box-shadow: none; margin: 0; } 
        }
    </style>
</head>
<body>
    <h1 style="text-align: center; color: #1f2937; margin-bottom: 40px;">${deckData.metadata?.deckTitle || 'Pitch Deck'}</h1>
`;

        // Add slides to HTML
        for (let i = 0; i < deckData.slides.length; i++) {
            const slideData = deckData.slides[i];
            
            htmlContent += `
    <div class="slide">
        <div class="slide-number">${i + 1}</div>`;
            
            if (slideData.title) {
                htmlContent += `
        <div class="slide-title">${slideData.title}</div>`;
            }
            
            htmlContent += `
        <div class="slide-content">`;
            
            if (slideData.content) {
                if (Array.isArray(slideData.content)) {
                    htmlContent += `
            <ul>`;
                    slideData.content.forEach(item => {
                        if (item && item.trim()) {
                            htmlContent += `
                <li>${item}</li>`;
                        }
                    });
                    htmlContent += `
            </ul>`;
                } else if (typeof slideData.content === 'string') {
                    const lines = slideData.content.split('\n').filter(line => line.trim());
                    lines.forEach(line => {
                        htmlContent += `
            <p>${line}</p>`;
                    });
                }
            }
            
            htmlContent += `
        </div>
    </div>`;
        }
        
        htmlContent += `
</body>
</html>`;
        
        // Generate filename
        const cleanTitle = (deckData.metadata?.deckTitle || 'pitch-deck')
            .replace(/[^a-zA-Z0-9\s-_]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
        const filename = `${cleanTitle}.html`;
        
        console.log(`Generated HTML presentation: ${filename}`);
        
        // Send HTML file
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(htmlContent);

    } catch (error) {
        console.error('HTML generation error:', error);
        res.status(500).json({
            error: 'Export Failed',
            message: `Failed to generate HTML presentation: ${error.message}`
        });
    }
});

// POST /export/generate-compatible - Generate more compatible PowerPoint file
router.post('/generate-compatible', async (req, res) => {
    try {
        const { deckId, slides } = req.body;
        
        if (!deckId && !slides) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Either deckId or slides data is required'
            });
        }

        let deckData;
        if (deckId) {
            deckData = await loadDeck(deckId);
        } else {
            deckData = { slides, metadata: { deckTitle: 'Pitch Deck' } };
        }
        
        if (!deckData.slides || !Array.isArray(deckData.slides)) {
            return res.status(400).json({
                error: 'Invalid Deck',
                message: 'Deck must contain slides array'
            });
        }

        console.log(`Generating compatible PowerPoint for deck with ${deckData.slides.length} slides`);

        // Create PowerPoint with more conservative settings for better compatibility
        const pptx = new PptxGenJS();
        
        // Set basic presentation properties
        pptx.author = 'Pitch Deck Generator';
        pptx.company = 'Pitch Deck Agent';
        pptx.subject = deckData.metadata?.deckTitle || 'Pitch Deck';
        pptx.title = deckData.metadata?.deckTitle || 'Pitch Deck';

        // Use standard slide size (4:3 ratio for better compatibility)
        pptx.defineLayout({ name: 'LAYOUT_4x3', width: 10, height: 7.5 });

        // Add slides with simpler formatting
        for (let i = 0; i < deckData.slides.length; i++) {
            const slideData = deckData.slides[i];
            const slide = pptx.addSlide({ masterName: 'LAYOUT_4x3' });
            
            // Simple white background
            slide.background = { fill: 'FFFFFF' };
            
            // Add slide number
            slide.addText(`${i + 1}`, {
                x: 8.5,
                y: 6.8,
                w: 1.0,
                h: 0.5,
                fontSize: 14,
                color: '999999',
                align: 'center'
            });
            
            // Add title with simpler formatting
            if (slideData.title) {
                slide.addText(slideData.title, {
                    x: 0.5,
                    y: 0.5,
                    w: 9.0,
                    h: 1.5,
                    fontSize: 24,
                    bold: true,
                    color: '000000',
                    align: 'left',
                    valign: 'middle'
                });
            }
            
            // Add content with conservative formatting
            if (slideData.content) {
                let contentY = slideData.title ? 2.2 : 1.0;
                
                if (Array.isArray(slideData.content)) {
                    // Simple bullet points
                    const bulletText = slideData.content
                        .filter(item => item && item.trim())
                        .map(item => `• ${item}`)
                        .join('\n');
                    
                    if (bulletText) {
                        slide.addText(bulletText, {
                            x: 0.7,
                            y: contentY,
                            w: 8.5,
                            h: 4.5,
                            fontSize: 16,
                            color: '333333',
                            align: 'left',
                            valign: 'top'
                        });
                    }
                } else if (typeof slideData.content === 'string') {
                    slide.addText(slideData.content, {
                        x: 0.5,
                        y: contentY,
                        w: 9.0,
                        h: 4.5,
                        fontSize: 14,
                        color: '333333',
                        align: 'left',
                        valign: 'top'
                    });
                }
            }
        }
        
        // Generate PowerPoint file
        const pptxBuffer = await pptx.write('nodebuffer');
        
        // Generate filename
        const cleanTitle = (deckData.metadata?.deckTitle || 'pitch-deck')
            .replace(/[^a-zA-Z0-9\s-_]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
        const filename = `${cleanTitle}-compatible.pptx`;
        
        console.log(`Generated compatible PowerPoint file: ${filename} (${pptxBuffer.length} bytes)`);
        
        // Send PowerPoint file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pptxBuffer.length);
        res.send(pptxBuffer);

    } catch (error) {
        console.error('Compatible PowerPoint generation error:', error);
        res.status(500).json({
            error: 'Export Failed',
            message: `Failed to generate compatible PowerPoint: ${error.message}`
        });
    }
});

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'exportRoutes',
        version: '1.3'
    });
});

module.exports = router;