export interface ResumeData {
    id?: string;
    user_id: string;
    title: string;
    template_id?: string;
    content: ResumeContent;
    is_public: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ResumeContent {
    personalInfo: PersonalInfo;
    summary?: string;
    experience: Experience[];
    education: Education[];
    skills: Skill[];
    certifications?: Certification[];
    projects?: Project[];
    languages?: Language[];
}

export interface PersonalInfo {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
}

export interface Experience {
    id: string;
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string[];
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
    description?: string[];
}

export interface Skill {
    id: string;
    category: string;
    items: string[];
}

export interface Certification {
    id: string;
    name: string;
    issuer: string;
    date: string;
    url?: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    startDate?: string;
    endDate?: string;
}

export interface Language {
    id: string;
    name: string;
    proficiency: 'Native' | 'Fluent' | 'Professional' | 'Intermediate' | 'Basic';
}
