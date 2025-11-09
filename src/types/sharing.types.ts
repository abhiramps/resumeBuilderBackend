export interface ShareResumeResponse {
    slug: string;
    url: string;
    isPublic: boolean;
}

export interface PublicResumeView {
    id: string;
    title: string;
    templateId: string;
    content: any;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ResumeAnalytics {
    resumeId: string;
    viewCount: number;
    exportCount: number;
    lastViewedAt: Date | null;
    lastExportedAt: Date | null;
}
