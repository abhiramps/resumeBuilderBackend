# Resume Search & Filtering API

## Overview
The Resume API provides comprehensive search and filtering capabilities to help users find and organize their resumes efficiently.

## Endpoints

### 1. Search Resumes
**Endpoint:** `GET /resumes/search`

**Description:** Full-text search across resume titles, descriptions, and content.

**Query Parameters:**
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 100)
- `status` (optional): Filter by status (`draft` or `published`)
- `template` (optional): Filter by template ID
- `sortBy` (optional): Sort field (`relevance`, `updatedAt`, `createdAt`, `title`)
- `sortOrder` (optional): Sort order (`asc` or `desc`, default: `desc`)

**Example Request:**
```bash
GET /resumes/search?q=software+engineer&status=published&sortBy=relevance
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "title": "Software Engineer Resume",
      "description": "My professional resume",
      "templateId": "modern",
      "content": { ... },
      "status": "published",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

**Search Behavior:**
- Searches in resume title (case-insensitive)
- Searches in resume description (case-insensitive)
- Searches in content.personalInfo.fullName
- Searches in content.summary
- Results are ranked by relevance when `sortBy=relevance`

---

### 2. List Resumes with Filtering
**Endpoint:** `GET /resumes`

**Description:** List all resumes with optional filtering and sorting.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10, max: 100)
- `status` (optional): Filter by status (`draft` or `published`)
- `template` (optional): Filter by template ID
- `sortBy` (optional): Sort field (`updatedAt`, `createdAt`, `title`)
- `sortOrder` (optional): Sort order (`asc` or `desc`, default: `desc`)

**Example Request:**
```bash
GET /resumes?status=draft&template=modern&sortBy=title&sortOrder=asc
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "title": "Backend Developer Resume",
      "templateId": "modern",
      "status": "draft",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

---

## Filtering Options

### By Status
Filter resumes by their publication status:
- `draft`: Resumes that are still being edited
- `published`: Resumes that are finalized and ready to share

**Example:**
```bash
GET /resumes?status=published
```

### By Template
Filter resumes by template ID:
- `modern`
- `classic`
- `minimal`
- `professional`
- etc.

**Example:**
```bash
GET /resumes?template=modern
```

### Combined Filters
You can combine multiple filters:

**Example:**
```bash
GET /resumes?status=published&template=modern&sortBy=updatedAt&sortOrder=desc
```

---

## Sorting Options

### Available Sort Fields

#### For List Endpoint:
- `updatedAt` (default): Sort by last modification date
- `createdAt`: Sort by creation date
- `title`: Sort alphabetically by title

#### For Search Endpoint:
- `relevance` (default): Sort by search relevance
- `updatedAt`: Sort by last modification date
- `createdAt`: Sort by creation date
- `title`: Sort alphabetically by title

### Sort Order
- `asc`: Ascending order (A-Z, oldest first)
- `desc`: Descending order (Z-A, newest first, default)

**Examples:**
```bash
# Sort by title alphabetically
GET /resumes?sortBy=title&sortOrder=asc

# Sort by creation date, newest first
GET /resumes?sortBy=createdAt&sortOrder=desc

# Search with relevance sorting
GET /resumes/search?q=developer&sortBy=relevance
```

---

## Pagination

All list and search endpoints support pagination:

**Parameters:**
- `page`: Page number (starts at 1)
- `limit`: Number of results per page (default: 10, max: 100)

**Response includes:**
```json
{
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

**Example:**
```bash
# Get second page with 20 results per page
GET /resumes?page=2&limit=20
```

---

## Search Tips

### Basic Search
Search for a single term:
```bash
GET /resumes/search?q=engineer
```

### Multi-word Search
Search for multiple words (space-separated):
```bash
GET /resumes/search?q=software+engineer
```

### Search with Filters
Combine search with filters:
```bash
GET /resumes/search?q=developer&status=published&template=modern
```

### Case Insensitive
All searches are case-insensitive:
```bash
# These return the same results:
GET /resumes/search?q=Engineer
GET /resumes/search?q=engineer
GET /resumes/search?q=ENGINEER
```

---

## Performance Optimization

### Database Indexes
The following indexes are recommended for optimal performance:
- `userId` - For filtering by user
- `status` - For status filtering
- `templateId` - For template filtering
- `deletedAt` - For excluding soft-deleted records
- `updatedAt` - For sorting by update date
- `title` - For title sorting and searching

### Best Practices
1. Use pagination to limit result sets
2. Apply filters to narrow down results before searching
3. Use specific search terms for better relevance
4. Cache frequently accessed results on the client side

---

## Error Responses

### Missing Search Query
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Search query parameter \"q\" is required"
  }
}
```

### Invalid Pagination
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Page and limit must be positive integers"
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

---

## Examples

### Example 1: Find all published resumes
```bash
curl -X GET "https://api.example.com/resumes?status=published" \
  -H "Authorization: Bearer <token>"
```

### Example 2: Search for "developer" in draft resumes
```bash
curl -X GET "https://api.example.com/resumes/search?q=developer&status=draft" \
  -H "Authorization: Bearer <token>"
```

### Example 3: Get modern template resumes sorted by title
```bash
curl -X GET "https://api.example.com/resumes?template=modern&sortBy=title&sortOrder=asc" \
  -H "Authorization: Bearer <token>"
```

### Example 4: Paginated search results
```bash
curl -X GET "https://api.example.com/resumes/search?q=engineer&page=2&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## Future Enhancements

Planned features for future releases:
- Advanced search operators (AND, OR, NOT)
- Fuzzy matching for typo tolerance
- Search suggestions and autocomplete
- Saved search queries
- Search history
- Full-text search in experience and education sections
- Tag-based filtering
- Date range filtering
