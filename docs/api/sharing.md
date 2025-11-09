# Resume Sharing & Public URLs API

## Overview
The Resume Sharing API allows users to make their resumes publicly accessible via unique URLs, track views, and manage sharing settings.

## Endpoints

### 1. Share Resume (Make Public)
**Endpoint:** `POST /resumes/:id/share`

**Description:** Generate a public URL for a resume and make it accessible without authentication.

**Authentication:** Required

**Path Parameters:**
- `id` (required): Resume ID

**Example Request:**
```bash
POST /resumes/abc123/share
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "data": {
    "slug": "xK9mP2nQ4rT8",
    "url": "https://example.com/public/xK9mP2nQ4rT8",
    "isPublic": true
  }
}
```

**Notes:**
- If the resume is already shared, returns the existing slug
- Generates a unique 12-character slug using nanoid
- The slug is URL-safe and collision-resistant

---

### 2. Get Public Resume
**Endpoint:** `GET /public/:slug`

**Description:** Retrieve a publicly shared resume by its slug. No authentication required.

**Authentication:** Optional (tracks views anonymously)

**Path Parameters:**
- `slug` (required): Public resume slug

**Example Request:**
```bash
GET /public/xK9mP2nQ4rT8
```

**Example Response:**
```json
{
  "data": {
    "id": "abc123",
    "title": "Software Engineer Resume",
    "templateId": "modern",
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
    },
    "viewCount": 42,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

**Notes:**
- Automatically increments view count
- Does not expose user ID or private information
- Returns 404 if resume is not public or doesn't exist

---

### 3. Unshare Resume (Make Private)
**Endpoint:** `DELETE /resumes/:id/share`

**Description:** Revoke public access to a resume and remove the public URL.

**Authentication:** Required

**Path Parameters:**
- `id` (required): Resume ID

**Example Request:**
```bash
DELETE /resumes/abc123/share
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "message": "Resume is now private"
}
```

**Notes:**
- Removes the public slug
- Sets isPublic to false
- Existing public URLs will return 404

---

### 4. Update Share Settings
**Endpoint:** `PATCH /resumes/:id/share`

**Description:** Update sharing settings for a resume.

**Authentication:** Required

**Path Parameters:**
- `id` (required): Resume ID

**Request Body:**
```json
{
  "isPublic": true
}
```

**Example Request:**
```bash
PATCH /resumes/abc123/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "isPublic": false
}
```

**Example Response:**
```json
{
  "data": {
    "id": "abc123",
    "userId": "user123",
    "title": "Software Engineer Resume",
    "isPublic": false,
    "publicSlug": null,
    "viewCount": 42,
    "exportCount": 5,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

**Notes:**
- Setting `isPublic: true` generates a slug if one doesn't exist
- Setting `isPublic: false` removes the public slug
- Returns the updated resume object

---

### 5. Get Resume Analytics
**Endpoint:** `GET /resumes/:id/analytics`

**Description:** Get analytics data for a resume including view and export counts.

**Authentication:** Required

**Path Parameters:**
- `id` (required): Resume ID

**Example Request:**
```bash
GET /resumes/abc123/analytics
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "data": {
    "resumeId": "abc123",
    "viewCount": 42,
    "exportCount": 5,
    "lastViewedAt": null,
    "lastExportedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Notes:**
- Only the resume owner can access analytics
- View count includes all public views
- Export count tracks PDF/DOCX downloads

---

## Use Cases

### Use Case 1: Share Resume with Recruiters
```bash
# 1. Make resume public
POST /resumes/abc123/share
Authorization: Bearer <token>

# Response includes public URL
{
  "data": {
    "slug": "xK9mP2nQ4rT8",
    "url": "https://example.com/public/xK9mP2nQ4rT8",
    "isPublic": true
  }
}

# 2. Share the URL with recruiters
# They can access without authentication:
GET /public/xK9mP2nQ4rT8

# 3. Check analytics
GET /resumes/abc123/analytics
Authorization: Bearer <token>
```

### Use Case 2: Temporary Sharing
```bash
# 1. Share resume
POST /resumes/abc123/share
Authorization: Bearer <token>

# 2. After interview, revoke access
DELETE /resumes/abc123/share
Authorization: Bearer <token>
```

### Use Case 3: Portfolio Website
```bash
# 1. Make multiple resumes public
POST /resumes/resume1/share
POST /resumes/resume2/share
POST /resumes/resume3/share

# 2. Embed public URLs in portfolio
# Each resume has its own unique URL
```

---

## Security Considerations

### Slug Generation
- Uses nanoid with 12 characters
- URL-safe characters only
- Collision probability: ~1 in 2.8 trillion for 1000 IDs/hour

### Access Control
- Only resume owners can share/unshare
- Public resumes are read-only
- No sensitive user data exposed in public view

### Privacy
- User ID not exposed in public view
- Only published content is visible
- Private resumes return 404, not 403 (prevents enumeration)

---

## Best Practices

### For Users
1. **Review Content**: Ensure resume content is appropriate before sharing
2. **Use Specific Sharing**: Share only the resumes you want public
3. **Monitor Analytics**: Check view counts to track engagement
4. **Revoke When Done**: Unshare resumes after job search

### For Developers
1. **Cache Public Resumes**: Public resumes can be cached aggressively
2. **Rate Limit**: Implement rate limiting on public endpoints
3. **Analytics**: Track view sources for better insights
4. **SEO**: Add meta tags for better social sharing

---

## Error Responses

### Resume Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resume not found"
  }
}
```

### Public Resume Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Public resume not found"
  }
}
```

### Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "isPublic must be a boolean"
  }
}
```

---

## Rate Limiting

Recommended rate limits:
- **Share/Unshare**: 10 requests per minute per user
- **Public View**: 100 requests per minute per IP
- **Analytics**: 30 requests per minute per user

---

## Future Enhancements

Planned features:
- Password-protected sharing
- Expiring share links
- Custom slugs
- View analytics by date/source
- Share via email directly
- Social media preview cards
- Download tracking
- Geographic analytics
