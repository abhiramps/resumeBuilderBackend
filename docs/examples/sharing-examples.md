# Resume Sharing Examples

## Quick Start Examples

### 1. Share a Resume
```bash
curl -X POST "http://localhost:3000/resumes/abc123/share" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "data": {
    "slug": "xK9mP2nQ4rT8",
    "url": "http://localhost:3000/public/xK9mP2nQ4rT8",
    "isPublic": true
  }
}
```

### 2. View Public Resume (No Auth)
```bash
curl -X GET "http://localhost:3000/public/xK9mP2nQ4rT8"
```

### 3. Unshare Resume
```bash
curl -X DELETE "http://localhost:3000/resumes/abc123/share" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Analytics
```bash
curl -X GET "http://localhost:3000/resumes/abc123/analytics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## JavaScript/TypeScript Examples

### Share Resume Function

```typescript
async function shareResume(resumeId: string, token: string) {
  const response = await fetch(`/resumes/${resumeId}/share`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to share resume');
  }

  return response.json();
}

// Usage
const result = await shareResume('abc123', token);
console.log('Public URL:', result.data.url);
```

### Get Public Resume

```typescript
async function getPublicResume(slug: string) {
  const response = await fetch(`/public/${slug}`);

  if (!response.ok) {
    throw new Error('Resume not found');
  }

  return response.json();
}

// Usage
const resume = await getPublicResume('xK9mP2nQ4rT8');
console.log('Resume:', resume.data);
```

### Unshare Resume

```typescript
async function unshareResume(resumeId: string, token: string) {
  const response = await fetch(`/resumes/${resumeId}/share`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to unshare resume');
  }

  return response.json();
}

// Usage
await unshareResume('abc123', token);
console.log('Resume is now private');
```

### Get Analytics

```typescript
async function getResumeAnalytics(resumeId: string, token: string) {
  const response = await fetch(`/resumes/${resumeId}/analytics`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get analytics');
  }

  return response.json();
}

// Usage
const analytics = await getResumeAnalytics('abc123', token);
console.log('Views:', analytics.data.viewCount);
console.log('Exports:', analytics.data.exportCount);
```

---

## React Components

### Share Button Component

```typescript
import { useState } from 'react';

interface ShareButtonProps {
  resumeId: string;
  isPublic: boolean;
  onShare: (url: string) => void;
}

function ShareButton({ resumeId, isPublic, onShare }: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/resumes/${resumeId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setPublicUrl(data.data.url);
      onShare(data.data.url);
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async () => {
    setLoading(true);
    try {
      await fetch(`/resumes/${resumeId}/share`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setPublicUrl(null);
    } catch (error) {
      console.error('Failed to unshare:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!isPublic ? (
        <button onClick={handleShare} disabled={loading}>
          {loading ? 'Sharing...' : 'Share Resume'}
        </button>
      ) : (
        <div>
          <p>Public URL: {publicUrl}</p>
          <button onClick={() => navigator.clipboard.writeText(publicUrl!)}>
            Copy Link
          </button>
          <button onClick={handleUnshare} disabled={loading}>
            {loading ? 'Unsharing...' : 'Make Private'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### Public Resume Viewer

```typescript
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function PublicResumeViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await fetch(`/public/${slug}`);
        
        if (!response.ok) {
          throw new Error('Resume not found');
        }

        const data = await response.json();
        setResume(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!resume) return <div>Resume not found</div>;

  return (
    <div className="resume-viewer">
      <h1>{resume.title}</h1>
      <div className="resume-content">
        {/* Render resume content */}
        <PersonalInfo data={resume.content.personalInfo} />
        <Summary text={resume.content.summary} />
        <Experience items={resume.content.experience} />
        <Education items={resume.content.education} />
        <Skills items={resume.content.skills} />
      </div>
      <div className="resume-stats">
        <p>Views: {resume.viewCount}</p>
      </div>
    </div>
  );
}
```

### Analytics Dashboard

```typescript
import { useEffect, useState } from 'react';

interface AnalyticsDashboardProps {
  resumeId: string;
}

