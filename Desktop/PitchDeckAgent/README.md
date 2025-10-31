# Pitch Deck AI

An AI-powered pitch deck generation system that creates professional presentations from natural language inputs using Google's Gemini AI.

## Features

- 🤖 **AI-Powered Generation**: Uses Google Gemini 2.0 Flash to generate pitch deck content from simple inputs
- 📊 **Real-time Preview**: See your deck as it's generated
- 📄 **Multiple Export Formats**: Export to PowerPoint (PPTX) or PDF
- 🎨 **Customizable Templates**: Choose from different presentation styles
- ⚡ **Fast & Efficient**: Built with React frontend and Express backend

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **AI**: Google Gemini 2.0 Flash API
- **PDF Generation**: pdf-lib
- **PPTX Generation**: PPTXGenJS

## Installation

1. Clone the repository:
```bash
git clone https://github.com/23faraaz/pitch-deck-ai.git
cd pitch-deck-ai
```

2. Install dependencies for both frontend and backend:
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

## Environment Setup

1. Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5050
```

To get a Gemini API key:
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Copy it to your `.env` file

## Development

1. Start the backend server:
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5050`

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

## Usage

1. Open your browser to `http://localhost:5173`
2. Fill in the form:
   - **Idea**: Describe your business/product idea
   - **Audience**: Who is your target audience?
   - **Tone**: Choose the presentation tone (professional, casual, etc.)
   - **Goal**: What's the goal of your pitch? (e.g., "raise seed funding")
3. Click "Generate Deck"
4. Preview your generated deck
5. Export to PPTX or PDF format

## API Endpoints

### Generate Deck
```http
POST /api/generate
Content-Type: application/json

{
  "idea": "Your business idea",
  "audience": "Your target audience",
  "tone": "professional",
  "goal": "raise funding"
}
```

### Export to PPTX
```http
POST /api/export/pptx
Content-Type: application/json

{
  "title": "Deck Title",
  "slides": [...]
}
```

### Export to PDF
```http
POST /api/export/pdf
Content-Type: application/json

{
  "title": "Deck Title",
  "slides": [...]
}
```

## Project Structure

```
pitch-deck-ai/
├── backend/
│   ├── src/
│   │   └── routes/
│   │       ├── generateDeck.js
│   │       └── exportRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DeckPreview.jsx
│   │   │   └── ...
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available for personal and commercial use.

## Author

23faraaz

## Acknowledgments

- Google Gemini AI for powering the content generation
- PPTXGenJS for PowerPoint generation
- pdf-lib for PDF generation
