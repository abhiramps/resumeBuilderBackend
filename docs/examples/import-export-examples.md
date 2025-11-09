# Resume Import/Export Examples

## Quick Start Examples

### 1. Export a Resume
```bash
curl -X GET "http://localhost:3000/resumes/abc123/export" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o resume-backup.json
```

### 2. Import a Resume
```bash
curl -X POST "http://localhost:3000/resumes/import" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @resume-backup.json
```

### 3. Duplicate a Resume
```bash
curl -X POST "http://localhost:3000/resumes/abc123/duplicate" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Bulk Export All Resumes
```bash
curl -X POST "http://localhost:3000/resumes/export" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -o all-resumes-backup.json
```

---

## JavaScript/TypeScript Examples

### Export Resume

```typescript
async function exportResume(resumeId: string, token: string) {
  const response = await fetch(`/resumes/${resumeId}/export`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export resume');
  }

  return response.json();
}

// Usage
const exportedData = await exportResume('abc123', token);

// Save to file
const blob = new Blob([JSON.stringify(exportedData.data, null, 2)], {
  type: 'application/json',
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'resume-backup.json';
a.click();
```

### Import Resume

```typescript
async function importResume(data: any, token: string) {
  const response = await fetch('/resumes/import', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to import resume');
  }

  return response.json();
}

// Usage with file input
const fileInput = document.getElementById('file-input') as HTMLInputElement;
fileInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const text = await file.text();
  const data = JSON.parse(text);
  
  const result = await importResume(data, token);
  console.log('Imported resume:', result.data);
});
```

### Duplicate Resume

```typescript
async function duplicateResume(resumeId: string, token: string) {
  const response = await fetch(`/resumes/${resumeId}/duplicate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to duplicate resume');
  }

  return response.json();
}

// Usage
const duplicate = await duplicateResume('abc123', token);
console.log('Duplicated resume:', duplicate.data);
```

### Bulk Export

```typescript
async function bulkExport(resumeIds: string[] | null, token: string) {
  const response = await fetch('/resumes/export', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resumeIds: resumeIds || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to export resumes');
  }

  return response.json();
}

// Export all resumes
const allResumes = await bulkExport(null, token);

// Export specific resumes
const selectedResumes = await bulkExport(['id1', 'id2', 'id3'], token);
```

---

## React Components

### Export Button Component

```typescript
import { useState } from 'react';

interface ExportButtonProps {
  resumeId: string;
  resumeTitle: string;
}

function ExportButton({ resumeId, resumeTitle }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/resumes/${resumeId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // Create download
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeTitle.replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showNotification('Resume exported successfully', 'success');
    } catch (error) {
      showNotification('Failed to export resume', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading}>
      {loading ? 'Exporting...' : 'Export as JSON'}
    </button>
  );
}
```

### Import Component

```typescript
import { useState, useRef } from 'react';

function ImportResume({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!data.resume || !data.resume.content) {
        throw new Error('Invalid resume file format');
      }

      const response = await fetch('/resumes/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message);
      }

      showNotification('Resume imported successfully', 'success');
      onImportSuccess();
    } catch (err) {
      setError(err.message);
      showNotification(`Import failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="import-resume">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        disabled={loading}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? 'Importing...' : 'Import Resume'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Duplicate Button Component

```typescript
import { useState } from 'react';

interface DuplicateButtonProps {
  resumeId: string;
  onDuplicate: (newResumeId: string) => void;
}

function DuplicateButton({ resumeId, onDuplicate }: DuplicateButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDuplicate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/resumes/${resumeId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      showNotification('Resume duplicated successfully', 'success');
      onDuplicate(data.data.id);
    } catch (error) {
      showNotification('Failed to duplicate resume', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDuplicate} disabled={loading}>
      {loading ? 'Duplicating...' : 'Duplicate'}
    </button>
  );
}
```

### Bulk Export Component

```typescript
import { useState } from 'react';

interface BulkExportProps {
  selectedResumeIds: string[];
}

function BulkExport({ selectedResumeIds }: BulkExportProps) {
  const [loading, setLoading] = useState(false);

  const handleBulkExport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/resumes/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeIds: selectedResumeIds.length > 0 ? selectedResumeIds : undefined,
        }),
      });

      const data = await response.json();

      // Create download
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumes-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showNotification(
        `Exported ${data.data.resumes.length} resume(s)`,
        'success'
      );
    } catch (error) {
      showNotification('Failed to export resumes', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleBulkExport} disabled={loading}>
      {loading
        ? 'Exporting...'
        : selectedResumeIds.length > 0
        ? `Export ${selectedResumeIds.length} Selected`
        : 'Export All Resumes'}
    </button>
  );
}
```

---

## Advanced Use Cases

### Drag and Drop Import

```typescript
function DragDropImport({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.json')) {
      showNotification('Please drop a JSON file', 'error');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/resumes/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Import failed');

      showNotification('Resume imported successfully', 'success');
      onImportSuccess();
    } catch (error) {
      showNotification('Failed to import resume', 'error');
    }
  };

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <p>Drag and drop a resume JSON file here</p>
    </div>
  );
}
```

### Backup Manager

```typescript
function BackupManager() {
  const [backups, setBackups] = useState<any[]>([]);

  const createBackup = async () => {
    const response = await fetch('/resumes/export', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    
    // Save to localStorage
    const backup = {
      id: Date.now(),
      date: new Date().toISOString(),
      data: data.data,
    };
    
    const existingBackups = JSON.parse(
      localStorage.getItem('resume-backups') || '[]'
    );
    existingBackups.push(backup);
    localStorage.setItem('resume-backups', JSON.stringify(existingBackups));
    
    setBackups(existingBackups);
    showNotification('Backup created', 'success');
  };

  const restoreBackup = async (backup: any) => {
    // Import each resume from backup
    for (const resume of backup.data.resumes) {
      await fetch('/resumes/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '1.0',
          resume: {
            title: resume.title,
            templateId: resume.templateId,
            content: resume.content,
          },
        }),
      });
    }
    
    showNotification('Backup restored', 'success');
  };

  return (
    <div className="backup-manager">
      <button onClick={createBackup}>Create Backup</button>
      <div className="backups-list">
        {backups.map((backup) => (
          <div key={backup.id} className="backup-item">
            <span>{new Date(backup.date).toLocaleString()}</span>
            <span>{backup.data.resumes.length} resumes</span>
            <button onClick={() => restoreBackup(backup)}>Restore</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Examples

### Jest Tests

```typescript
import { ResumeService } from '../services/resume.service';

describe('Resume Import/Export', () => {
  let resumeService: ResumeService;

  beforeEach(() => {
    resumeService = new ResumeService();
  });

  it('should export a resume', async () => {
    const exported = await resumeService.export('resume-id', 'user-id');

    expect(exported.version).toBe('1.0');
    expect(exported.exportedAt).toBeDefined();
    expect(exported.resume).toHaveProperty('title');
    expect(exported.resume).toHaveProperty('content');
  });

  it('should import a resume', async () => {
    const importData = {
      version: '1.0',
      resume: {
        title: 'Test Resume',
        templateId: 'modern',
        content: {
          personalInfo: { fullName: 'Test User' },
        },
      },
    };

    const imported = await resumeService.import('user-id', importData);

    expect(imported.title).toBe('Test Resume');
    expect(imported.status).toBe('draft');
  });

  it('should duplicate a resume', async () => {
    const duplicate = await resumeService.duplicate('resume-id', 'user-id');

    expect(duplicate.title).toContain('(Copy)');
    expect(duplicate.status).toBe('draft');
  });

  it('should bulk export resumes', async () => {
    const exported = await resumeService.bulkExport('user-id');

    expect(exported.version).toBe('1.0');
    expect(Array.isArray(exported.resumes)).toBe(true);
  });
});
```
