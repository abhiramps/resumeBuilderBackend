# OpenAI Quota Issue - Quick Fix

## Problem
You're seeing this error when trying to import resumes:
```
"AI service rate limit exceeded. Please try again in a few moments."
```

But the actual issue is: **Your OpenAI API key has insufficient quota/credits.**

## Root Cause
The OpenAI API returns an `insufficient_quota` error when:
- Your account has no credits
- Your free tier credits are exhausted
- Your billing is not set up

## Solution

### Option 1: Add Credits to Your OpenAI Account (Recommended)

1. **Go to OpenAI Billing:**
   - Visit: https://platform.openai.com/settings/organization/billing
   - Sign in with your OpenAI account

2. **Add Payment Method:**
   - Click "Add payment method"
   - Enter your credit card details

3. **Purchase Credits:**
   - Add at least $5-10 to start
   - GPT-4o-mini costs approximately $0.15 per 1M input tokens
   - A typical resume import uses ~2,000-5,000 tokens (~$0.001-0.002 per import)

4. **Verify Credits:**
   - Check your usage dashboard: https://platform.openai.com/usage
   - Ensure credits are available

### Option 2: Use a Different API Key

If you have another OpenAI account with credits:

1. **Create New API Key:**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (you won't see it again!)

2. **Update Your .env File:**
   ```bash
   OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
   ```

3. **Restart Your Backend:**
   ```bash
   cd resumeBuilderBackend
   npm run dev
   ```

### Option 3: Use Free Tier (Limited)

OpenAI provides $5 in free credits for new accounts:
- Valid for 3 months
- Enough for ~2,500-5,000 resume imports
- After exhaustion, you must add billing

## Testing Your API Key

Run this command to test your API key:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 10
  }'
```

**Expected Response (Success):**
```json
{
  "choices": [
    {
      "message": {
        "content": "Hello!"
      }
    }
  ]
}
```

**Error Response (Insufficient Quota):**
```json
{
  "error": {
    "message": "You exceeded your current quota...",
    "type": "insufficient_quota",
    "code": "insufficient_quota"
  }
}
```

## Cost Estimation

Using GPT-4o-mini (recommended for resume parsing):

| Metric | Cost |
|--------|------|
| Input tokens | $0.150 per 1M tokens |
| Output tokens | $0.600 per 1M tokens |
| Typical resume import | ~3,000 input + 1,000 output tokens |
| **Cost per import** | **~$0.001-0.002** |
| **100 imports** | **~$0.10-0.20** |
| **1,000 imports** | **~$1-2** |

So $10 in credits = approximately 5,000-10,000 resume imports!

## Alternative: Use GPT-3.5-turbo (Cheaper)

If you want even lower costs, update your `.env`:

```bash
AI_MODEL=gpt-3.5-turbo
```

GPT-3.5-turbo costs:
- $0.50 per 1M input tokens (3x cheaper)
- $1.50 per 1M output tokens (2.5x cheaper)
- ~$0.0005 per resume import (half the cost)

Trade-off: Slightly lower accuracy in parsing complex resumes.

## Monitoring Usage

Track your OpenAI usage:
- Dashboard: https://platform.openai.com/usage
- Set up usage alerts to avoid surprises
- Monitor daily/monthly spending

## Need Help?

If you're still having issues:
1. Check OpenAI status: https://status.openai.com/
2. Review OpenAI docs: https://platform.openai.com/docs/guides/error-codes
3. Contact OpenAI support: https://help.openai.com/

## Summary

**The issue is NOT with your code or rate limiting - it's simply that your OpenAI account needs credits added.**

Add $5-10 to your OpenAI account and you'll be good to go! 🚀
