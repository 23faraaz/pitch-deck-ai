const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
    try {
        // Extract required fields
        let { idea, audience, tone, goal } = req.body;

        // Debug: log raw inbound body once per request for troubleshooting
        console.log('[POST /api/generate] inbound body =', req.body);

        // Normalize/trim inputs to avoid false negatives
        idea = typeof idea === 'string' ? idea.trim() : '';
        audience = typeof audience === 'string' ? audience.trim() : '';
        tone = typeof tone === 'string' ? tone.trim() : '';
        goal = typeof goal === 'string' ? goal.trim() : '';

        // Validate all required fields
        if (!idea || !audience || !tone || !goal) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields. Please provide idea, audience, tone, and goal.',
                received: {
                    idea,
                    audience,
                    tone,
                    goal
                }
            });
        }

        // Validate API key
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                status: 'error',
                message: 'Gemini API key is not configured'
            });
        }

        // Read template
        const templatePath = path.join(__dirname, '../../ai/template.json');
        if (!fs.existsSync(templatePath)) {
            console.error('Template file missing at', templatePath);
            return res.status(500).json({
                status: 'error',
                message: 'Server misconfiguration: template.json not found'
            });
        }
        const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

        // Initialize Gemini model
        // Use gemini-2.0-flash (matches user's curl quickstart)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { 
                responseMimeType: 'application/json',
                temperature: 0.7
            }
        });
        console.log('Using gemini-2.0-flash model with JSON response format');

        // Prepare prompt using template structure
        // The template uses "slides" array with "title" and "content" fields
        // We'll convert "content" to "bullets" array format for the deck structure
        const prompt = `Create a pitch deck JSON based on these inputs:

        Business Idea: ${idea}
        Target Audience: ${audience}
        Tone: ${tone}
        Goal: ${goal}
        
Return a JSON object with this exact structure:
{
  "title": "Pitch Deck Title",
  "slides": [
    {
      "id": 1,
      "title": "Slide Title",
      "bullets": ["Bullet point 1", "Bullet point 2"]
    },
    {
      "id": 2,
      "title": "Next Slide Title",
      "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
    }
  ]
}

Requirements:
- Create slides based on the template: Title, Problem, Solution, Market, Business Model, Team, Ask
- Each slide must have "id" (number), "title" (string), and "bullets" (array of strings)
- Generate relevant, compelling content for each slide based on the business idea
- Match the tone: ${tone}
- Keep bullets concise and impactful
- Return ONLY valid JSON, no markdown, no code fences, no explanatory text`;

        // Helper function for retry with exponential backoff
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Call Gemini API with retry logic for quota/rate limit errors
        let result, response, text;
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    // Exponential backoff: 2s, 4s, 8s
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`Retrying Gemini API call (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms...`);
                    await sleep(delay);
                }
                
                result = await model.generateContent(prompt);
                response = await result.response;
                text = response.text();
                
                // Log response for debugging
                console.log('Gemini response length:', text?.length);
                console.log('Gemini response preview (first 200 chars):', text?.slice(0, 200));
                lastError = null;
                break; // Success, exit retry loop
                
            } catch (apiError) {
                lastError = apiError;
                console.error(`Gemini API error (attempt ${attempt + 1}):`, apiError);
                console.error('Error details:', {
                    message: apiError?.message,
                    code: apiError?.code,
                    status: apiError?.status
                });
                
                // Don't retry for these errors
                if (apiError?.message?.includes('API_KEY')) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Invalid or missing Gemini API key. Please check your .env file.'
                    });
                }
                // Handle model not found errors
                if (apiError?.message?.includes('model') || apiError?.message?.includes('404') || apiError?.message?.includes('not found')) {
                    return res.status(400).json({
                        status: 'error',
                        message: `Model error: ${apiError.message}. The gemini-pro model may not be available with your API key, or your key may need to be enabled for Gemini API access.`,
                        suggestion: 'Please check https://makersuite.google.com/app/apikey and ensure your API key has Gemini API access enabled.'
                    });
                }
                
                // Retry for quota/rate limit errors (if not last attempt)
                const isQuotaError = apiError?.message?.includes('quota') || 
                                   apiError?.message?.includes('rate') ||
                                   apiError?.code === 429 ||
                                   apiError?.status === 429;
                
                if (isQuotaError && attempt < maxRetries) {
                    console.log('Quota/rate limit error detected, will retry...');
                    continue; // Retry
                }
                
                // If it's a quota error on last attempt, or any other error, return it
                if (isQuotaError) {
                    return res.status(429).json({
                        status: 'error',
                        message: 'Gemini API quota exceeded or rate limited. Please try again in a few minutes.',
                        retried: maxRetries
                    });
                }
                
                // Other errors on last attempt
                if (attempt === maxRetries) {
                    return res.status(500).json({
                        status: 'error',
                        message: 'Failed to call Gemini API',
                        details: apiError?.message || 'Unknown error',
                        errorType: apiError?.constructor?.name
                    });
                }
            }
        }
        
        // If we exhausted retries without success
        if (lastError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to call Gemini API after retries',
                details: lastError?.message || 'Unknown error'
            });
        }

        // Aggressively clean text: remove ALL markdown code fences and extract JSON
        // Step 1: Try to extract JSON from code blocks (handles ```json ... ```)
        const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/i);
        if (codeBlockMatch && codeBlockMatch[1]) {
            text = codeBlockMatch[1].trim();
        } else {
            // Step 2: Strip any markdown fences and surrounding text
            text = text
                // Remove everything up to and including opening fence
                .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '')
                // Remove closing fence and everything after
                .replace(/\n?\s*```[\s\S]*$/i, '')
                // Remove any remaining fence markers
                .replace(/```/g, '')
                .trim();
            
            // Step 3: Try to find JSON object in remaining text (handles explanatory text before/after)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch && jsonMatch[0]) {
                text = jsonMatch[0].trim();
            }
        }

        // Parse Gemini response to ensure valid JSON
        let deck;
        try {
            deck = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError);
            console.error('Original text length:', response.text().length);
            console.error('Cleaned text (first 300 chars):', text?.slice(0, 300));
            return res.status(500).json({
                status: 'error',
                message: 'AI response was not valid JSON',
                raw: text?.slice(0, 500)
            });
        }

        // Ensure storage directory exists.
        // When running under Electron, the main process will set process.env.ELECTRON_APP_PATH
        // so we prefer using that to determine the app-local storage location. Otherwise fall
        // back to the repository-local storage directory for server-only runs.
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
            status: 'error',
            message: 'Failed to generate deck',
            details: typeof error?.message === 'string' ? error.message : undefined
        });
    }
});

module.exports = router;