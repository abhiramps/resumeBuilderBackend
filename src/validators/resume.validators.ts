import Joi from 'joi';

const personalInfoSchema = Joi.object({
    fullName: Joi.string().required().max(255),
    email: Joi.string().email().required(),
    phone: Joi.string().optional().max(50),
    location: Joi.string().optional().max(255),
    website: Joi.string().uri().optional(),
    linkedin: Joi.string().uri().optional(),
    github: Joi.string().uri().optional(),
});

// Relaxed schema for updates (allows empty/partial data)
const personalInfoUpdateSchema = Joi.object({
    fullName: Joi.string().optional().allow('').max(255),
    title: Joi.string().optional().allow('').max(255),
    email: Joi.string().email().optional().allow(''),
    phone: Joi.string().optional().allow('').max(50),
    location: Joi.string().optional().allow('').max(255),
    website: Joi.string().uri().optional().allow(''),
    linkedin: Joi.string().uri().optional().allow(''),
    github: Joi.string().uri().optional().allow(''),
    portfolio: Joi.string().uri().optional().allow(''),
});

const experienceSchema = Joi.object({
    id: Joi.string().optional(),
    company: Joi.string().optional().allow('').max(255),
    jobTitle: Joi.string().optional().allow('').max(255),
    position: Joi.string().optional().allow('').max(255),
    location: Joi.string().optional().allow('').max(255),
    startDate: Joi.string().optional().allow(''),
    endDate: Joi.string().optional().allow(''),
    current: Joi.boolean().optional(),
    description: Joi.string().optional().allow('').max(2000),
    highlights: Joi.array().items(Joi.string().max(500)).optional(),
    achievements: Joi.array().items(Joi.string().max(500)).optional(),
}).unknown(true);

const educationSchema = Joi.object({
    id: Joi.string().optional(),
    institution: Joi.string().optional().allow('').max(255),
    degree: Joi.string().optional().allow('').max(255),
    field: Joi.string().optional().allow('').max(255),
    location: Joi.string().optional().allow('').max(255),
    startDate: Joi.string().optional().allow(''),
    endDate: Joi.string().optional().allow(''),
    gpa: Joi.string().optional().allow('').max(10),
    description: Joi.string().optional().allow('').max(1000),
    coursework: Joi.array().items(Joi.string().max(255)).optional(),
}).unknown(true);

const skillSchema = Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().optional().allow('').max(100),
    level: Joi.string().optional().allow(''),
    category: Joi.string().optional().allow('').max(100),
}).unknown(true);

const certificationSchema = Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().optional().allow('').max(255),
    issuer: Joi.string().optional().allow('').max(255),
    date: Joi.string().optional().allow(''),
    issuedDate: Joi.string().optional().allow(''),
    expiryDate: Joi.string().optional().allow(''),
    credentialId: Joi.string().optional().allow('').max(255),
    url: Joi.string().uri().optional().allow(''),
}).unknown(true);

const projectSchema = Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().optional().allow('').max(255),
    title: Joi.string().optional().allow('').max(255),
    description: Joi.string().optional().allow('').max(2000),
    technologies: Joi.array().items(Joi.string().max(100)).optional(),
    url: Joi.string().uri().optional().allow(''),
    liveUrl: Joi.string().uri().optional().allow(''),
    github: Joi.string().uri().optional().allow(''),
    githubUrl: Joi.string().uri().optional().allow(''),
    startDate: Joi.string().optional().allow(''),
    endDate: Joi.string().optional().allow(''),
}).unknown(true);

const languageSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required().max(100),
    proficiency: Joi.string().valid('basic', 'conversational', 'fluent', 'native').required(),
});

const contentSchema = Joi.object({
    personalInfo: personalInfoSchema.optional(),
    summary: Joi.string().optional().max(2000),
    experience: Joi.array().items(experienceSchema).optional(),
    education: Joi.array().items(educationSchema).optional(),
    skills: Joi.array().items(skillSchema).optional(),
    certifications: Joi.array().items(certificationSchema).optional(),
    projects: Joi.array().items(projectSchema).optional(),
    languages: Joi.array().items(languageSchema).optional(),
});

// Relaxed content schema for updates
const contentUpdateSchema = Joi.object({
    personalInfo: personalInfoUpdateSchema.optional(),
    summary: Joi.string().optional().allow('').max(2000),
    experience: Joi.array().items(experienceSchema).optional(),
    education: Joi.array().items(educationSchema).optional(),
    skills: Joi.array().items(skillSchema).optional(),
    certifications: Joi.array().items(certificationSchema).optional(),
    projects: Joi.array().items(projectSchema).optional(),
    languages: Joi.array().items(languageSchema).optional(),
});

export const createResumeSchema = Joi.object({
    title: Joi.string().required().min(1).max(255).trim(),
    templateId: Joi.string().optional().max(100),
    content: contentSchema.optional(),
});

export const updateResumeSchema = Joi.object({
    title: Joi.string().optional().min(1).max(255).trim(),
    templateId: Joi.string().optional().max(100),
    content: contentUpdateSchema.optional(),
    status: Joi.string().valid('draft', 'published').optional(),
});
