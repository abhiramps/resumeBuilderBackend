# Quick Debug Guide for PDF Import Error

## The Error You're Seeing

```json
{
  "path": "/resumes/import-ai",
  "error": {
    "success": false,
    "error": {
      "code": "ERROR",
      "message": "Failed to extract text from PDF. The file may be corrupted or password-protected."
    }
  }
}
```

## Quick Diagnosis (5 minutes)

### Step 1: Create and Test a Simple PDF

```bash
cd resumeBuilderBackend

# Create a test PDF
ts-node create-test-pdf.ts

# Test it
ts-node test-pdf-import.ts test-resume.pdf
```

**If this works**: Your code is fine, the issue is with the PDF file you're testing
**If this fails**: There's a problem with the setup (see Step 2)

### Step 2: Check Your Setup

```bash
# Verify OpenAI API key is set
grep OPENAI_API_KEY .env

# Should show: OPENAI_API_KEY=sk-proj-...
# If empty or missing, add it to .env
```

### Step 3: Test via UI

1. Make sure backend is running: `npm run dev`
2. Open http://localhost:3000
3. Login with: psabhiram007@gmail.com / User@123
4. Click Import → AI Import
5. Upload the `test-resume.pdf` file created in Step 1
6. Watch the backend terminal for logs

**Look for these logs**:
```
✅ Good:
- "PDF signature validated"
- "PDF parsed successfully"
- "AI extraction completed"

❌ Bad:
- "Invalid PDF signature"
- "PDF extraction failed"
```

## Common Causes & Fixes

### Cause 1: Image-Based PDF (Most Common)

**Problem**: PDF is a scanned image, not text

**How to check**:
- Open the PDF in a viewer
- Try to select text with your mouse
- If you can't select text → it's an image

**Fix**:
- Export from Word/Google Docs as PDF (not "Print to PDF")
- Or use OCR software to convert to text

### Cause 2: File Upload Issue

**Problem**: File isn't being uploaded correctly

**How to check**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try the import
4. Click on the `/resumes/import-ai` request
5. Check the Payload tab
6. Verify `file` field has base64 data

**Fix**:
- Try a different browser
- Clear browser cache
- Check file size (must be < 10MB)

### Cause 3: pdf-parse Library Issue

**Problem**: The pdf-parse npm package is failing

**How to check**:
```bash
# Run the test script with a known-good PDF
ts-node test-pdf-import.ts test-resume.pdf
```

**Fix**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Cause 4: Buffer Encoding Issue

**Problem**: File is being corrupted during base64 encoding/decoding

**How to check**: Look for this log in backend:
```
File decoded successfully
  bufferSize: 45231
  firstBytes: 255044462d312e34...  # Should start with 25504446 for PDF
```

**Fix**: This is handled automatically, but if you see wrong bytes, the frontend encoding is broken

## Detailed Logs

To see exactly what's happening, add this to `.env`:

```bash
LOG_LEVEL=debug
```

Then restart backend and try again. You'll see:
- Exact buffer size
- PDF signature check
- Text extraction progress
- AI API calls
- Error stack traces

## Test Different PDF Types

Try these to narrow down the issue:

1. **Simple text PDF** (created by script above) ✅
2. **Word export**: Export from Microsoft Word
3. **Google Docs export**: Download as PDF from Google Docs
4. **Complex resume**: Multi-column layout
5. **Scanned PDF**: Photo/scan of a resume ❌ (won't work)

## Still Not Working?

### Check Backend Logs

When you try to import, you should see logs like:

```
[INFO] AI import request received
  userId: abc123
  contentType: application/json

[INFO] Request body received
  hasFile: true
  fileLength: 12345
  filename: resume.pdf
  contentType: application/pdf

[INFO] File decoded successfully
  bufferSize: 12345
  firstBytes: 255044462d312e34...

[INFO] Starting PDF text extraction
  bufferSize: 12345

[INFO] PDF signature validated
  signature: %PDF

[INFO] PDF parsed successfully
  pages: 2
  rawTextLength: 1234

[INFO] PDF extraction completed
  textLength: 1234
  pages: 2
```

**If you don't see these logs**, the request isn't reaching the backend.

**If logs stop at a certain point**, that's where the error is happening.

### Check Frontend Console

Open browser console (F12) and look for:
- Network errors
- JavaScript errors
- Failed API calls

### Verify Environment

```bash
# Check Node version (should be 18+)
node --version

# Check npm packages are installed
ls node_modules/pdf-parse
ls node_modules/openai

# Check .env file exists and has required vars
cat .env | grep -E "(OPENAI_API_KEY|DATABASE_URL|SUPABASE)"
```

## Quick Fix Checklist

- [ ] Backend is running on port 3001
- [ ] Frontend is running on port 3000
- [ ] OPENAI_API_KEY is set in .env
- [ ] Test PDF created: `ts-node create-test-pdf.ts`
- [ ] Test script passes: `ts-node test-pdf-import.ts test-resume.pdf`
- [ ] Browser DevTools shows file being uploaded
- [ ] Backend logs show "PDF signature validated"
- [ ] PDF is text-based (can select text)

## Next Steps

1. **Run the test script first** - this will tell you if the problem is code or PDF
2. **Check backend logs** - they show exactly where it's failing
3. **Try the generated test PDF** - this is guaranteed to work if setup is correct
4. **Check browser DevTools** - verify file is being uploaded correctly

If test script works but UI doesn't, the issue is in the frontend/upload process.
If test script fails, the issue is in the backend/PDF parsing.
