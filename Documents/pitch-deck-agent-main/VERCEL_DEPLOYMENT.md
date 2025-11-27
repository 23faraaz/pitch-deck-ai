# Vercel Deployment Guide

This guide will help you deploy the Pitch Deck Agent to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. API keys for either Gemini or OpenAI (or both)

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Vercel will automatically detect the project settings from `vercel.json`
4. Add your environment variables:
   - `GEMINI_API_KEY` (optional, if using Gemini)
   - `OPENAI_API_KEY` (optional, if using OpenAI)
   - `NODE_ENV=production`
5. Click "Deploy"

### 3. Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Deploy to production
vercel --prod
```

## Environment Variables

Add these in your Vercel project settings (Settings → Environment Variables):

- `GEMINI_API_KEY` - Your Google Gemini API key
- `OPENAI_API_KEY` - Your OpenAI API key
- `NODE_ENV` - Set to `production` (automatically set by Vercel)

**Note**: At least one API key (Gemini or OpenAI) is required for the app to function.

## Project Structure for Vercel

- `/api/server.js` - Serverless function wrapper for Express app
- `/server.js` - Main Express application
- `/vercel.json` - Vercel configuration
- `/dist` - Built frontend files (generated during build)

## How It Works

1. **Frontend**: Vite builds the React app to `/dist` directory
2. **Backend**: Express app is wrapped as a serverless function in `/api/server.js`
3. **Routing**: 
   - `/api/*` routes go to the serverless function
   - All other routes serve the React SPA

## Troubleshooting

### Build Fails

- Ensure `npm run build` works locally
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (>=16.0.0)

### API Routes Not Working

- Verify environment variables are set in Vercel dashboard
- Check Vercel function logs in the dashboard
- Ensure `/api/server.js` exists and exports the Express app

### Static Files Not Loading

- Verify `dist` directory is generated during build
- Check that `vercel.json` has correct `outputDirectory` setting
- Ensure `index.html` is in the build output

### CORS Errors

- The server is configured to allow all origins in production
- If issues persist, check the CORS configuration in `server.js`

## Post-Deployment

After deployment, your app will be available at:
- `https://your-project-name.vercel.app`

You can also set up a custom domain in Vercel project settings.

## Local Testing

To test the production build locally:

```bash
# Build the frontend
npm run build

# Start the server
NODE_ENV=production npm start
```

The app will be available at `http://localhost:3000`

