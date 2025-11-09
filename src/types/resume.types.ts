export interface Resume {
    id: string;
    userId: string;
    title: string;
    templateId: string;
    content: ResumeContent;
    status: 'draft' | 'published';
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface ResumeContent {
    personalInfo?: PersonalInfo;
    summary?: string;
    experience?: Experience[];
    education?: Education[];
    skills?: Skill[];
    certifications?: Certification[];
    projects?: Project[];
    languages?: Language[];
}

export interface PersonalInfo {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
}

export interface Experience {
    id: string;
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    highlights?: string[];
}

export interface Education {
    id: string;
    institution: string;
    degree: string;
    field: string;
    location?: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
    description?: string;
}

export interface Skill {
    id: string;
    name: string;
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    category?: string;
}

export interface Certification {
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
    credentialId?: string;
    url?: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
    github?: string;
    startDate?: string;
    endDate?: string;
}

export interface Language {
    id: string;
    name: string;
    proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface CreateResumeData {
    title: string;
    templateId?: string;
    content?: ResumeContent;
}

export interface UpdateResumeData {
    title?: string;
    templateId?: string;
    content?: ResumeContent;
    status?: 'draft' | 'published';
}

export interface ResumeListOptions {
    page?: number;
    limit?: number;
    status?: 'draft' | 'published';
    template?: string;
}
