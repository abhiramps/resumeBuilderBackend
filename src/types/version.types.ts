import { ResumeContent } from './resume.types';

export interface ResumeVersion {
    id: string;
    resumeId: string;
    userId: string;
    versionNumber: number;
    versionName: string | null;
    content: ResumeContent;
    templateId: string;
    createdAt: Date;
    createdBy: string | null;
    changesSummary: string | null;
    diff: VersionDiff | null;
}

export interface VersionDiff {
    added?: string[];
    removed?: string[];
    modified?: string[];
}

export interface CreateVersionData {
    versionName?: string;
    changesSummary?: string;
}

export interface CompareVersionsResult {
    oldVersion: ResumeVersion;
    newVersion: ResumeVersion;
    diff: VersionDiff;
}