function AnalyticsDashboard({ resumeId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/resumes/${resumeId}/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        setAnalytics(data.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [resumeId]);

  if (loading) return <div>Loading analytics...</div>;
  if (!analytics) return null;

  return (
    <div className="analytics-dashboard">
      <h2>Resume Analytics</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Views</h3>
          <p className="stat-value">{analytics.viewCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Exports</h3>
          <p className="stat-value">{analytics.exportCount}</p>
        </div>
        {analytics.lastExportedAt && (
          <div className="stat-card">
            <h3>Last Exported</h3>
            <p className="stat-value">
              {new Date(analytics.lastExportedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Advanced Use Cases

### Copy to Clipboard with Notification

```typescript
async function copyPublicUrl(resumeId: string, token: string) {
  try {
    const response = await fetch(`/resumes/${resumeId}/share`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    await navigator.clipboard.writeText(data.data.url);
    
    // Show success notification
    showNotification('Public URL copied to clipboard!', 'success');
    
    return data.data.url;
  } catch (error) {
    showNotification('Failed to copy URL', 'error');
    throw error;
  }
}
```

### Share with Social Media

```typescript
function shareToSocialMedia(url: string, platform: 'twitter' | 'linkedin' | 'facebook') {
  const encodedUrl = encodeURIComponent(url);
  const text = encodeURIComponent('Check out my resume!');

  const urls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  window.open(urls[platform], '_blank', 'width=600,height=400');
}

// Usage
const publicUrl = await shareResume('abc123', token);
shareToSocialMedia(publicUrl.data.url, 'linkedin');
```

### QR Code Generation

```typescript
import QRCode from 'qrcode';

async function generateQRCode(resumeId: string, token: string) {
  const response = await fetch(`/resumes/${resumeId}/share`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  const qrCodeDataUrl = await QRCode.toDataURL(data.data.url);
  
  return qrCodeDataUrl;
}

// Usage in React
function QRCodeDisplay({ resumeId }: { resumeId: string }) {
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode(resumeId, token).then(setQrCode);
  }, [resumeId]);

  return qrCode ? <img src={qrCode} alt="Resume QR Code" /> : null;
}
```

### Email Sharing

```typescript
async function shareViaEmail(resumeId: string, email: string, token: string) {
  const response = await fetch(`/resumes/${resumeId}/share`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  const publicUrl = data.data.url;

  // Open email client with pre-filled content
  const subject = encodeURIComponent('My Resume');
  const body = encodeURIComponent(
    `Hi,\n\nI'd like to share my resume with you:\n\n${publicUrl}\n\nBest regards`
  );

  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}
```

---

## Testing Examples

### Jest Tests

```typescript
import { ResumeService } from '../services/resume.service';

describe('Resume Sharing', () => {
  let resumeService: ResumeService;

  beforeEach(() => {
    resumeService = new ResumeService();
  });

  it('should share a resume and generate public URL', async () => {
    const result = await resumeService.share('resume-id', 'user-id');

    expect(result.slug).toBeDefined();
    expect(result.url).toContain('/public/');
    expect(result.isPublic).toBe(true);
  });

  it('should return existing slug if already shared', async () => {
    const result1 = await resumeService.share('resume-id', 'user-id');
    const result2 = await resumeService.share('resume-id', 'user-id');

    expect(result1.slug).toBe(result2.slug);
  });

  it('should unshare a resume', async () => {
    await resumeService.share('resume-id', 'user-id');
    await resumeService.unshare('resume-id', 'user-id');

    const resume = await resumeService.getById('resume-id', 'user-id');
    expect(resume.isPublic).toBe(false);
    expect(resume.publicSlug).toBeNull();
  });

  it('should increment view count on public access', async () => {
    const { slug } = await resumeService.share('resume-id', 'user-id');
    
    const resume1 = await resumeService.getPublicResume(slug);
    const resume2 = await resumeService.getPublicResume(slug);

    expect(resume2.viewCount).toBe(resume1.viewCount + 1);
  });
});
```
