const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Verify API keys are loaded (but don't exit if missing for development)
const hasGeminiKey = !!process.env.GEMINI_API_KEY;
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

if (!hasGeminiKey && !hasOpenAIKey) {
    console.warn('WARNING: No API keys found in environment variables');
    console.warn('Neither GEMINI_API_KEY nor OPENAI_API_KEY is set');
    console.warn('AI generation will not work without at least one API key');
} else {
    if (hasGeminiKey) {
        console.log('✓ GEMINI_API_KEY loaded');
    }
    if (hasOpenAIKey) {
        console.log('✓ OPENAI_API_KEY loaded');
    }
}

// Basic middleware
// CORS configuration - allow localhost in development and Vercel domains in production
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://*.vercel.app', 'https://*.vercel.sh'] 
    : ['http://localhost:3001', 'http://127.0.0.1:3001'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin matches allowed patterns
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed.includes('*')) {
                const pattern = allowed.replace('*', '.*');
                return new RegExp(pattern).test(origin);
            }
            return allowed === origin;
        });
        
        if (isAllowed || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins in production for now
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import and mount routes
try {
    const generateDeckRoutes = require('./src/routes/generateDeck');
    const exportRoutes = require('./src/routes/exportRoutes');
    const slideEditorRoutes = require('./src/routes/slideEditor_enhanced');
    const templateRoutes = require('./src/routes/templateRoutes');

    // Mount routes
    app.use('/api/generate', generateDeckRoutes);
    app.use('/api/export', exportRoutes);
    app.use('/api/export', slideEditorRoutes);
    app.use('/api/templates', templateRoutes);
} catch (error) {
    console.error('ERROR: Failed to load route modules:', error.message);
    console.error('Please ensure all route files exist in ./src/routes/ directory');
    process.exit(1);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: 'Pitch Deck Agent API is running',
        timestamp: new Date().toISOString(),
        version: '1.2'
    });
});

// Serve static files from dist in production (only if not on Vercel)
// Vercel handles static file serving, so we skip it there
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, 'dist')));
}

// Root endpoint - serve index.html in production, API info in development
app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        res.json({
            message: 'Pitch Deck Agent API v1.2',
            documentation: '/api/health',
            endpoints: {
                generate: '/api/generate',
                export: '/api/export',
                templates: '/api/templates'
            },
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler - serve index.html for SPA routes in production (only if not on Vercel)
app.use('*', (req, res) => {
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL && !req.originalUrl.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        res.status(404).json({
            error: 'Not Found',
            message: `Route ${req.originalUrl} not found`
        });
    }
});

// Start server only if not in Vercel serverless environment
if (process.env.VERCEL !== '1' && !app.listening) {
    const server = app.listen(PORT, () => {
        console.log('Pitch Deck Agent API ready.');
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Working directory: ${process.cwd()}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle port conflict errors gracefully
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use.`);
            console.error('This can happen if:');
            console.error('  1. Another instance is still running');
            console.error('  2. The port is in TIME_WAIT state (wait 1-2 seconds)');
            console.error('  3. Another process is using the port');
            console.error('\nTroubleshooting:');
            console.error(`  - Run: lsof -i :${PORT} to check what's using the port`);
            console.error(`  - Run: killall node to kill all Node processes`);
            console.error(`  - Wait a few seconds and restart`);
            process.exit(1);
        } else {
            console.error('❌ Server error:', err);
            process.exit(1);
        }
    });
}

module.exports = app;