const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const router = express.Router();

// Initialize AI clients
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * Determine which API provider to use based on request and available keys
 * @param {string} requestedProvider - 'gemini' or 'openai' from request body
 * @returns {string} - 'gemini' or 'openai'
 */
function determineProvider(requestedProvider) {
    // If provider is explicitly requested, validate it's available
    if (requestedProvider) {
        const provider = requestedProvider.toLowerCase();
        if (provider === 'gemini' && genAI) {
            return 'gemini';
        }
        if (provider === 'openai' && openai) {
            return 'openai';
        }
        // If requested provider is not available, fall back to default logic
    }
    
    // Default: use Gemini if available, otherwise OpenAI
    if (genAI) {
        return 'gemini';
    }
    if (openai) {
        return 'openai';
    }
    
    // No provider available
    return null;
}

/**
 * Generate deck content using Gemini API
 * @param {string} prompt - Full prompt including system and user prompts
 * @param {number} numSlides - Number of slides to generate
 * @returns {Promise<Object>} - Parsed deck data
 */
async function generateWithGemini(prompt, numSlides) {
    if (!genAI) {
        throw new Error('Gemini API key not configured');
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log('Generating deck with Gemini 2.0 Flash API...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean and parse JSON response with improved error handling
    try {
        // Clean the response text - remove any markdown formatting
        let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Try to extract JSON object if wrapped in other text
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }
        
        return JSON.parse(cleanText);
    } catch (parseError) {
        console.error('Gemini JSON parse error:', parseError);
        console.error('Raw response length:', text.length);
        console.error('Raw response (first 500 chars):', text.substring(0, 500));
        
        // Extract error position from error message if available
        const positionMatch = parseError.message.match(/position (\d+)/);
        if (positionMatch) {
            const errorPos = parseInt(positionMatch[1], 10);
            const startPos = Math.max(0, errorPos - 100);
            const endPos = Math.min(text.length, errorPos + 100);
            console.error('Raw response (around error position):', text.substring(startPos, endPos));
        } else {
            console.error('Raw response (last 500 chars):', text.substring(Math.max(0, text.length - 500)));
        }
        
        throw new Error(`Failed to parse Gemini response as JSON: ${parseError.message}`);
    }
}

/**
 * Generate deck content using OpenAI API
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @param {number} numSlides - Number of slides to generate
 * @returns {Promise<Object>} - Parsed deck data
 */
async function generateWithOpenAI(systemPrompt, userPrompt, numSlides) {
    if (!openai) {
        throw new Error('OpenAI API key not configured');
    }
    
    console.log('Generating deck with OpenAI API...');
    
    const response = await openai.chat.completions.create({
        model: 'gpt-4', // or 'gpt-4-turbo', 'gpt-4o' if available
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        // Removed response_format - not supported by base gpt-4
        temperature: 0.7
    });
    
    const text = response.choices[0].message.content;
    
    // Clean and parse JSON response with improved error handling
    try {
        // Clean the response text - remove any markdown formatting
        let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Try to extract JSON object if wrapped in other text
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }
        
        return JSON.parse(cleanText);
    } catch (parseError) {
        console.error('OpenAI JSON parse error:', parseError);
        console.error('Raw response length:', text.length);
        console.error('Raw response (first 500 chars):', text.substring(0, 500));
        
        // Extract error position from error message if available
        const positionMatch = parseError.message.match(/position (\d+)/);
        if (positionMatch) {
            const errorPos = parseInt(positionMatch[1], 10);
            const startPos = Math.max(0, errorPos - 100);
            const endPos = Math.min(text.length, errorPos + 100);
            console.error('Raw response (around error position):', text.substring(startPos, endPos));
        } else {
            console.error('Raw response (last 500 chars):', text.substring(Math.max(0, text.length - 500)));
        }
        
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
    }
}

// POST /generateDeck - Main deck generation endpoint
router.post('/generateDeck', async (req, res) => {
    try {
        // Extract and validate required fields
        const { title, idea, audience, tone, goal, slideCount, apiProvider } = req.body;
        
        // Validate all required fields are present
        if (!title || !idea || !audience || !tone || !goal) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Missing required fields. All fields (title, idea, audience, tone, goal) are required.',
                received: { title: !!title, idea: !!idea, audience: !!audience, tone: !!tone, goal: !!goal }
            });
        }

        // Validate fields are not empty strings
        if (typeof title !== 'string' || title.trim() === '' ||
            typeof idea !== 'string' || idea.trim() === '' ||
            typeof audience !== 'string' || audience.trim() === '' ||
            typeof tone !== 'string' || tone.trim() === '' ||
            typeof goal !== 'string' || goal.trim() === '') {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'All fields must be non-empty strings.',
                received: { title, idea, audience, tone, goal }
            });
        }

        // Validate and set slide count (default to 10 if not provided)
        let numSlides = 10; // Default value
        
        if (slideCount !== undefined && slideCount !== null) {
            const parsedCount = typeof slideCount === 'string' ? parseInt(slideCount, 10) : slideCount;
            if (typeof parsedCount === 'number' && !isNaN(parsedCount) && parsedCount >= 5 && parsedCount <= 25) {
                numSlides = parsedCount;
            }
        }
        
        console.log(`Generating deck with ${numSlides} slides (received slideCount: ${slideCount}, type: ${typeof slideCount})`);

        // Read AI template
        const templatePath = path.join(__dirname, '../../ai/template.json');
        let template;
        
        try {
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            template = JSON.parse(templateContent);
        } catch (templateError) {
            console.error('Template read error:', templateError);
            return res.status(500).json({
                error: 'Template Error',
                message: 'Failed to load AI template configuration'
            });
        }
