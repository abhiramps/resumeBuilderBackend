# AI Import Feature Setup

## Quick Start

The AI import feature is now **optional** and the backend will start without it. However, to use the AI import functionality, you need to configure an OpenAI API key.

## Setup Steps

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-...`)

### 2. Add to Environment Variables

Add the following to your `.env` file:

```bash
# AI Resume Import Configuration
OPENAI_API_KEY=sk-your_actual_api_key_here
```

### 3. Restart the Server

```bash
npm run dev
```

## Testing Without AI Import

The backend will run fine without the OPENAI_API_KEY. You can:
- ✅ Use all other resume features
- ✅ Import JSON resumes
- ❌ Cannot use AI import (PDF/DOCX parsing)

When a user tries to use AI import without the key, they'll get a clear error message.

## Cost Information

Using GPT-4o-mini (recommended):
- **Cost per import:** ~$0.001 (one-tenth of a cent)
- **Processing time:** 13-25 seconds
- **Monthly estimate:** 1000 imports = ~$1.00

## Environment Variables Reference

```bash
# Required for AI import
OPENAI_API_KEY=sk-your_key_here

# Optional (with defaults)
AI_MODEL=gpt-4o-mini                    # Model to use
AI_TIMEOUT=20000                        # 20 seconds
AI_MAX_RETRIES=2                        # Retry attempts
MAX_FILE_SIZE=10485760                  # 10MB max
IMPORT_RATE_LIMIT=5                     # 5 imports per hour
IMPORT_RATE_WINDOW=3600000              # 1 hour window
CACHE_TTL=3600000                       # 1 hour cache
```

## Testing the AI Import

Once configured, test with:

1. **Start the backend:**
   ```bash
   npm run dev
   ```

2. **Test the endpoint:**
   ```bash
   curl -X POST http://localhost:3001/resumes/import-ai \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "file": "BASE64_ENCODED_PDF_OR_DOCX",
       "filename": "resume.pdf",
       "contentType": "application/pdf"
     }'
   ```

3. **Check rate limit status:**
   ```bash
   curl http://localhost:3001/resumes/import-ai/status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Troubleshooting

### Error: "OPENAI_API_KEY environment variable is not set"
- Add the key to your `.env` file
- Restart the server

### Error: "AI service rate limit exceeded"
- You've hit OpenAI's rate limits
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan

### Error: "AI extraction timed out"
- The resume is too complex or large
- Try with a simpler format
- Increase `AI_TIMEOUT` in .env

### Import takes too long
- Normal: 13-25 seconds for typical resumes
- Check your internet connection
- Verify OpenAI API status

## Alternative: Use Without AI Import

If you don't want to use AI import:
1. Don't add OPENAI_API_KEY to .env
2. Users can still import JSON resumes
3. The feature will be disabled in the UI

## Production Deployment

For production:
1. Add OPENAI_API_KEY to your deployment environment variables
2. Consider using AWS Secrets Manager or similar
3. Monitor costs in OpenAI dashboard
4. Set up CloudWatch alerts for errors
5. Consider implementing usage quotas per user

## Support

If you encounter issues:
1. Check the logs: `tail -f logs/app.log`
2. Verify your OpenAI API key is valid
3. Check OpenAI API status: https://status.openai.com/
4. Review the error messages in the response
