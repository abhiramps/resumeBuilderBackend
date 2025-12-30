import { nanoid } from 'nanoid';
import { ExtractionResult, ValidationResult } from '../types/ai-parser.types';
import { ResumeContent, PersonalInfo, Experience, Education, Skill, Certification, Project, Language } from '../types/resume.types';
import { logger } from '../utils/logger';

// Skill categorization mappings
const SKILL_CATEGORIES = {
    Languages: [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
        'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell',
        'html', 'css', 'sql', 'graphql', 'dart', 'elixir', 'haskell', 'lua', 'objective-c'
    ],
    Databases: [
        'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb',
        'oracle', 'sql server', 'mariadb', 'sqlite', 'couchdb', 'neo4j', 'firebase', 'supabase',
        'cockroachdb', 'influxdb', 'timescaledb', 'memcached', 'rethinkdb'
    ],
    Frontend: [
        'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'gatsby', 'remix', 'astro',
        'jquery', 'backbone', 'ember', 'preact', 'solid', 'qwik', 'alpine.js', 'htmx',
        'tailwind', 'bootstrap', 'material-ui', 'chakra ui', 'ant design', 'sass', 'less',
        'webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'turbopack'
    ],
    Backend: [
        'node.js', 'express', 'nestjs', 'fastify', 'koa', 'hapi', 'django', 'flask', 'fastapi',
        'spring boot', 'spring', 'asp.net', '.net', 'laravel', 'symfony', 'rails', 'sinatra',
        'gin', 'echo', 'fiber', 'actix', 'rocket', 'phoenix', 'graphql', 'rest api', 'grpc',
        'microservices', 'serverless', 'lambda', 'api gateway'
    ],
    Cloud: [
        'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'terraform',
        'ansible', 'jenkins', 'github actions', 'gitlab ci', 'circleci', 'travis ci',
        'cloudformation', 'pulumi', 'helm', 'istio', 'prometheus', 'grafana', 'datadog',
        'new relic', 'splunk', 'elk', 'cloudflare', 'vercel', 'netlify', 'heroku', 'digitalocean'
    ],
    Tools: [
        'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack', 'notion',
        'vs code', 'intellij', 'vim', 'emacs', 'postman', 'insomnia', 'figma', 'sketch',
        'adobe xd', 'photoshop', 'illustrator', 'linux', 'unix', 'macos', 'windows',
        'agile', 'scrum', 'kanban', 'tdd', 'bdd', 'ci/cd', 'devops'
    ],
};

export class ContentMapperService {
    /**
     * Map AI extraction result to ResumeContent structure
     */
    mapToResumeContent(extraction: ExtractionResult): ResumeContent {
        logger.info('Starting content mapping', {
            hasPersonalInfo: !!extraction.personalInfo,
            experienceCount: extraction.experience.length,
            educationCount: extraction.education.length,
            skillsCount: extraction.skills.length,
        });

        const content: ResumeContent = {
            personalInfo: this.mapPersonalInfo(extraction.personalInfo),
            summary: extraction.summary,
            experience: this.mapExperience(extraction.experience),
            education: this.mapEducation(extraction.education),
            skills: this.mapSkills(extraction.skills),
            certifications: this.mapCertifications(extraction.certifications),
            projects: this.mapProjects(extraction.projects),
            languages: this.mapLanguages(extraction.languages),
        };

        logger.info('Content mapping completed', {
            experienceMapped: content.experience?.length || 0,
            educationMapped: content.education?.length || 0,
            skillsMapped: content.skills?.length || 0,
        });

        return content;
    }

    /**
     * Map personal information
     */
    private mapPersonalInfo(info: ExtractionResult['personalInfo']): PersonalInfo {
        return {
            fullName: info.fullName || '',
            email: info.email || '',
            phone: info.phone,
            location: info.location,
            website: info.website,
            linkedin: info.linkedin,
            github: info.github,
        };
    }

    /**
     * Map work experience
     */
    private mapExperience(experiences: ExtractionResult['experience']): Experience[] {
        return experiences.map(exp => ({
            id: nanoid(),
            company: exp.company,
            position: exp.position,
            location: exp.location,
            startDate: this.normalizeDateString(exp.startDate) || '',
            endDate: exp.current ? undefined : this.normalizeDateString(exp.endDate),
            current: exp.current || false,
            description: exp.description || '',
            highlights: exp.highlights && exp.highlights.length > 0 ? exp.highlights : undefined,
        }));
    }

    /**
     * Map education
     */
    private mapEducation(educations: ExtractionResult['education']): Education[] {
        return educations.map(edu => ({
            id: nanoid(),
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field || '',
            location: edu.location,
            startDate: this.normalizeDateString(edu.startDate) || '',
            endDate: this.normalizeDateString(edu.endDate),
            gpa: edu.gpa,
            description: undefined,
        }));
    }

    /**
     * Map and categorize skills
     */
    private mapSkills(skills: ExtractionResult['skills']): Skill[] {
        return skills.map(skill => ({
            id: nanoid(),
            name: skill.name,
            level: undefined, // AI doesn't extract skill level
            category: skill.category || this.categorizeSkill(skill.name),
        }));
    }

    /**
     * Map certifications
     */
    private mapCertifications(certifications: ExtractionResult['certifications']): Certification[] {
        return certifications.map(cert => ({
            id: nanoid(),
            name: cert.name,
            issuer: cert.issuer,
            date: this.normalizeDateString(cert.date) || '',
            expiryDate: this.normalizeDateString(cert.expiryDate),
            credentialId: cert.credentialId,
            url: undefined, // AI extraction doesn't include URL
        }));
    }

