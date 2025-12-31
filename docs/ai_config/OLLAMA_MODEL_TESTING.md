# Ollama Model Testing Guide

## Quick Start

### 1. Ensure Ollama is Running

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it:
ollama serve

# Or on macOS:
brew services start ollama
```

### 2. Install Some Models

```bash
# Fast models (recommended for testing)
ollama pull llama3.2        # 3B - Fast, good quality
ollama pull qwen2.5:3b      # 3B - Fast
ollama pull phi3:mini       # 3.8B - Small but powerful
ollama pull gemma2:2b       # 2B - Very fast

# Balanced models
ollama pull mistral         # 7B - Good balance
ollama pull llama3.1        # 8B - Better quality

# High quality (slower, needs more RAM)
ollama pull qwen2.5         # 7B - Good multilingual
ollama pull gemma2          # 9B - High quality
```

### 3. Run Benchmark

```bash
# Test only installed models
npm run test:ollama-models

# Test all recommended models (will prompt to install)
npm run test:ollama-all

# Test all and auto-install missing models
npm run test:ollama-auto

# Test specific model
npm run test:ollama-models -- --model=mistral
```

## Understanding the Results

### Test Categories

1. **Simple Completion Test** (20 points)
   - Tests basic response capability
   - Measures raw speed

2. **JSON Response Test** (40 points)
   - Tests structured output
   - Validates JSON formatting
   - Critical for resume parsing

3. **Resume Parsing Test** (40 points)
   - Tests real-world resume extraction
   - Measures accuracy (fields extracted)
   - Most important for your use case

### Scoring

- **90-100**: Excellent - Production ready
- **70-89**: Good - Suitable for development
- **50-69**: Fair - Basic functionality
- **0-49**: Poor - Not recommended

### Speed Bonus

- Under 3 seconds average: +10 points
- Under 5 seconds average: +5 points

## Recommended Models by Use Case

### 🚀 Fastest (< 3 seconds)

```bash
ollama pull llama3.2:1b     # 1B - Very fast, basic quality
ollama pull qwen2.5:1.5b    # 1.5B - Very fast
ollama pull gemma2:2b       # 2B - Fast and efficient
```

**Best for:** Quick iterations, testing, low-end hardware

### ⚖️ Balanced (3-8 seconds)

```bash
ollama pull llama3.2        # 3B - Good balance
ollama pull qwen2.5:3b      # 3B - Fast, decent quality
ollama pull phi3:mini       # 3.8B - Small but powerful
ollama pull mistral         # 7B - Excellent balance
```

**Best for:** Development, most use cases

### 🎯 High Quality (8-15 seconds)

```bash
ollama pull llama3.1        # 8B - Better quality
ollama pull qwen2.5         # 7B - Good multilingual
ollama pull gemma2          # 9B - High quality
ollama pull mistral-small   # 7B - Optimized
```

**Best for:** Production-like testing, accuracy matters

### 🏆 Best Quality (15+ seconds, needs 16GB+ RAM)

```bash
ollama pull llama3.1:70b    # 70B - Best quality
ollama pull deepseek-coder-v2  # 16B - Good for structured data
```

**Best for:** Maximum accuracy, powerful hardware

## Example Output

```
🚀 Ollama Model Benchmark

Testing 4 model(s)...

======================================================================
Testing: llama3.2
======================================================================

1️⃣  Simple Completion Test
   ✓ Success (1234ms)
   Response: "Hello"

2️⃣  JSON Response Test
   ✓ Success (2456ms)
   Valid JSON: ✓
   Response: {"name":"John Doe","age":30,"city":"San Francisco"}

3️⃣  Resume Parsing Test
   ✓ Success (5678ms)
   Extracted fields: 5/5

📊 Overall Score: 95/100

======================================================================
📊 BENCHMARK SUMMARY
======================================================================

🏆 Rankings:

🥇 1. llama3.2                Score: 95/100  Avg: 3123ms
🥈 2. mistral                 Score: 92/100  Avg: 4567ms
🥉 3. qwen2.5:3b              Score: 88/100  Avg: 2890ms
   4. phi3:mini               Score: 85/100  Avg: 3456ms

💡 Recommendations:

🚀 Fastest: qwen2.5:3b
🎯 Most Accurate: llama3.2
⚖️  Best Balance: llama3.2

📝 To use the best model, update your .env:

OLLAMA_MODEL=llama3.2
```

## Troubleshooting

### "Ollama is not running"

```bash
# Start Ollama
ollama serve

# Or on macOS
brew services start ollama

# Check status
curl http://localhost:11434/api/tags
```

### "Model not installed"

```bash
# Install the model
ollama pull llama3.2

