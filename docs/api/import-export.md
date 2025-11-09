# Resume Import/Export API

## Overview
The Import/Export API allows users to export their resumes as JSON, import resumes from JSON files, duplicate existing resumes, and perform bulk exports.

## Endpoints

### 1. Export Resume
**Endpoint:** `GET /resumes/:id/export`

**Description:** Export a single resume as JSON format.

**Authentication:** Required

**Path Parameters:**
- `id` (required): Resume ID

**Example Request:**
```bash
GET /resumes/abc123/export
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "data": {
    "version": "1.0",
    "exportedAt": "2024-01-15T10:30:00Z",
    "resume": {
      "title": "Software Engineer Resume",
      "templateId": "modern",
      "status": "published",
      "content": {
        "personalInfo": {
          "fullName": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "location": "San Francisco, CA"
        },
        "summary": "Experienced software engineer...",
        "experience": [...],
        "education": [...],
        "skills": [...]
      }
    }
  }
}
```

**Notes:**
- Increments export count
- Updates lastExportedAt timestamp
- Returns complete resume data in portable format

---

### 2. Import Resume
**Endpoint:** `POST /resumes/import`

**Description:** Import a resume from JSON format.

**Authentication:** Required

**Request Body:**
```json
{
  "version": "1.0",
  "resume": {
    "title": "Imported Resume",
    "templateId": "modern",
    "content": {
      "personalInfo": {...},
      "summary": "...",
      "experience": [...],
      "education": [...],
      "skills": [...]
    }
  }
}
```

**Example Request:**
```bash
POST /resumes/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "version": "1.0",
  "resume": {
    "title": "My Imported Resume",
    "templateId": "modern",
    "content": {...}
  }
}
```

**Example Response:**
```json
{
  "data": {
    "id": "new-uuid",
    "userId": "user-uuid",
    "title": "My Imported Resume",
    "templateId": "modern",
    "content": {...},
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Notes:**
- Validates import data structure
- Checks version compatibility (currently supports v1.0)
- Respects subscription limits
- Creates resume in draft status
- Uses default template if not specified

---

### 3. Duplicate Resume
**Endpoint:** `POST /resumes/:id/duplicate`

**Description:** Create a copy of an existing resume.

**Authentication:** Required

**Path Parameters:**
- `id` (required): Resume ID to duplicate

**Example Request:**
```bash
POST /resumes/abc123/duplicate
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "data": {
    "id": "new-uuid",
    "userId": "user-uuid",
    "title": "Software Engineer Resume (Copy)",
    "templateId": "modern",
    "content": {...},
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Notes:**
- Appends " (Copy)" to the title
- Creates duplicate in draft status
- Respects subscription limits
- Preserves all content and template settings

---

### 4. Bulk Export
**Endpoint:** `POST /resumes/export`

**Description:** Export multiple resumes at once.

**Authentication:** Required

**Request Body:**
```json
{
  "resumeIds": ["id1", "id2", "id3"]
}
```

**Notes:**
- If `resumeIds` is empty or omitted, exports all user resumes
- If `resumeIds` is provided, exports only specified resumes

**Example Request (Specific Resumes):**
```bash
POST /resumes/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "resumeIds": ["abc123", "def456"]
}
```

**Example Request (All Resumes):**
```bash
POST /resumes/export
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**Example Response:**
```json
{
  "data": {
    "version": "1.0",
    "exportedAt": "2024-01-15T10:30:00Z",
    "resumes": [
      {
        "id": "abc123",
        "title": "Software Engineer Resume",
        "templateId": "modern",
        "status": "published",
        "content": {...},
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T00:00:00Z"
      },
      {
        "id": "def456",
        "title": "Product Manager Resume",
        "templateId": "classic",
        "status": "draft",
        "content": {...},
        "createdAt": "2024-01-10T00:00:00Z",
        "updatedAt": "2024-01-14T00:00:00Z"
      }
    ]
  }
}
```

---

## Data Format

### Export Format (v1.0)

```json
{
  "version": "1.0",
  "exportedAt": "ISO 8601 timestamp",
  "resume": {
    "title": "string",
    "templateId": "string",
    "status": "draft | published",
    "content": {
      "personalInfo": {...},
      "summary": "string",
      "experience": [...],
      "education": [...],
      "skills": [...],
      "certifications": [...],
      "projects": [...],
      "languages": [...]
    }
  }
}
```

### Import Format (v1.0)

```json
{
  "version": "1.0",
  "resume": {
    "title": "string (optional, defaults to 'Imported Resume')",
    "templateId": "string (optional, defaults to 'modern')",
    "content": {
      "personalInfo": {...},
      "summary": "string",
      "experience": [...],
      "education": [...],
      "skills": [...]
    }
  }
}
```

**Required Fields:**
- `resume.content` - Must be present and valid

**Optional Fields:**
- `version` - Defaults to "1.0"
- `resume.title` - Defaults to "Imported Resume"
- `resume.templateId` - Defaults to "modern"

---

## Use Cases

### Use Case 1: Backup and Restore
```bash
# 1. Export resume for backup
GET /resumes/abc123/export
Authorization: Bearer <token>

# Save response to file: resume-backup.json

# 2. Later, restore from backup
POST /resumes/import
Authorization: Bearer <token>
Content-Type: application/json

# Send content from resume-backup.json
```

### Use Case 2: Template Creation
```bash
# 1. Create a template resume
POST /resumes
Authorization: Bearer <token>
{
  "title": "Template Resume",
  "templateId": "modern",
  "content": {...}
}

# 2. Duplicate for each job application
POST /resumes/template-id/duplicate
Authorization: Bearer <token>

# 3. Customize the duplicate
PUT /resumes/new-id
Authorization: Bearer <token>
{
  "title": "Resume for Company X",
  "content": {...}
}
```

### Use Case 3: Migration Between Accounts
```bash
# 1. Export from old account
GET /resumes/abc123/export
Authorization: Bearer <old-token>

# 2. Import to new account
POST /resumes/import
Authorization: Bearer <new-token>
# Send exported data
```

### Use Case 4: Bulk Backup
```bash
# Export all resumes
POST /resumes/export
Authorization: Bearer <token>
Content-Type: application/json

{}

# Save response to file: all-resumes-backup.json
```

---

## Validation Rules

### Import Validation
1. **Version Check**: Must be "1.0" or omitted
2. **Content Required**: `resume.content` must be present
3. **Content Structure**: Must match ResumeContent interface
4. **Subscription Limits**: Respects user's resume limit

### Export Validation
1. **Ownership**: User must own the resume
2. **Existence**: Resume must exist and not be deleted

---

## Error Responses

### Invalid Import Data
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid import data: resume content is required"
  }
}
```

### Unsupported Version
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Unsupported import version: 2.0"
  }
}
```

### Resume Limit Reached
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Resume limit reached for your subscription tier"
  }
}
```