    /**
     * Map projects
     */
    private mapProjects(projects: ExtractionResult['projects']): Project[] {
        return projects.map(proj => ({
            id: nanoid(),
            name: proj.name,
            description: proj.description || '',
            technologies: proj.technologies,
            url: proj.url,
            github: proj.github,
            startDate: this.normalizeDateString(proj.startDate),
            endDate: this.normalizeDateString(proj.endDate),
        }));
    }

    /**
     * Map languages
     */
    private mapLanguages(languages: ExtractionResult['languages']): Language[] {
        return languages.map(lang => ({
            id: nanoid(),
            name: lang.name,
            proficiency: this.normalizeProficiency(lang.proficiency),
        }));
    }

    /**
     * Categorize a skill based on predefined mappings
     */
    categorizeSkill(skillName: string): string {
        const normalizedSkill = skillName.toLowerCase().trim();

        for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
            if (keywords.some(keyword => normalizedSkill.includes(keyword) || keyword.includes(normalizedSkill))) {
                return category;
            }
        }

        return 'Other';
    }

    /**
     * Normalize date string to ISO 8601 format (YYYY-MM-DD or YYYY-MM)
     */
    normalizeDateString(dateStr?: string): string | undefined {
        if (!dateStr) return undefined;

        const trimmed = dateStr.trim();
        if (!trimmed) return undefined;

        // Already in ISO format (YYYY-MM-DD or YYYY-MM)
        if (/^\d{4}-\d{2}(-\d{2})?$/.test(trimmed)) {
            return trimmed;
        }

        // Try to parse various date formats
        try {
            // Handle "Month YYYY" format (e.g., "January 2020", "Jan 2020")
            const monthYearMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
            if (monthYearMatch) {
                const month = this.parseMonth(monthYearMatch[1]);
                const year = monthYearMatch[2];
                if (month) {
                    return `${year}-${month.toString().padStart(2, '0')}`;
                }
            }

            // Handle "MM/YYYY" format
            const mmYyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
            if (mmYyyyMatch) {
                const month = parseInt(mmYyyyMatch[1], 10);
                const year = mmYyyyMatch[2];
                if (month >= 1 && month <= 12) {
                    return `${year}-${month.toString().padStart(2, '0')}`;
                }
            }

            // Handle "YYYY" format (just year)
            if (/^\d{4}$/.test(trimmed)) {
                return `${trimmed}-01`; // Default to January
            }

            // Handle "MM-DD-YYYY" or "MM/DD/YYYY" format
            const mdyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
            if (mdyMatch) {
                const month = parseInt(mdyMatch[1], 10);
                const day = parseInt(mdyMatch[2], 10);
                const year = mdyMatch[3];
                if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                }
            }

            // If we can't parse it, return undefined
            logger.warn('Could not normalize date string', { dateStr: trimmed });
            return undefined;
        } catch (error) {
            logger.warn('Error normalizing date', {
                dateStr: trimmed,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return undefined;
        }
    }

    /**
     * Parse month name to number (1-12)
     */
    private parseMonth(monthStr: string): number | null {
        const months: Record<string, number> = {
            january: 1, jan: 1,
            february: 2, feb: 2,
            march: 3, mar: 3,
            april: 4, apr: 4,
            may: 5,
            june: 6, jun: 6,
            july: 7, jul: 7,
            august: 8, aug: 8,
            september: 9, sep: 9, sept: 9,
            october: 10, oct: 10,
            november: 11, nov: 11,
            december: 12, dec: 12,
        };

        const normalized = monthStr.toLowerCase().trim();
        return months[normalized] || null;
    }

    /**
     * Normalize language proficiency to standard values
     */
    private normalizeProficiency(proficiency?: string): 'basic' | 'conversational' | 'fluent' | 'native' {
        if (!proficiency) return 'conversational';

        const normalized = proficiency.toLowerCase().trim();

        if (normalized.includes('native') || normalized.includes('mother tongue')) {
            return 'native';
        }
        if (normalized.includes('fluent') || normalized.includes('advanced') || normalized.includes('professional')) {
            return 'fluent';
        }
        if (normalized.includes('intermediate') || normalized.includes('conversational')) {
            return 'conversational';
        }
        if (normalized.includes('basic') || normalized.includes('beginner') || normalized.includes('elementary')) {
            return 'basic';
        }

        // Default to conversational
        return 'conversational';
    }

    /**
     * Validate mapped content
     */
    validateMappedContent(content: ResumeContent): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const incompleteSections: string[] = [];

        // Validate personal info
        if (!content.personalInfo?.fullName) {
            errors.push('Full name is required');
            incompleteSections.push('personalInfo');
        }
        if (!content.personalInfo?.email) {
            errors.push('Email is required');
            incompleteSections.push('personalInfo');
        }

        // Validate experience
        if (content.experience && content.experience.length > 0) {
            content.experience.forEach((exp, index) => {
                if (!exp.company) {
                    errors.push(`Experience ${index + 1}: Company is required`);
                }
                if (!exp.position) {
                    errors.push(`Experience ${index + 1}: Position is required`);
                }
                if (!exp.startDate) {
                    warnings.push(`Experience ${index + 1}: Start date is missing`);
                }
            });
        } else {
            warnings.push('No work experience found');
            incompleteSections.push('experience');
        }

        // Validate education
        if (content.education && content.education.length > 0) {
            content.education.forEach((edu, index) => {
                if (!edu.institution) {
                    errors.push(`Education ${index + 1}: Institution is required`);
                }
                if (!edu.degree) {
                    errors.push(`Education ${index + 1}: Degree is required`);
                }
            });
        } else {
            warnings.push('No education found');
            incompleteSections.push('education');
        }

        // Check for skills
        if (!content.skills || content.skills.length === 0) {
            warnings.push('No skills found');
            incompleteSections.push('skills');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            incompleteSections: Array.from(new Set(incompleteSections)),
        };
    }
}