function fillTemplate(templateString, replacements) {
  return Object.entries(replacements).reduce(
    (str, [key, value]) => str.replaceAll(`{${key}}`, value),
    templateString
  );
}
const systemPrompt = template.systemPrompt;
const unifiedPrompt = `${template.systemPrompt}\n\n${userPrompt}`;

        // Build the prompt using template with dynamic slide count
        let userPrompt = fillTemplate(template.userPromptTemplate, {
            title,
            idea,
            audience,
            tone,
            goal
        });
        
           

        // Add slide count instruction
        userPrompt += `\n\nIMPORTANT: Generate exactly ${numSlides} slides for this presentation. Adapt the content structure to fit ${numSlides} slides while maintaining quality and completeness.`;
        
        if (numSlides < 10) {
            userPrompt += ` Since you're creating a shorter presentation (${numSlides} slides), focus on the most essential elements and combine related concepts where appropriate.`;
        } else if (numSlides > 10) {
            userPrompt += ` Since you're creating a longer presentation (${numSlides} slides), expand on key topics with additional detail slides, market analysis, competitive landscape, or implementation details.`;
        }

        // Determine which provider to use
        const provider = determineProvider(apiProvider);
        
        if (!provider) {
            return res.status(400).json({
                error: 'API Configuration Error',
                message: 'No API provider available. Please configure GEMINI_API_KEY or OPENAI_API_KEY in your .env file.',
                details: 'At least one API key must be set to generate decks.'
            });
        }

        // Generate deck using selected provider
        let deckData;
        try {
            if (provider === 'gemini') {
                    deckData = await generateWithGemini(unifiedPrompt, numSlides);
            } else if (provider === 'openai') {
                deckData = await generateWithOpenAI(systemPrompt, userPrompt, numSlides);
            }
        } catch (parseError) {
            console.error('AI Response Parse Error:', parseError);
            return res.status(500).json({
                error: 'AI Response Parse Error',
                message: 'Failed to parse AI response as JSON',
                details: parseError.message,
                provider: provider,
                hint: 'The AI response may contain unescaped characters. Check server logs for the raw response.'
            });
        }

        // Add metadata if not present
        if (!deckData.metadata) {
            deckData.metadata = {
                deckTitle: title.trim(),
                createdAt: new Date().toISOString(),
                totalSlides: deckData.slides ? deckData.slides.length : 0
            };
        }
        
        // Add input parameters to metadata
        deckData.metadata.inputParameters = { title, idea, audience, tone, goal, slideCount: numSlides, apiProvider: provider };
        
        // Ensure storage directory exists
        const deckStoragePath = process.env.STORAGE_PATH || path.join(__dirname, '../../storage/decks');
        if (!fs.existsSync(deckStoragePath)) {
            fs.mkdirSync(deckStoragePath, { recursive: true });
        }

        // Save deck to storage
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const deckFileName = `deck-${timestamp}.json`;
        const deckFilePath = path.join(deckStoragePath, deckFileName);

        try {
            fs.writeFileSync(deckFilePath, JSON.stringify(deckData, null, 2));
            console.log(`Deck saved to: ${deckFilePath}`);
        } catch (writeError) {
            console.error('File write error:', writeError);
            return res.status(500).json({
                error: 'File Write Error',
                message: 'Generated deck but failed to save to storage',
                details: writeError.message
            });
        }

        // Return successful response with deck data
        res.json({
            success: true,
            message: 'Pitch deck generated successfully',
            deckId: deckFileName.replace('.json', ''),
            filePath: deckFileName,
            deck: deckData
        });

    } catch (error) {
        console.error('Generate deck error:', error);
        
        // Handle OpenAI-specific errors
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            return res.status(429).json({
                error: 'Rate Limit Exceeded',
                message: 'Too many requests to AI API. Please wait a few minutes and try again.',
                retryAfter: '300', // 5 minutes
                details: 'API has daily/hourly rate limits. Please try again later.'
            });
        }
        
        if (error.status === 402 || error.status === 403 || (error.message && (error.message.includes('quota') || error.message.includes('insufficient_quota')))) {
            return res.status(403).json({
                error: 'API Quota Exceeded',
                message: 'Daily API quota exhausted. Please try again tomorrow or upgrade your API plan.',
                details: 'Check your API dashboard for quota usage.'
            });
        }
        
        if (error.status === 401 || (error.message && (error.message.includes('API key') || error.message.includes('Invalid API key') || error.message.includes('authentication')))) {
            return res.status(401).json({
                error: 'API Key Error',
                message: 'Invalid or missing API key.',
                details: 'Check your .env file for GEMINI_API_KEY or OPENAI_API_KEY configuration.'
            });
        }
        
        // Handle OpenAI API errors
        if (error.code === 'insufficient_quota' || error.code === 'rate_limit_exceeded') {
            return res.status(403).json({
                error: 'API Error',
                message: error.message || 'API quota or rate limit exceeded',
                details: 'Please check your OpenAI account billing and usage limits.'
            });
        }
        
        // Generic error
        res.status(500).json({
            error: 'Generation Failed',
            message: error.message || 'Unknown error occurred during deck generation',
            details: 'Please try again or contact support if the issue persists.'
        });
    }
});

// Health check for generate routes
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'generateDeck',
        version: '1.2'
    });
});

module.exports = router;