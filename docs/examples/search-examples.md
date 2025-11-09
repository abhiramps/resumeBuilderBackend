# Resume Search & Filtering Examples

## Quick Start Examples

### 1. Basic Search
Search for resumes containing "software engineer":

```bash
curl -X GET "http://localhost:3000/resumes/search?q=software+engineer" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Filter by Status
Get all published resumes:

```bash
curl -X GET "http://localhost:3000/resumes?status=published" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Filter by Template
Get all resumes using the "modern" template:

```bash
curl -X GET "http://localhost:3000/resumes?template=modern" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Combined Filters
Search for "developer" in published resumes with modern template:

```bash
curl -X GET "http://localhost:3000/resumes/search?q=developer&status=published&template=modern" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Sort by Title
Get all resumes sorted alphabetically:

```bash
curl -X GET "http://localhost:3000/resumes?sortBy=title&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Pagination
Get page 2 with 20 results per page:

```bash
curl -X GET "http://localhost:3000/resumes?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Search with Sorting
Search and sort by most recent:

```bash
curl -X GET "http://localhost:3000/resumes/search?q=engineer&sortBy=updatedAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
// Search function
async function searchResumes(query: string, options = {}) {
  const params = new URLSearchParams({
    q: query,
    ...options
  });

  const response = await fetch(`/resumes/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}

// Usage
const results = await searchResumes('software engineer', {
  status: 'published',
  sortBy: 'relevance',
  page: 1,
  limit: 10
});
```

### Using Axios

```typescript
import axios from 'axios';

// List resumes with filters
async function listResumes(filters = {}) {
  const response = await axios.get('/resumes', {
    params: filters,
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.data;
}

// Usage
const resumes = await listResumes({
  status: 'draft',
  template: 'modern',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20
});
```

## React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useResumeSearch(query: string, filters = {}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) return;

    const searchResumes = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          ...filters
        });

        const response = await fetch(`/resumes/search?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        setResults(data.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    searchResumes();
  }, [query, JSON.stringify(filters)]);

  return { results, loading, error };
}

// Usage in component
function ResumeSearchComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { results, loading, error } = useResumeSearch(searchQuery, {
    status: 'published',
    sortBy: 'relevance'
  });

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search resumes..."
      />
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {results.map(resume => (
        <div key={resume.id}>{resume.title}</div>
      ))}
    </div>
  );
}
```

## Advanced Use Cases

### Debounced Search

```typescript
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

function useDebounceSearch(initialQuery = '', delay = 300) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedQuery(query);
    }, delay);

    handler();

    return () => {
      handler.cancel();
    };
  }, [query, delay]);

  return [debouncedQuery, setQuery];
}
```

### Infinite Scroll Pagination

```typescript
function useInfiniteResumes(filters = {}) {
  const [resumes, setResumes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/resumes?${new URLSearchParams({
        ...filters,
        page: page.toString(),
        limit: '20'
      })}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      setResumes(prev => [...prev, ...data.data]);
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { resumes, loadMore, loading, hasMore };
}
```

### Filter Builder

```typescript
class ResumeFilterBuilder {
  private filters: Record<string, any> = {};

  status(status: 'draft' | 'published') {
    this.filters.status = status;
    return this;
  }

  template(templateId: string) {
    this.filters.template = templateId;
    return this;
  }

  sortBy(field: string, order: 'asc' | 'desc' = 'desc') {
    this.filters.sortBy = field;
    this.filters.sortOrder = order;
    return this;
  }

  page(page: number, limit: number = 10) {
    this.filters.page = page;
    this.filters.limit = limit;
    return this;
  }

  build() {
    return this.filters;
  }
}

// Usage
const filters = new ResumeFilterBuilder()
  .status('published')
  .template('modern')
  .sortBy('updatedAt', 'desc')
  .page(1, 20)
  .build();

const resumes = await listResumes(filters);
```

## Testing Examples

### Jest Test

```typescript
import { ResumeService } from '../services/resume.service';

describe('ResumeService - Search', () => {
  let resumeService: ResumeService;

  beforeEach(() => {
    resumeService = new ResumeService();
  });

  it('should search resumes by title', async () => {
    const results = await resumeService.search('user-id', 'engineer', {
      page: 1,
      limit: 10
    });

    expect(results.resumes).toBeDefined();
    expect(results.total).toBeGreaterThanOrEqual(0);
  });

  it('should filter by status', async () => {
    const results = await resumeService.list('user-id', {
      status: 'published',
      page: 1,
      limit: 10
    });

    results.resumes.forEach(resume => {
      expect(resume.status).toBe('published');
    });
  });

  it('should sort by title ascending', async () => {
    const results = await resumeService.list('user-id', {
      sortBy: 'title',
      sortOrder: 'asc'
    });

    const titles = results.resumes.map(r => r.title);
    const sortedTitles = [...titles].sort();
    expect(titles).toEqual(sortedTitles);
  });
});
```
