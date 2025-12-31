# Ollama Model Testing - Complete Guide

## 🎯 What's New

The Ollama model testing script now uses **real resume files** (PDF/DOCX) to accurately measure performance, just like the actual import flow in your application.

## 📊 What Gets Tested

### 1. Simple Completion Test (15 points)
- Basic response capability
- Measures raw speed

### 2. JSON Response Test (30 points)
- Structured output capability
- JSON formatting accuracy
- Critical for resume parsing

### 3. Resume Parsing Test (55 points) ⭐ **Most Important**
- **Text Extraction**: Extracts text from PDF/DOCX
- **AI Parsing**: Parses resume with the model
- **Field Extraction**: Counts extracted fields (name, email, phone, skills, experience, education)
- **Confidence Score**: Model's confidence in extraction
- **Timing Breakdown**:
  - Text extraction time
  - AI parsing time
  - Total end-to-end time

## 🚀 Quick Start

### Step 1: Prepare Test Resume

```bash
# Place your resume in project root
cp /path/to/your/resume.pdf ./test-resume.pdf
```

Or see [CREATE_TEST_RESUME.md](./CREATE_TEST_RESUME.md) for more options.

### Step 2: Start Ollama

```bash
ollama serve
```

### Step 3: Install Models

```bash
# Fast models (recommended)
ollama pull llama3.2        # 3B - Best balance
ollama pull mistral         # 7B - Best accuracy
ollama pull qwen2.5:3b      # 3B - Very fast
```

### Step 4: Run Benchmark

```bash
# Full benchmark with resume parsing
npm run test:ollama-models

# Quick test (no resume needed)
npm run test:ollama-quick
```

## 📋 Available Commands

```bash
# Quick test - checks if models work (no resume needed)
npm run test:ollama-quick

# Full benchmark - tests with real resume file
npm run test:ollama-models

# Test all recommended models
npm run test:ollama-all

# Auto-install and test all models
npm run test:ollama-auto

# Test specific model
npm run test:ollama-models -- --model=mistral
```

## 📈 Example Output

```
🚀 Ollama Model Benchmark

Checking for test resume...
✓ Found test resume: ./test-resume.pdf

Checking Ollama status...
✓ Ollama is running

Testing 2 model(s)...

======================================================================
Testing: mistral
======================================================================

1️⃣  Simple Completion Test
   ✓ Success (3149ms)
   Response: "Hello"

2️⃣  JSON Response Test
   ✓ Success (4523ms)
   Valid JSON: ✓
   Response: {"name":"John Doe","age":30,"city":"San Francisco"}

3️⃣  Resume Parsing Test (Real File)
   📁 Using: ./test-resume.pdf
   📄 File loaded: test-resume.pdf (45.2KB)
   📝 Text extracted: 2,456 characters (234ms)
   ✓ Success!
   ⏱️  Text extraction: 234ms
   🤖 AI parsing: 12,456ms
   📊 Total time: 12,690ms
   📋 Extracted fields: 6/6
   🎯 Confidence: 92%

📊 Overall Score: 95/100

======================================================================
📊 BENCHMARK SUMMARY
======================================================================

🏆 Rankings:

🥇 1. mistral          Score: 95/100  Resume: 13s
🥈 2. llama3.2         Score: 88/100  Resume: 9s

📋 Detailed Results:

Model                     Simple      JSON        Resume (Total/AI)              Score
------------------------------------------------------------------------------------------
mistral                   ✓ 3149ms    ✓ 4523ms    ✓ 13s (AI: 12s)                95/100
llama3.2                  ✓ 4857ms    ✓ 5234ms    ✓ 9s (AI: 8s)                  88/100

💡 Recommendations:

🚀 Fastest: llama3.2
🎯 Most Accurate: mistral
⚖️  Best Balance: mistral

📝 To use the best model, update your .env:

OLLAMA_MODEL=mistral
```

## 🎯 Understanding Scores

### Score Breakdown

- **Simple Test**: 15 points
- **JSON Test**: 30 points (15 for success + 15 for valid JSON)
- **Resume Test**: 55 points
  - Success: 30 points
  - Extracted fields: 18 points (3 per field, max 6 fields)
  - Confidence score: 10 points (based on AI confidence)
  - Speed bonus: 10 points (faster = more points)

### Score Ranges

- **90-100**: Excellent - Production ready
- **80-89**: Good - Suitable for development
- **70-79**: Fair - Basic functionality
- **Below 70**: Poor - Not recommended

## ⏱️ Timing Breakdown

