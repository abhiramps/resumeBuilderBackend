# LLM Provider Quick Reference

## Switch Provider

Edit `.env` file:
```bash
LLM_PROVIDER=openai    # or claude, ollama, gemini
```

## Provider Configurations

### OpenAI (Production)
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-4o-mini
```
**Cost:** ~$0.001/import | **Setup:** https://platform.openai.com/api-keys

### Claude (Alternative)
```bash
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-your-key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```
**Cost:** ~$0.024/import | **Setup:** https://console.anthropic.com/

### Ollama (Local Dev - FREE)
```bash
LLM_PROVIDER=ollama
OLLAMA_API_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=llama3.2
```
**Cost:** FREE | **Setup:**
```bash
brew install ollama
ollama pull llama3.2
ollama serve
```

### Gemini (Alternative)
```bash
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your-key
GEMINI_MODEL=gemini-1.5-flash
```
**Cost:** Free tier available | **Setup:** https://makersuite.google.com/app/apikey

## Test Your Setup

```bash
# Test current provider
npm run test:llm-providers

# Test all providers
npm run test:llm-all
```

## Recommendations

| Environment | Provider | Model | Why |
|------------|----------|-------|-----|
| **Local Dev** | Ollama | llama3.2 | Free, fast, private |
| **Staging** | OpenAI | gpt-4o-mini | Low cost, reliable |
| **Production** | OpenAI | gpt-4o-mini | Best value |
| **High Accuracy** | OpenAI | gpt-4o | Most accurate |

## Troubleshooting

**"No providers available"**
- Check API keys are set
- For Ollama: Run `ollama serve`
- Verify network connectivity

**"Insufficient quota"**
- OpenAI/Claude: Add billing at provider dashboard
- Check usage limits

**"Connection refused"**
- Ollama: Ensure `ollama serve` is running
- Check firewall settings

## Full Documentation

See `LLM_PROVIDER_SETUP.md` for complete setup instructions.
