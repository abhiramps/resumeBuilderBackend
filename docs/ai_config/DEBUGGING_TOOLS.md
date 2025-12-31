# AI Resume Import - Debugging Tools

Quick reference for debugging PDF import issues.

## 🚀 Quick Start

```bash
# 1. Check your setup
npm run test:setup

# 2. Create a test PDF
npm run test:create-pdf

# 3. Test the import
npm run test:import test-resume.pdf
```

## 📋 Available Scripts

### `npm run test:setup`
**What it does**: Checks your environment setup
- Node.js version
- Required npm packages
- Environment variables
- Source files
- Prisma client

**When to use**: First thing when debugging, or after fresh install

**Example output**:
```
✅ All checks passed! Setup is ready.

Next steps:
   1. Create test PDF: ts-node create-test-pdf.ts
   2. Test import: ts-node test-pdf-import.ts test-resume.pdf
   3. Start backend: npm run dev
   4. Test via UI: http://localhost:3000
```

---

### `npm run test:create-pdf`
**What it does**: Creates a simple test PDF (`test-resume.pdf`)
- Contains sample resume data
- Text-based (not scanned)
- Guaranteed to work with the import feature

**When to use**: When you need a known-good PDF for testing

**Example output**:
```
✅ Test PDF created: test-resume.pdf

To test the import:
1. Run: ts-node test-pdf-import.ts test-resume.pdf
2. Or upload this file via the UI at http://localhost:3000

This PDF contains:
- Name: John Doe
- Email: john.doe@email.com
- Phone: +1-555-0123
- 2 work experiences
- 1 education entry
- Multiple skills
```

---

### `npm run test:import <pdf-file>`
**What it does**: Tests PDF import end-to-end
- Reads the PDF file
- Extracts text using file parser
- Calls OpenAI API for extraction
- Shows confidence score and extracted data

**When to use**: To test if a specific PDF will work

**Example usage**:
```bash
# Test the generated PDF
npm run test:import test-resume.pdf

# Test your own PDF
npm run test:import /path/to/your/resume.pdf
```

**Example output (success)**:
```
🧪 Testing PDF Import...

📄 Reading PDF: test-resume.pdf
✅ File loaded: 1167 bytes

🔍 Step 1: Testing File Parser...
   File type detected: pdf
   Extracting text from PDF...
   ✅ Text extracted: 856 characters
   Preview (first 500 chars):
   John Doe
   Software Engineer
   john.doe@email.com | +1-555-0123 | San Francisco, CA
   ...

🤖 Step 2: Testing AI Parser...
   OpenAI API Key: ✅ Set
   AI Model: gpt-4o-mini
   Calling OpenAI API...
   ✅ AI extraction completed
   Confidence score: 85%
   Validation: ✅ Valid

📊 Extracted Data:
   Name: John Doe
   Email: john.doe@email.com
   Phone: +1-555-0123
   Experience entries: 2
   Education entries: 1
   Skills: 15
   Projects: 0
   Certifications: 0

✅ All tests passed!
```

**Example output (failure)**:
```
🧪 Testing PDF Import...

📄 Reading PDF: scanned-resume.pdf
✅ File loaded: 245231 bytes

🔍 Step 1: Testing File Parser...
   File type detected: pdf
   Extracting text from PDF...

❌ Test failed:
PDF appears to be empty or contains only images. Please use a text-based PDF.
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "OPENAI_API_KEY not set"

**Solution**:
```bash
# Add to .env file
echo "OPENAI_API_KEY=sk-proj-your-key-here" >> .env
```

### Issue 2: "pdf-parse missing"

**Solution**:
```bash
npm install
```

### Issue 3: "PDF appears to be empty"

**Cause**: PDF is image-based (scanned)

**Solution**:
- Use a text-based PDF
- Or run: `npm run test:create-pdf` to create a test PDF

### Issue 4: "File not found"

**Solution**:
```bash
# Use absolute path
npm run test:import /Users/you/Downloads/resume.pdf

# Or relative path from backend directory
npm run test:import ../path/to/resume.pdf
```

---

## 📖 Detailed Guides

- **Full debugging guide**: See `DEBUG_IMPORT.md`
- **Testing guide**: See `.kiro/specs/ai-resume-import/TESTING_GUIDE.md`
- **Architecture**: See `.kiro/specs/ai-resume-import/design.md`

---

## 🎯 Debugging Workflow

When you encounter an import error:

1. **Run setup check**:
   ```bash
   npm run test:setup
   ```
   Fix any errors before proceeding.

2. **Test with known-good PDF**:
   ```bash
   npm run test:create-pdf
   npm run test:import test-resume.pdf
   ```
   If this works, your setup is fine.

3. **Test your PDF**:
   ```bash
   npm run test:import /path/to/your/resume.pdf
   ```
   This will show exactly where it fails.

4. **Check backend logs**:
   - Start backend: `npm run dev`
   - Try import via UI
   - Watch terminal for detailed logs

5. **Check browser DevTools**:
   - Open DevTools (F12)
   - Go to Network tab
   - Try import
   - Check request/response

---

## 💡 Tips

- **Always test with the generated PDF first** - it's guaranteed to work
- **Check backend logs** - they show exactly what's happening
- **Use the test script** - it's faster than testing via UI
- **Enable debug logging** - add `LOG_LEVEL=debug` to .env

---

## 🆘 Still Having Issues?

1. Check `DEBUG_IMPORT.md` for detailed troubleshooting
2. Look at backend terminal logs
3. Check browser console for errors
4. Verify your PDF is text-based (can you select text?)
5. Try a different PDF file

---

## 📝 Example Workflow

```bash
# Fresh start
cd resumeBuilderBackend

# 1. Verify setup
npm run test:setup
# ✅ All checks passed!

# 2. Create test PDF
npm run test:create-pdf
# ✅ Test PDF created: test-resume.pdf

# 3. Test import
npm run test:import test-resume.pdf
# ✅ All tests passed!

# 4. Start backend
npm run dev
# Backend running on http://localhost:3001

# 5. Test via UI
# Open http://localhost:3000
# Upload test-resume.pdf
# ✅ Import successful!
```

---

## 🎉 Success Indicators

You know it's working when:
- ✅ `npm run test:setup` passes all checks
- ✅ `npm run test:import test-resume.pdf` completes successfully
- ✅ Backend logs show "PDF signature validated"
- ✅ Backend logs show "AI extraction completed"
- ✅ UI shows confidence score and preview
- ✅ Resume appears in editor with data populated
