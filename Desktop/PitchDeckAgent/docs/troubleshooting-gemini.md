# Troubleshooting Gemini API Issues

## Recent Fixes Applied

1. **Model Name**: Changed from `gemini-2.0-flash` (which may not exist) to `gemini-1.5-flash` with fallback to `gemini-pro`
2. **Error Handling**: Enhanced to show detailed error messages for:
   - Invalid API keys
   - Rate limiting/quota issues
   - Model errors
   - Network errors
3. **Prompt Structure**: Improved to explicitly request JSON format matching the deck structure
4. **Frontend Error Display**: Now shows detailed error messages instead of generic ones
5. **Environment Variable Loading**: Fixed dotenv to load from `backend/.env` directory

## Common Issues & Solutions

### 1. "Invalid or missing Gemini API key"

**Solution**: 
- Create a `.env` file in the `backend/` directory
- Add: `GEMINI_API_KEY=your_actual_api_key_here`
- Restart the server

**Get API Key**:
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy it to your `.env` file

### 2. "Gemini API quota exceeded or rate limited"

**Solutions**:
- Wait a few minutes and try again
- Check your Google Cloud billing/quota settings
- Ensure your API key has sufficient quota

### 3. "Model error: The model name may be incorrect"

**Solution**: The code now automatically tries `gemini-1.5-flash` first, then falls back to `gemini-pro`. If both fail, check:
- Your API key has access to these models
- Your Google Cloud project is properly configured

### 4. "AI response was not valid JSON"

**Solutions**:
- This should be rare with the improved prompt
- Check backend logs for the raw response
- The code will retry with cleaned JSON extraction

### 5. "Network error"

**Solutions**:
- Check your internet connection
- Verify the backend server is running on port 5050
- Check browser console for CORS errors
- Ensure frontend is proxying requests correctly

## Debugging Steps

1. **Check API Key**:
   ```bash
   curl http://localhost:5050/api/health/key
   ```
   Should show a masked version of your key.

2. **Check Server Health**:
   ```bash
   curl http://localhost:5050/api/health
   ```
   Should show `hasGeminiKey: true`

3. **Check Backend Logs**:
   Look for detailed error messages when generation fails:
   - "Gemini API error: ..."
   - "Error details: ..."
   - Response preview logs

4. **Test API Key Manually**:
   ```bash
   curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY \
     -H 'Content-Type: application/json' \
     -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
   ```

## Expected Deck Structure

The API should return JSON like:
```json
{
  "title": "Pitch Deck Title",
  "slides": [
    {
      "id": 1,
      "title": "Title",
      "bullets": ["Bullet 1", "Bullet 2"]
    },
    {
      "id": 2,
      "title": "Problem",
      "bullets": ["Problem description", "Impact"]
    }
    // ... more slides
  ]
}
```

## Next Steps if Still Failing

1. Check backend terminal for detailed error logs
2. Verify the API key is valid and has access to Gemini models
3. Check Google Cloud Console for any restrictions on your API key
4. Try using `gemini-pro` model explicitly (edit `generateDeck.js` line 70)