# List installed models
ollama list
```

### Timeout Errors

If you're getting timeout errors:

1. **Increase timeout in .env:**
   ```bash
   AI_TIMEOUT=120000  # 2 minutes
   ```

2. **Use a smaller/faster model:**
   ```bash
   ollama pull llama3.2:1b  # Smallest, fastest
   ```

3. **Check system resources:**
   ```bash
   # Monitor RAM usage
   top
   
   # Ollama needs:
   # - 1B models: 2GB RAM
   # - 3B models: 4GB RAM
   # - 7B models: 8GB RAM
   # - 8B models: 8GB RAM
   ```

4. **Close other applications** to free up RAM

### Slow Performance

**Hardware Requirements:**

| Model Size | RAM Required | Recommended CPU |
|------------|--------------|-----------------|
| 1-2B | 4GB | Any modern CPU |
| 3-4B | 8GB | 4+ cores |
| 7-8B | 16GB | 6+ cores |
| 13B+ | 32GB | 8+ cores |

**Optimization Tips:**

1. Use smaller models for development
2. Close unnecessary applications
3. Use SSD for better performance
4. Consider GPU acceleration (if available)

### Model Comparison

```bash
# Compare multiple models quickly
npm run test:ollama-models

# Test specific models
ollama pull llama3.2
ollama pull mistral
ollama pull qwen2.5:3b
npm run test:ollama-models
```

## Model Recommendations

Based on extensive testing:

### For Resume Parsing

**Top 3 Models:**

1. **mistral** (7B)
   - Best accuracy for structured data
   - Good JSON formatting
   - Reasonable speed (~4-6s)
   - Recommended for production-like testing

2. **llama3.2** (3B)
   - Great balance of speed and accuracy
   - Fast (~2-4s)
   - Good for development
   - Lower RAM requirements

3. **qwen2.5:3b** (3B)
   - Very fast (~2-3s)
   - Good multilingual support
   - Decent accuracy
   - Great for quick iterations

### For Quick Testing

**Fastest Models:**

1. **gemma2:2b** - Very fast, decent quality
2. **qwen2.5:1.5b** - Extremely fast, basic quality
3. **llama3.2:1b** - Fastest, minimal quality

### For Best Quality

**Most Accurate Models:**

1. **llama3.1** (8B) - Excellent quality, slower
2. **mistral** (7B) - Great balance
3. **qwen2.5** (7B) - Good multilingual

## After Testing

Once you find the best model:

1. **Update .env:**
   ```bash
   LLM_PROVIDER=ollama
   OLLAMA_MODEL=mistral  # or your chosen model
   ```

2. **Test with real resume:**
   ```bash
   npm run dev
   # Upload a resume through your API
   ```

3. **Monitor performance:**
   - Check response times
   - Verify extraction accuracy
   - Monitor RAM usage

## Advanced Usage

### Test Custom Model

```bash
npm run test:ollama-models -- --model=your-custom-model
```

### Auto-Pull Missing Models

```bash
npm run test:ollama-auto
```

This will automatically download and test all recommended models.

### Batch Testing

Create a script to test multiple models:

```bash
#!/bin/bash
models=("llama3.2" "mistral" "qwen2.5:3b" "phi3:mini")

for model in "${models[@]}"; do
    echo "Testing $model..."
    ollama pull $model
    npm run test:ollama-models -- --model=$model
done
```

## Cost Comparison

| Model | Size | Speed | Quality | RAM | Cost |
|-------|------|-------|---------|-----|------|
| llama3.2:1b | 1B | ⚡⚡⚡⚡⚡ | ⭐⭐ | 2GB | FREE |
| gemma2:2b | 2B | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | 4GB | FREE |
| llama3.2 | 3B | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 4GB | FREE |
| qwen2.5:3b | 3B | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 4GB | FREE |
| phi3:mini | 3.8B | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 6GB | FREE |
| mistral | 7B | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 8GB | FREE |
| llama3.1 | 8B | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 8GB | FREE |
| qwen2.5 | 7B | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 8GB | FREE |
| gemma2 | 9B | ⚡⚡ | ⭐⭐⭐⭐⭐ | 12GB | FREE |

**All models are FREE!** The only cost is your hardware.

## Summary

1. **Start Ollama:** `ollama serve`
2. **Install models:** `ollama pull llama3.2`
3. **Run benchmark:** `npm run test:ollama-models`
4. **Choose best model** based on results
5. **Update .env:** `OLLAMA_MODEL=your-chosen-model`
6. **Test with real data**

Happy testing! 🚀
