// Load .env from backend directory
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Import routes
const generateDeckRoutes = require('./src/routes/generateDeck');
const exportRoutes = require('./src/routes/exportRoutes');
const templateRoutes = require('./src/routes/templateRoutes');

// Mount routes
app.use('/api/generate', generateDeckRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/templates', templateRoutes);

// Simple health check to validate env and server status
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
        port: PORT
    });
});

// Masked key inspector to verify the backend is using the expected key
app.get('/api/health/key', (req, res) => {
    const key = process.env.GEMINI_API_KEY || '';
    const masked = key ? `${key.slice(0, 6)}...${key.slice(-4)}` : null;
    res.json({ maskedKey: masked, length: key.length });
});

// Optionally serve the built frontend (Vite build) when requested by the Electron
// main process. The Electron main will set SERVE_STATIC=true to enable this behavior.
if (process.env.SERVE_STATIC === 'true') {
    const staticPath = path.join(__dirname, '../frontend/dist');
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(staticPath, 'index.html'));
    });
}

// Verify environment variables
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables');
    console.error('   Please create a .env file in the backend/ directory with:');
    console.error('   GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
}

// Validate API key format (Google API keys usually start with AIza)
if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('AIza')) {
    console.warn('⚠️  Warning: GEMINI_API_KEY does not appear to be in the expected format');
    console.warn('   Google API keys typically start with "AIza"');
}

// Set port
const PORT = process.env.PORT || 5050;

// Start server
app.listen(PORT, () => {
    console.log('Pitch Deck Agent API ready.');
    console.log(`Server is running on port ${PORT}`);
});
