# Creating a Test Resume for Benchmarking

## Quick Setup

The benchmark script needs a test resume file to accurately measure parsing performance.

### Option 1: Use Your Own Resume

Place your resume file in the project root:

```bash
# Copy your resume to the project
cp /path/to/your/resume.pdf ./test-resume.pdf
# or
cp /path/to/your/resume.docx ./test-resume.docx
```

### Option 2: Create a Test Directory

```bash
mkdir test-resumes
cp /path/to/your/resume.pdf ./test-resumes/test-resume.pdf
```

### Option 3: Download a Sample Resume

You can use any sample resume from the internet. For example:

```bash
# Download a sample resume (example)
curl -o test-resume.pdf "https://example.com/sample-resume.pdf"
```

## Supported Locations

The script will look for test resumes in this order:

1. `./test-resume.pdf`
2. `./test-resume.docx`
3. `./test-resumes/test-resume.pdf`
4. `./test-resumes/test-resume.docx`
5. `./sample-resume.pdf`
6. `./sample-resume.docx`

## Creating a Simple Test Resume

If you don't have a resume handy, create a simple one:

### Create test-resume.txt

```
John Doe
john.doe@email.com | (555) 123-4567 | San Francisco, CA
LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

PROFESSIONAL SUMMARY
Senior Software Engineer with 5+ years of experience in full-stack development.
Expertise in JavaScript, TypeScript, React, and Node.js.

EXPERIENCE

Senior Software Engineer | Tech Corp | San Francisco, CA
January 2020 - Present
- Led development of microservices architecture serving 1M+ users
- Improved API response time by 40% through optimization
- Mentored team of 5 junior developers
- Technologies: Node.js, React, PostgreSQL, AWS

Software Engineer | StartupXYZ | San Francisco, CA
June 2018 - December 2019
- Built RESTful APIs using Node.js and Express
- Implemented CI/CD pipeline reducing deployment time by 60%
- Developed React frontend components
- Technologies: JavaScript, MongoDB, Docker

EDUCATION

Bachelor of Science in Computer Science
Stanford University | 2014 - 2018
GPA: 3.8/4.0

SKILLS

Languages: JavaScript, TypeScript, Python, Java, SQL
Frameworks: React, Node.js, Express, Django, Next.js
Databases: PostgreSQL, MongoDB, Redis, MySQL
Cloud & Tools: AWS, Docker, Kubernetes, Git, CI/CD

CERTIFICATIONS

AWS Certified Solutions Architect | Amazon Web Services | 2021
```

### Convert to PDF (macOS/Linux)

```bash
# Using LibreOffice (if installed)
libreoffice --headless --convert-to pdf test-resume.txt

# Or use online converter
# Visit: https://www.ilovepdf.com/txt_to_pdf
```

### Convert to PDF (Online)

1. Copy the text above
2. Visit: https://www.ilovepdf.com/txt_to_pdf
3. Paste and convert
4. Download as `test-resume.pdf`

## Verify Setup

Run the quick test to verify:

```bash
npm run test:ollama-quick
```

If the resume is found, you'll see:
```
✓ Found test resume: ./test-resume.pdf
```

## Running the Full Benchmark

Once you have a test resume:

```bash
npm run test:ollama-models
```

This will:
1. Extract text from your resume (PDF/DOCX)
2. Parse it with each installed Ollama model
3. Measure timing for each step
4. Show you which model is fastest and most accurate

## What Gets Measured

- **Text Extraction Time**: How long to extract text from PDF/DOCX
- **AI Parsing Time**: How long the model takes to parse the resume
- **Total Time**: Complete end-to-end time
- **Accuracy**: How many fields were correctly extracted
- **Confidence Score**: Model's confidence in the extraction

## Example Output

```
3️⃣  Resume Parsing Test (Real File)
   📁 Using: ./test-resume.pdf
   📄 File loaded: test-resume.pdf (45.2KB)
   📝 Text extracted: 2,456 characters (234ms)
   ✓ Success!
   ⏱️  Text extraction: 234ms
   🤖 AI parsing: 8,456ms
   📊 Total time: 8,690ms
   📋 Extracted fields: 6/6
   🎯 Confidence: 92%
```

## Tips

- **Use a real resume** for most accurate results
- **Typical resume size**: 1-3 pages, 30-100KB
- **Complex resumes** (tables, graphics) may take longer
- **Simple text resumes** parse faster

## Troubleshooting

**"No test resume found"**
- Check file location
- Ensure file extension is .pdf or .docx
- Try absolute path in the script

**"Extracted text is too short"**
- PDF may be image-based (scanned)
- Try a different resume
- Convert to text-based PDF

**"Text extraction failed"**
- File may be corrupted
- Try a different format (PDF vs DOCX)
- Check file permissions

## Privacy Note

The test resume is only used locally for benchmarking. It's not uploaded anywhere. You can use a fake/sample resume if you prefer.

---

**Ready to test?** Place your resume and run:
```bash
npm run test:ollama-models
```
