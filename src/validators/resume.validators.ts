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

const experienceSchema = Joi.object({
    id: Joi.string().required(),
    company: Joi.string().required().max(255),
    position: Joi.string().required().max(255),
    location: Joi.string().optional().max(255),
    startDate: Joi.string().required(),
    endDate: Joi.string().optional().allow(''),
    current: Joi.boolean().required(),
    description: Joi.string().required().max(2000),
    highlights: Joi.array().items(Joi.string().max(500)).optional(),
});

const educationSchema = Joi.object({
    id: Joi.string().required(),
    institution: Joi.string().required().max(255),
    degree: Joi.string().required().max(255),
    field: Joi.string().required().max(255),
    location: Joi.string().optional().max(255),
    startDate: Joi.string().required(),
    endDate: Joi.string().optional().allow(''),
    gpa: Joi.string().optional().max(10),
    description: Joi.string().optional().max(1000),
});

const skillSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required().max(100),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
    category: Joi.string().optional().max(100),
});

const certificationSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required().max(255),
    issuer: Joi.string().required().max(255),
    date: Joi.string().required(),
    expiryDate: Joi.string().optional().allow(''),
    credentialId: Joi.string().optional().max(255),
    url: Joi.string().uri().optional(),
});

const projectSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required().max(255),
    description: Joi.string().required().max(2000),
    technologies: Joi.array().items(Joi.string().max(100)).optional(),
    url: Joi.string().uri().optional(),
    github: Joi.string().uri().optional(),
    startDate: Joi.string().optional(),
    endDate: Joi.string().optional().allow(''),
});

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

export const createResumeSchema = Joi.object({
    title: Joi.string().required().min(1).max(255).trim(),
    templateId: Joi.string().optional().max(100),
    content: contentSchema.optional(),
});

export const updateResumeSchema = Joi.object({
    title: Joi.string().optional().min(1).max(255).trim(),
    templateId: Joi.string().optional().max(100),
    content: contentSchema.optional(),
    status: Joi.string().valid('draft', 'published').optional(),
});
