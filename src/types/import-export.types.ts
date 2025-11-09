import { ResumeContent } from './resume.types';

export interface ExportedResume {
    version: string;
    exportedAt: string;
    resume: {
        title: string;
        templateId: string;
        content: ResumeContent;
        status?: string;
    };
}

export interface ImportResumeData {
    version?: string;
    resume: {
        title?: string;
        templateId?: string;
        content: ResumeContent;
    };
}

export interface BulkExportData {
    version: string;
    exportedAt: string;
    resumes: Array<{
        id: string;
        title: string;
        templateId: string;
        content: ResumeContent;
        status: string;
        createdAt: string;
        updatedAt: string;
    }>;
}
