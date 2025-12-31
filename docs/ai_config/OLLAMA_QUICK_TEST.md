# Ollama Quick Test Guide

## 🚀 Super Quick Start (3 Steps)

### 1. Start Ollama
```bash
ollama serve
```

### 2. Add Test Resume (Required for full benchmark)
```bash
# Place your resume in project root
cp /path/to/your/resume.pdf ./test-resume.pdf
# or
cp /path/to/your/resume.docx ./test-resume.docx
```

See [CREATE_TEST_RESUME.md](./CREATE_TEST_RESUME.md) for details.

### 3. Run Tests
```bash
# Quick test (no resume needed)
npm run test:ollama-quick

# Full benchmark (needs test resume)
npm run test:ollama-models
```

## 📋 Test Commands

```bash
# Quick test (fastest - just checks if models work)
npm run test:ollama-quick

# Full benchmark (tests speed, JSON, resume parsing)
npm run test:ollama-models

# Test all recommended models (prompts to install)
npm run test:ollama-all

# Test all and auto-install missing models
npm run test:ollama-auto

# Test specific model
npm run test:ollama-models -- --model=mistral
```

## 🎯 Recommended Models to Try

### Fast Models (< 5 seconds)
```bash
ollama pull llama3.2        # 3B - Best balance
ollama pull qwen2.5:3b      # 3B - Very fast
ollama pull gemma2:2b       # 2B - Fastest
ollama pull phi3:mini       # 3.8B - Small but powerful
```

### Quality Models (5-10 seconds)
```bash
ollama pull mistral         # 7B - Best for resume parsing
ollama pull llama3.1        # 8B - High quality
ollama pull qwen2.5         # 7B - Good multilingual
```

## 📊 What Gets Tested

1. **Simple Response** - Basic completion test
2. **JSON Output** - Structured data formatting
3. **Resume Parsing** - Real-world extraction test

Each model gets a score out of 100.

## 🏆 Expected Results

**Good Models (Score 80+):**
- llama3.2
- mistral
- qwen2.5:3b
- phi3:mini

**Fast Models (< 3s avg):**
- gemma2:2b
- qwen2.5:1.5b
- llama3.2:1b

## ⚙️ After Testing

Update your `.env` with the best model:

```bash
LLM_PROVIDER=ollama
OLLAMA_MODEL=mistral  # or your chosen model
AI_TIMEOUT=120000     # 2 minutes for local models
```

Then test with real resume:
```bash
npm run dev
# Upload resume through your API
```

## 🆘 Troubleshooting

**Ollama not running?**
```bash
ollama serve
```

**Timeout errors?**
- Use smaller model (llama3.2:1b)
- Increase timeout in .env: `AI_TIMEOUT=180000`
- Close other apps to free RAM

**Model not found?**
```bash
ollama pull llama3.2
ollama list  # See installed models
```

## 💡 Pro Tips

1. **Start with llama3.2** - Best balance of speed/quality
2. **Try mistral** - Best for resume parsing accuracy
3. **Use gemma2:2b** - If you need maximum speed
4. **Avoid large models** (70B+) unless you have 32GB+ RAM

## 📈 Benchmark Example

```
🏆 Rankings:

🥇 1. mistral          Score: 92/100  Avg: 4567ms
🥈 2. llama3.2         Score: 90/100  Avg: 3123ms
🥉 3. qwen2.5:3b       Score: 88/100  Avg: 2890ms

💡 Recommendations:

🚀 Fastest: qwen2.5:3b
🎯 Most Accurate: mistral
⚖️  Best Balance: llama3.2
```

## ✅ Next Steps

1. Run benchmark: `npm run test:ollama-models`
2. Choose best model from results
3. Update `.env` with chosen model
4. Test with real resume import
5. Monitor performance in production

---

**Full documentation:** See `OLLAMA_MODEL_TESTING.md`