### Resume Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resume not found"
  }
}
```

---

## Best Practices

### For Users
1. **Regular Backups**: Export important resumes regularly
2. **Version Control**: Keep multiple versions using duplicate
3. **Template Strategy**: Create template resumes and duplicate for customization
4. **Bulk Operations**: Use bulk export for complete backups

### For Developers
1. **Validate Imports**: Always validate imported data structure
2. **Handle Versions**: Check version compatibility before import
3. **Error Handling**: Provide clear error messages for invalid data
4. **Rate Limiting**: Implement rate limits on import/export operations

---

## File Format Examples

### Single Resume Export File
```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:30:00Z",
  "resume": {
    "title": "Software Engineer Resume",
    "templateId": "modern",
    "status": "published",
    "content": {
      "personalInfo": {
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "location": "San Francisco, CA",
        "linkedin": "https://linkedin.com/in/johndoe",
        "github": "https://github.com/johndoe"
      },
      "summary": "Experienced software engineer with 5+ years...",
      "experience": [
        {
          "id": "exp1",
          "company": "Tech Corp",
          "position": "Senior Software Engineer",
          "location": "San Francisco, CA",
          "startDate": "2020-01",
          "endDate": "2024-01",
          "current": false,
          "description": "Led development of...",
          "highlights": [
            "Improved performance by 40%",
            "Mentored 5 junior developers"
          ]
        }
      ],
      "education": [
        {
          "id": "edu1",
          "institution": "University of California",
          "degree": "Bachelor of Science",
          "field": "Computer Science",
          "startDate": "2015-09",
          "endDate": "2019-05",
          "gpa": "3.8"
        }
      ],
      "skills": [
        {
          "id": "skill1",
          "name": "JavaScript",
          "level": "expert",
          "category": "Programming Languages"
        },
        {
          "id": "skill2",
          "name": "React",
          "level": "advanced",
          "category": "Frameworks"
        }
      ]
    }
  }
}
```

### Bulk Export File
```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:30:00Z",
  "resumes": [
    {
      "id": "abc123",
      "title": "Software Engineer Resume",
      "templateId": "modern",
      "status": "published",
      "content": {...},
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    },
    {
      "id": "def456",
      "title": "Product Manager Resume",
      "templateId": "classic",
      "status": "draft",
      "content": {...},
      "createdAt": "2024-01-10T00:00:00Z",
      "updatedAt": "2024-01-14T00:00:00Z"
    }
  ]
}
```

---

## Future Enhancements

Planned features:
- PDF export
- DOCX export
- LinkedIn import
- Indeed import
- CSV export for data analysis
- Version migration tools
- Batch import
- Import from URL
- Export templates
