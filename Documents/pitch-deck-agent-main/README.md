# 🎨 Pitch Deck Agent v0.1.0

An AI-powered pitch deck generation agent that creates professional presentations using Google Gemini API or OpenAI API with an enhanced PowerPoint-style editor.

![Pitch Deck Agent](https://img.shields.io/badge/Version-0.1.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/pitchdeck-agent.git
cd pitchdeck-agent
npm install
```

## Environment Setup (.env)

1. Create a `.env` file in the project root:
   ```bash
   cp .env.template .env
   ```

2. Add your API key(s) to the `.env` file. You can use either Gemini or OpenAI (or both):
   ```env
   # Gemini API (default provider)
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # OpenAI API (alternative provider)
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Server configuration
   PORT=3000
   NODE_ENV=development
   ```

3. Get your API keys:
   - **Gemini API**: https://makersuite.google.com/app/apikey
   - **OpenAI API**: https://platform.openai.com/api-keys

   **Note**: At least one API key is required. If both are provided, Gemini will be used by default unless you specify `apiProvider: 'openai'` in your request.

## Development Workflow (npm run dev)

Start the development environment with hot-reload:

```bash
# Start backend server (port 3000)
npm run dev

# In a separate terminal, start frontend (port 3001)
npm run frontend
```

### Alternative: Start both services
```bash
# Backend only
npm start

# Frontend only  
npm run frontend

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
pitchdeck-agent/
├── server.js                 # Express backend entry point
├── package.json              # Dependencies and npm scripts
├── vite.config.js            # Vite frontend configuration
├── index.html                # Frontend HTML template
├── .env                      # Environment variables
├── src/                      # React frontend source
│   ├── App.jsx               # Main React application
│   ├── main.jsx              # React entry point
│   └── components/
│       ├── InputForm.jsx     # Pitch deck input form
│       └── DeckPreview.jsx   # Generated deck preview
├── ai/
│   └── template.json         # AI prompt templates
├── storage/
│   └── decks/               # Generated pitch decks storage
└── src/routes/              # Express API routes
    ├── generateDeck.js      # Pitch deck generation endpoints
    ├── exportRoutes.js      # Export functionality (PDF, PPTX)
    └── templateRoutes.js    # Template management endpoints
```

## Features Summary

### Core Features
- **AI-Powered Generation**: Uses Google Gemini 2.0 Flash or OpenAI GPT-4 for intelligent pitch deck creation
- **Dual Provider Support**: Choose between Gemini or OpenAI APIs via request parameter
- **React Frontend**: Modern, responsive web interface for deck creation
- **Multiple Export Formats**: PDF and PowerPoint export capabilities
- **Template System**: Customizable deck templates and structures
- **Real-time Preview**: Live preview of generated content

### API Endpoints
- `GET /` - API information and health check
- `POST /api/generate/deck` - Generate pitch deck from user input
- `POST /api/export/pdf` - Export deck to PDF format
- `POST /api/export/pptx` - Export deck to PowerPoint format
- `GET /api/templates` - List available templates
- `GET /api/templates/:id` - Get specific template details

## Export Examples

### PDF Export
```javascript
const response = await fetch('/api/export/pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deckId: 'your-deck-id',
    format: 'pdf'
  })
});
```

### PowerPoint Export
```javascript
const response = await fetch('/api/export/pptx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deckId: 'your-deck-id',
    template: 'professional'
  })
});
```

### Deck Generation
```bash
# Using default provider (Gemini if available, otherwise OpenAI)
curl -X POST http://localhost:3000/api/generate/generateDeck \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TechStartup Inc",
    "idea": "Automated AI-driven insights platform",
    "audience": "Investors",
    "tone": "professional",
    "goal": "funding",
    "slideCount": 10
  }'

# Explicitly specify OpenAI provider
curl -X POST http://localhost:3000/api/generate/generateDeck \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TechStartup Inc",
    "idea": "Automated AI-driven insights platform",
    "audience": "Investors",
    "tone": "professional",
    "goal": "funding",
    "slideCount": 10,
    "apiProvider": "openai"
  }'
```

## Troubleshooting

### Common Issues

**Dependency Errors**: Ensure all packages are installed
```bash
npm install
```

**Port Conflicts**: Check if ports 3000/3001 are available
```bash
netstat -ano | findstr :3000
```

**API Key Issues**: Verify your API key(s) are valid and properly set in `.env`. At least one of `GEMINI_API_KEY` or `OPENAI_API_KEY` must be configured.

**Build Errors**: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Status

✅ Express server setup  
✅ React frontend integration  
✅ Environment configuration  
✅ Vite build system  
✅ API route structure  
✅ Gemini AI integration  
✅ OpenAI API integration  
✅ Export functionality framework  
✅ Template system foundation  
🔄 Advanced AI prompting  
🔄 Enhanced UI/UX features  

## Requirements

- Node.js >= 16.0.0
- npm >= 8.0.0
- At least one valid API key:
  - Google Gemini API key, OR
  - OpenAI API key

## License

MIT License - see LICENSE file for details

---

Built according to **Agent Development Document (ADD) v1.2** – Pitch Deck Agent Core Doctrine.