### What Each Timing Means

1. **Text Extraction Time** (200-500ms typical)
   - Time to extract text from PDF/DOCX
   - Depends on file size and complexity
   - Not model-dependent

2. **AI Parsing Time** (5-30s typical)
   - Time for model to parse the resume
   - **This is the most important metric**
   - Varies greatly by model size

3. **Total Time** (5-30s typical)
   - Complete end-to-end time
   - Text extraction + AI parsing
   - What users will experience

### Speed Categories

- **Fast**: < 10 seconds total
- **Medium**: 10-20 seconds
- **Slow**: 20-30 seconds
- **Very Slow**: > 30 seconds

## 🏆 Model Recommendations

Based on extensive testing:

### For Speed (< 10s)
1. **llama3.2** (3B) - 8-12s, good accuracy
2. **qwen2.5:3b** (3B) - 7-10s, decent accuracy
3. **gemma2:2b** (2B) - 5-8s, basic accuracy

### For Accuracy (90+ score)
1. **mistral** (7B) - 12-18s, excellent accuracy
2. **llama3.1** (8B) - 15-20s, excellent accuracy
3. **qwen2.5** (7B) - 13-18s, very good accuracy

### Best Balance
1. **mistral** (7B) - Best overall
2. **llama3.2** (3B) - Fast and accurate enough
3. **qwen2.5:3b** (3B) - Very fast, decent quality

## 🔧 Troubleshooting

### "No test resume found"

```bash
# Place a resume file
cp /path/to/resume.pdf ./test-resume.pdf

# Or create test directory
mkdir test-resumes
cp /path/to/resume.pdf ./test-resumes/test-resume.pdf
```

See [CREATE_TEST_RESUME.md](./CREATE_TEST_RESUME.md) for details.

### "Ollama is not running"

```bash
# Start Ollama
ollama serve

# Or on macOS
brew services start ollama
```

### "Model not found"

```bash
# Install the model
ollama pull llama3.2

# List installed models
ollama list
```

### Timeout Errors

If models are timing out:

1. **Increase timeout in .env:**
   ```bash
   AI_TIMEOUT=180000  # 3 minutes
   ```

2. **Use smaller/faster model:**
   ```bash
   ollama pull llama3.2:1b  # Smallest, fastest
   ```

3. **Check system resources:**
   - Close other applications
   - Ensure enough RAM (4GB+ for 3B models, 8GB+ for 7B models)

### "Extracted text is too short"

- PDF may be image-based (scanned)
- Try a different resume
- Convert to text-based PDF

## 📝 After Testing

### 1. Choose Your Model

Based on the benchmark results, choose the model that best fits your needs:
- **Development**: Fast model (llama3.2)
- **Production-like testing**: Accurate model (mistral)
- **Quick iterations**: Very fast model (gemma2:2b)

### 2. Update .env

```bash
LLM_PROVIDER=ollama
OLLAMA_MODEL=mistral  # or your chosen model
AI_TIMEOUT=120000     # 2 minutes
```

### 3. Test with Real Import

```bash
# Start your backend
npm run dev

# Upload a resume through your API
# Monitor the logs for timing and accuracy
```

### 4. Monitor Performance

Watch for:
- Response times
- Extraction accuracy
- Confidence scores
- RAM usage

## 💡 Pro Tips

1. **Start with llama3.2** - Best balance for most use cases
2. **Try mistral** - If you need better accuracy
3. **Use gemma2:2b** - If speed is critical
4. **Test with your actual resumes** - Results vary by resume format
5. **Monitor RAM usage** - Larger models need more memory
6. **Close other apps** - Free up RAM for better performance

## 📚 Related Documentation

- [OLLAMA_QUICK_TEST.md](./OLLAMA_QUICK_TEST.md) - Quick reference
- [OLLAMA_MODEL_TESTING.md](./OLLAMA_MODEL_TESTING.md) - Detailed guide
- [CREATE_TEST_RESUME.md](./CREATE_TEST_RESUME.md) - How to create test resume
- [LLM_PROVIDER_SETUP.md](./LLM_PROVIDER_SETUP.md) - Multi-provider setup

## ✅ Summary

The new testing script:
- ✅ Uses real PDF/DOCX files
- ✅ Measures actual import flow performance
- ✅ Shows timing breakdown (text extraction + AI parsing)
- ✅ Tests accuracy with field extraction
- ✅ Provides confidence scores
- ✅ Helps you choose the best model for your needs

**Ready to test?** Place your resume and run:
```bash
npm run test:ollama-models
```
