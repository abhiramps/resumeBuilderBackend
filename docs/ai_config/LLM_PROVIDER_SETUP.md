# Multi-Provider LLM Configuration Guide

This project supports multiple LLM providers for resume parsing. You can switch between providers based on your environment (local development, staging, production).

## Supported Providers

1. **OpenAI** (GPT-4, GPT-4o-mini) - Best for production
2. **Claude** (Anthropic) - Alternative for production
3. **Ollama** (Local Llama) - Best for local development
4. **Gemini** (Google) - Alternative option

## Quick Start

### 1. Choose Your Provider

Set the `LLM_PROVIDER` environment variable in your `.env` file:

```bash
# For production (requires API key & billing)
LLM_PROVIDER=openai

# For local development (free, runs locally)
LLM_PROVIDER=ollama

# Alternative providers
LLM_PROVIDER=claude
LLM_PROVIDER=gemini
```

### 2. Configure Provider-Specific Settings

## OpenAI Configuration

**Best for:** Production, staging
**Cost:** ~$0.001-0.002 per resume import
**Pros:** Fast, accurate, reliable
**Cons:** Requires billing setup

### Setup Steps:

1. **Get API Key:**
   - Visit: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (you won't see it again!)

2. **Add Billing:**
   - Visit: https://platform.openai.com/settings/organization/billing
   - Add payment method
   - Purchase credits ($5-10 recommended to start)

3. **Configure .env:**
   ```bash
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-proj-your-key-here
   OPENAI_MODEL=gpt-4o-mini  # or gpt-4o, gpt-4-turbo
   ```

### Model Options:

| Model | Cost (per 1M tokens) | Speed | Accuracy | Recommended For |
|-------|---------------------|-------|----------|-----------------|
| gpt-4o-mini | $0.15 input / $0.60 output | Fast | Good | Development, Production |
| gpt-4o | $2.50 input / $10.00 output | Fast | Excellent | Production (high accuracy) |
| gpt-4-turbo | $10.00 input / $30.00 output | Medium | Excellent | Complex resumes |

**Recommendation:** Use `gpt-4o-mini` for cost-effectiveness. It's accurate enough for most resumes.

---

## Claude Configuration

**Best for:** Production (alternative to OpenAI)
**Cost:** ~$0.003-0.015 per resume import
**Pros:** High quality, good at structured data
**Cons:** Requires billing setup

### Setup Steps:

1. **Get API Key:**
   - Visit: https://console.anthropic.com/
   - Create account and get API key

2. **Configure .env:**
   ```bash
   LLM_PROVIDER=claude
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   CLAUDE_MODEL=claude-3-5-sonnet-20241022
   ```

### Model Options:

| Model | Cost (per 1M tokens) | Speed | Accuracy |
|-------|---------------------|-------|----------|
| claude-3-5-sonnet-20241022 | $3.00 input / $15.00 output | Fast | Excellent |
| claude-3-5-haiku-20241022 | $0.80 input / $4.00 output | Very Fast | Good |
| claude-3-opus-20240229 | $15.00 input / $75.00 output | Medium | Best |

**Recommendation:** Use `claude-3-5-sonnet-20241022` for best balance.

---

## Ollama Configuration (Local Development)

**Best for:** Local development, testing
**Cost:** FREE (runs on your machine)
**Pros:** No API costs, privacy, offline capable
**Cons:** Slower, requires local setup, less accurate

### Setup Steps:

1. **Install Ollama:**
   
   **macOS:**
   ```bash
   brew install ollama
   ```
   
   **Linux:**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```
   
   **Windows:**
   - Download from: https://ollama.ai/download

2. **Pull Llama Model:**
   ```bash
   # Recommended: Llama 3.2 (3B parameters, fast)
   ollama pull llama3.2
   
   # Alternative: Llama 3.1 (8B parameters, more accurate but slower)
   ollama pull llama3.1
   
   # For best accuracy (requires more RAM):
   ollama pull llama3.1:70b
   ```

3. **Start Ollama Server:**
   ```bash
   ollama serve
   ```
   
   This starts the server at `http://localhost:11434`

4. **Configure .env:**
   ```bash
   LLM_PROVIDER=ollama
   OLLAMA_API_URL=http://localhost:11434/api/chat
   OLLAMA_MODEL=llama3.2
   ```

### Model Options:

| Model | Size | RAM Required | Speed | Accuracy |
|-------|------|--------------|-------|----------|
| llama3.2 | 3B | 4GB | Fast | Good |
| llama3.1 | 8B | 8GB | Medium | Better |
| llama3.1:70b | 70B | 48GB | Slow | Best |

**Recommendation:** Use `llama3.2` for local development. It's fast and good enough for testing.

### Troubleshooting Ollama:

**Issue: "Cannot connect to Ollama"**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it:
ollama serve
```

**Issue: "Model not found"**
```bash
# List installed models
ollama list

# Pull the model if missing
ollama pull llama3.2
```

---

## Gemini Configuration

**Best for:** Alternative option, good for experimentation
**Cost:** Free tier available, then pay-as-you-go
**Pros:** Free tier, fast
**Cons:** Less accurate for structured data extraction

### Setup Steps:

1. **Get API Key:**
   - Visit: https://makersuite.google.com/app/apikey
   - Create API key

2. **Configure .env:**
   ```bash
   LLM_PROVIDER=gemini
   GOOGLE_API_KEY=your-key-here
   GEMINI_MODEL=gemini-1.5-flash
   ```

### Model Options:

| Model | Cost | Speed | Accuracy |
|-------|------|-------|----------|
| gemini-1.5-flash | Free tier, then $0.075/$0.30 per 1M tokens | Very Fast | Good |
| gemini-1.5-pro | $1.25/$5.00 per 1M tokens | Fast | Better |

---

## Environment-Specific Configuration

### Local Development
```bash
# .env.local or .env
LLM_PROVIDER=ollama
OLLAMA_API_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=llama3.2
```

### Staging
```bash
# .env.staging
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-staging-key
OPENAI_MODEL=gpt-4o-mini
```

### Production
```bash
# .env.production
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-production-key
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o for higher accuracy
```

---

## Testing Your Configuration

### 1. Check Provider Health

Create a test script or use the health check endpoint:

```typescript
import { LLMFactory } from './src/config/llm';

const factory = LLMFactory.getInstance();

// Check if current provider is available
const isAvailable = await factory.isProviderAvailable('openai');
console.log('OpenAI available:', isAvailable);

// Get all available providers
const available = await factory.getAvailableProviders();
console.log('Available providers:', available);
```

### 2. Test Resume Import

Upload a test resume through your API and check the logs:

```bash
# Start your backend
npm run dev

# Check logs for provider initialization
# You should see: "LLM Factory initialized" with your provider
```

---

## Switching Providers at Runtime

The system automatically uses the provider specified in `LLM_PROVIDER`. To switch:

1. **Update .env:**
   ```bash
   LLM_PROVIDER=claude  # Change from openai to claude
   ```

2. **Restart your backend:**
   ```bash
   npm run dev
   ```

The factory will automatically initialize the new provider.

---

## Cost Comparison

Based on typical resume import (3,000 input tokens + 1,000 output tokens):

| Provider | Model | Cost per Import | 100 Imports | 1,000 Imports |
|----------|-------|----------------|-------------|---------------|
| OpenAI | gpt-4o-mini | $0.001 | $0.10 | $1.00 |
| OpenAI | gpt-4o | $0.018 | $1.80 | $18.00 |
| Claude | claude-3-5-sonnet | $0.024 | $2.40 | $24.00 |
| Claude | claude-3-5-haiku | $0.006 | $0.60 | $6.00 |
| Gemini | gemini-1.5-flash | $0.001 | $0.10 | $1.00 |
| Ollama | llama3.2 | **FREE** | **FREE** | **FREE** |

---

## Recommendations by Use Case

### 🏠 Local Development
**Use:** Ollama with Llama 3.2
- No API costs
- Fast iteration
- Privacy (data stays local)

### 🧪 Testing/Staging
**Use:** OpenAI with gpt-4o-mini
- Low cost
- Good accuracy
- Fast responses

### 🚀 Production (Cost-Optimized)
**Use:** OpenAI with gpt-4o-mini
- Best cost/performance ratio
- Reliable and fast
- ~$1 per 1,000 imports

### 🎯 Production (High Accuracy)
**Use:** OpenAI with gpt-4o or Claude with claude-3-5-sonnet
- Best accuracy
- Worth the cost for critical applications
- ~$18-24 per 1,000 imports

---

## Troubleshooting

### "No LLM providers available"
- Check that your API keys are set correctly
- Verify your provider is running (for Ollama)
- Check network connectivity

### "Provider initialization failed"
- Verify API key format (should start with `sk-` for OpenAI, `sk-ant-` for Claude)
- Check that environment variables are loaded
- Review logs for specific error messages

### "Rate limit exceeded"
- For OpenAI/Claude: Check your account billing and limits
- For Ollama: Check if your machine has enough resources
- Consider switching to a different provider temporarily

### Poor extraction quality
- Try a more powerful model (e.g., gpt-4o instead of gpt-4o-mini)
- Check if the resume format is unusual
- Review the extraction logs for specific issues

---

## Advanced Configuration

### Custom Timeout
```bash
AI_TIMEOUT=30000  # 30 seconds (default: 20000)
```

### Custom Retry Logic
```bash
AI_MAX_RETRIES=3  # Number of retries (default: 2)
```

### Provider-Specific Overrides

You can override provider settings in code:

```typescript
import { AIParserService } from './services/ai-parser.service';

const parser = new AIParserService({
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 5000,
});
```

---

## Need Help?

- **OpenAI Issues:** https://help.openai.com/
- **Claude Issues:** https://support.anthropic.com/
- **Ollama Issues:** https://github.com/ollama/ollama/issues
- **Gemini Issues:** https://ai.google.dev/docs

---

## Summary

1. **For local dev:** Use Ollama (free, local)
2. **For production:** Use OpenAI gpt-4o-mini (best value)
3. **For high accuracy:** Use OpenAI gpt-4o or Claude
4. **Switch providers** by changing `LLM_PROVIDER` in `.env`

Happy coding! 🚀
