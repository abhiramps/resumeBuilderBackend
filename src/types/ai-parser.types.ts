/**
 * Types for AI-powered resume parsing
 */

export interface ExtractionResult {
    personalInfo: {
        fullName?: string;
        email?: string;
        phone?: string;
        location?: string;
        linkedin?: string;
        github?: string;
        website?: string;
    };
    summary?: string;
    experience: Array<{
        company: string;
        position: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        current?: boolean;
        description?: string;
        highlights?: string[];
    }>;
    education: Array<{
        institution: string;
        degree: string;
        field?: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        gpa?: string;
    }>;
    skills: Array<{
        name: string;
        category?: string;
    }>;
    certifications: Array<{
        name: string;
        issuer: string;
        date?: string;
        expiryDate?: string;
        credentialId?: string;
    }>;
    projects: Array<{
        name: string;
        description?: string;
        technologies?: string[];
        url?: string;
        github?: string;
        startDate?: string;
        endDate?: string;
    }>;
    languages: Array<{
        name: string;
        proficiency?: string;
    }>;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    incompleteSections: string[];
}

export interface AIParserConfig {
    provider: 'openai' | 'anthropic' | 'google';
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}

export interface AIParserResponse {
    extraction: ExtractionResult;
    confidence: number;
    validation: ValidationResult;
}
