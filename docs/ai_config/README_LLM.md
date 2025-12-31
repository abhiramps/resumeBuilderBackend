# Multi-Provider LLM System

## 🎯 Overview

This project now supports **multiple LLM providers** for AI-powered resume parsing. You can easily switch between OpenAI, Claude, Ollama (local), and Gemini based on your needs.

## 🚀 Quick Start

### 1. Choose Your Provider

Edit `.env`:
```bash
LLM_PROVIDER=openai  # or claude, ollama, gemini
```

### 2. Configure Provider

**For OpenAI (Production):**
```bash
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-4o-mini
```

**For Ollama (Local Dev - FREE):**
```bash
# Install: brew install ollama
# Pull model: ollama pull llama3.2
# Start: ollama serve
OLLAMA_API_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=llama3.2
```

### 3. Test Your Setup

```bash
npm run test:llm-providers
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [LLM_QUICK_REFERENCE.md](./LLM_QUICK_REFERENCE.md) | Quick setup guide (start here!) |
| [LLM_PROVIDER_SETUP.md](./LLM_PROVIDER_SETUP.md) | Complete setup instructions |
| [MULTI_PROVIDER_IMPLEMENTATION.md](./MULTI_PROVIDER_IMPLEMENTATION.md) | Technical implementation details |
| [LLM_ARCHITECTURE.txt](./LLM_ARCHITECTURE.txt) | Architecture diagrams |
| [PROVIDER_MIGRATION_CHECKLIST.md](./PROVIDER_MIGRATION_CHECKLIST.md) | Migration checklist |

## 🎨 Supported Providers

| Provider | Cost | Speed | Best For |
|----------|------|-------|----------|
| **OpenAI** | $0.001/import | Fast | Production |
| **Claude** | $0.024/import | Fast | Alternative |
| **Ollama** | FREE | Medium | Local Dev |
| **Gemini** | $0.001/import | Very Fast | Alternative |

## 💡 Recommendations

- **Local Development:** Use Ollama (free, private)
- **Production:** Use OpenAI gpt-4o-mini (best value)
- **High Accuracy:** Use OpenAI gpt-4o or Claude

## 🔧 Commands

```bash
# Test current provider
npm run test:llm-providers

# Test all providers
npm run test:llm-all

# Start development server
npm run dev
```

## ⚠️ Current Issue

Your OpenAI API key has **insufficient quota**. To fix:

1. Visit: https://platform.openai.com/settings/organization/billing
2. Add payment method and purchase credits ($5-10 recommended)
3. Test: `npm run test:llm-providers`

**OR** use Ollama for free local development (see Quick Start above).

## 🆘 Need Help?

1. Check [LLM_QUICK_REFERENCE.md](./LLM_QUICK_REFERENCE.md) for quick setup
2. Read [LLM_PROVIDER_SETUP.md](./LLM_PROVIDER_SETUP.md) for detailed instructions
3. Run `npm run test:llm-providers` to diagnose issues

## ✨ Features

- ✅ 4 LLM providers supported
- ✅ Easy provider switching
- ✅ Free local development option
- ✅ Type-safe implementation
- ✅ Built-in health checks
- ✅ Comprehensive error handling
- ✅ Cost optimization
- ✅ Production-ready

---

**Status:** ✅ Implementation complete. Ready to use once you configure a provider.

**Next Step:** Choose a provider and follow the Quick Start guide above.
