import { prisma } from '../utils/prisma';
import { CreateResumeData, UpdateResumeData, Resume, ResumeListOptions, ResumeSearchOptions, ResumeContent } from '../types/resume.types';
import { ShareResumeResponse, PublicResumeView, ResumeAnalytics } from '../types/sharing.types';
import { ExportedResume, ImportResumeData, BulkExportData } from '../types/import-export.types';
import { checkSubscriptionLimits } from '../utils/subscription-limits';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors';
import { Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

export class ResumeService {
    async create(userId: string, data: CreateResumeData): Promise<Resume> {
        // Check subscription limits
        const canCreate = await checkSubscriptionLimits(userId, 'max_resumes');
        if (!canCreate) {
            throw new ForbiddenError('Resume limit reached for your subscription tier');
        }

        const resume = await prisma.resume.create({
            data: {
                userId,
                title: data.title,
                templateId: data.templateId || 'modern',
                content: (data.content || {}) as Prisma.InputJsonValue,
                status: 'draft',
            },
        });

        // Update user resume count
        await this.updateResumeCount(userId);

        return resume as Resume;
    }

    async getById(resumeId: string, userId: string): Promise<Resume> {
        const resume = await prisma.resume.findFirst({
            where: {
                id: resumeId,
                userId,
                deletedAt: null,
            },
        });

        if (!resume) {
            throw new NotFoundError('Resume not found');
        }

        return resume as Resume;
    }

    async list(
        userId: string,
        options: ResumeListOptions = {}
    ): Promise<{ resumes: Resume[]; total: number }> {
        const {
            page = 1,
            limit = 10,
            status,
            template,
            sortBy = 'updatedAt',
            sortOrder = 'desc'
        } = options;
        const offset = (page - 1) * limit;

        const where: Prisma.ResumeWhereInput = {
            userId,
            deletedAt: null,
            ...(status && { status }),
            ...(template && { templateId: template }),
        };

        // Build orderBy clause
        const orderBy: Prisma.ResumeOrderByWithRelationInput = {};
        if (sortBy === 'title') {
            orderBy.title = sortOrder;
        } else if (sortBy === 'createdAt') {
            orderBy.createdAt = sortOrder;
        } else {
            orderBy.updatedAt = sortOrder;
        }

        const [resumes, total] = await Promise.all([
            prisma.resume.findMany({
                where,
                orderBy,
                skip: offset,
                take: limit,
            }),
            prisma.resume.count({ where }),
        ]);

        return {
            resumes: resumes as Resume[],
            total,
        };
    }

    async search(
        userId: string,
        query: string,
        options: ResumeSearchOptions = {}
    ): Promise<{ resumes: Resume[]; total: number }> {
        const {
            page = 1,
            limit = 10,
            status,
            template,
            sortBy = 'relevance',
            sortOrder = 'desc'
        } = options;
        const offset = (page - 1) * limit;

        // Build search conditions
        const searchTerms = query.trim().toLowerCase();

        if (!searchTerms) {
            // If no search query, return regular list
            const listOptions: ResumeListOptions = {
                page: options.page,
                limit: options.limit,
                status: options.status,
                template: options.template,
                sortBy: options.sortBy === 'relevance' ? 'updatedAt' : options.sortBy,
                sortOrder: options.sortOrder,
            };
            return this.list(userId, listOptions);
        }

        // Search in title, description, and content
        const where: Prisma.ResumeWhereInput = {
            userId,
            deletedAt: null,
            ...(status && { status }),
            ...(template && { templateId: template }),
            OR: [
                {
                    title: {
                        contains: searchTerms,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: searchTerms,
                        mode: 'insensitive',
                    },
                },
                // Search in JSON content (Prisma supports JSON path queries)
                {
                    content: {
                        path: ['personalInfo', 'fullName'],
                        string_contains: searchTerms,
                    },
                },
                {
                    content: {
                        path: ['summary'],
                        string_contains: searchTerms,
                    },
                },
            ],
        };

        // Build orderBy clause
        let orderBy: Prisma.ResumeOrderByWithRelationInput = {};
        if (sortBy === 'relevance') {
            // For relevance, prioritize title matches, then sort by updated date
            orderBy = { updatedAt: 'desc' };
        } else if (sortBy === 'title') {
            orderBy.title = sortOrder;
        } else if (sortBy === 'createdAt') {
            orderBy.createdAt = sortOrder;
        } else {
            orderBy.updatedAt = sortOrder;
        }

        const [resumes, total] = await Promise.all([
            prisma.resume.findMany({
                where,
                orderBy,
                skip: offset,
                take: limit,
            }),
            prisma.resume.count({ where }),
        ]);

        return {
            resumes: resumes as Resume[],
            total,
        };
    }

    async update(resumeId: string, userId: string, updates: UpdateResumeData): Promise<Resume> {
        // Verify ownership
        await this.getById(resumeId, userId);

        const updateData: Prisma.ResumeUpdateInput = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.templateId !== undefined) updateData.templateId = updates.templateId;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.content !== undefined) updateData.content = updates.content as Prisma.InputJsonValue;

        const resume = await prisma.resume.update({
            where: { id: resumeId },
            data: updateData,
        });

        return resume as Resume;
    }

    async delete(resumeId: string, userId: string): Promise<void> {
        // Verify ownership
        await this.getById(resumeId, userId);

        // Soft delete
        await prisma.resume.update({
            where: { id: resumeId },
            data: { deletedAt: new Date() },
        });

        // Update user resume count
        await this.updateResumeCount(userId);
    }

    async share(resumeId: string, userId: string): Promise<ShareResumeResponse> {
        // Verify ownership
        const resume = await this.getById(resumeId, userId);

        // Check if already shared
        if (resume.isPublic && resume.publicSlug) {
            return {
                slug: resume.publicSlug,
                url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/${resume.publicSlug}`,
                isPublic: true,
            };
        }

        // Generate unique slug
        const slug = nanoid(12);

        // Update resume to be public
        await prisma.resume.update({
            where: { id: resumeId },
            data: {
                isPublic: true,
                publicSlug: slug,
            },
        });

        return {
            slug,
            url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/${slug}`,
            isPublic: true,
        };
    }

    async getPublicResume(slug: string): Promise<PublicResumeView> {
        const resume = await prisma.resume.findFirst({
            where: {
                publicSlug: slug,
                isPublic: true,
                deletedAt: null,
            },
        });

        if (!resume) {
            throw new NotFoundError('Public resume not found');
        }

        // Increment view count
        await prisma.resume.update({
            where: { id: resume.id },
            data: { viewCount: { increment: 1 } },
        });

        return {
            id: resume.id,
            title: resume.title,
            templateId: resume.templateId,
            content: resume.content,
            viewCount: resume.viewCount + 1,
            createdAt: resume.createdAt,
            updatedAt: resume.updatedAt,
        };
    }

    async unshare(resumeId: string, userId: string): Promise<void> {
        // Verify ownership
        await this.getById(resumeId, userId);

        // Update resume to be private
        await prisma.resume.update({
            where: { id: resumeId },
            data: {
                isPublic: false,
                publicSlug: null,
            },
        });
    }

    async getAnalytics(resumeId: string, userId: string): Promise<ResumeAnalytics> {
        // Verify ownership
        const resume = await this.getById(resumeId, userId);

        return {
            resumeId: resume.id,
            viewCount: resume.viewCount,
            exportCount: resume.exportCount,
            lastViewedAt: null, // Can be enhanced with view tracking table
            lastExportedAt: resume.lastExportedAt,
        };
    }

    async updateShareSettings(
        resumeId: string,
        userId: string,
        isPublic: boolean
    ): Promise<Resume> {
        // Verify ownership
        await this.getById(resumeId, userId);

        const updateData: Prisma.ResumeUpdateInput = {
            isPublic,
        };

        // If making private, clear the slug
        if (!isPublic) {
            updateData.publicSlug = null;
        } else if (isPublic) {
            // If making public and no slug exists, generate one
            const resume = await prisma.resume.findUnique({
                where: { id: resumeId },
                select: { publicSlug: true },
            });

            if (!resume?.publicSlug) {
                updateData.publicSlug = nanoid(12);
            }
        }

        const updatedResume = await prisma.resume.update({
            where: { id: resumeId },
            data: updateData,
        });

        return updatedResume as Resume;
    }

    async export(resumeId: string, userId: string): Promise<ExportedResume> {
        const resume = await this.getById(resumeId, userId);

        // Update export count
        await prisma.resume.update({
            where: { id: resumeId },
            data: {
                exportCount: { increment: 1 },
                lastExportedAt: new Date(),
            },
        });

        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            resume: {
                title: resume.title,
                templateId: resume.templateId,
                content: resume.content as ResumeContent,
                status: resume.status,
            },
        };
    }

    async import(userId: string, data: ImportResumeData): Promise<Resume> {
        // Validate import data
        if (!data.resume || !data.resume.content) {
            throw new BadRequestError('Invalid import data: resume content is required');
        }

        // Check version compatibility
        if (data.version && data.version !== '1.0') {
            throw new BadRequestError(`Unsupported import version: ${data.version}`);
        }

        // Check subscription limits
        const canCreate = await checkSubscriptionLimits(userId, 'max_resumes');
        if (!canCreate) {
            throw new ForbiddenError('Resume limit reached for your subscription tier');
        }

        // Create resume from imported data
        const resume = await prisma.resume.create({
            data: {
                userId,
                title: data.resume.title || 'Imported Resume',
                templateId: data.resume.templateId || 'modern',
                content: data.resume.content as Prisma.InputJsonValue,
                status: 'draft',
            },
        });

        // Update user resume count
        await this.updateResumeCount(userId);

        return resume as Resume;
    }

    async duplicate(resumeId: string, userId: string): Promise<Resume> {
        // Get original resume
        const original = await this.getById(resumeId, userId);

        // Check subscription limits
        const canCreate = await checkSubscriptionLimits(userId, 'max_resumes');
        if (!canCreate) {
            throw new ForbiddenError('Resume limit reached for your subscription tier');
        }

        // Create duplicate
        const duplicate = await prisma.resume.create({
            data: {
                userId,
                title: `${original.title} (Copy)`,
                templateId: original.templateId,
                content: original.content as Prisma.InputJsonValue,
                status: 'draft',
            },
        });

        // Update user resume count
        await this.updateResumeCount(userId);

        return duplicate as Resume;
    }

    async bulkExport(userId: string, resumeIds?: string[]): Promise<BulkExportData> {
        // Build where clause
        const where: Prisma.ResumeWhereInput = {
            userId,
            deletedAt: null,
            ...(resumeIds && resumeIds.length > 0 && { id: { in: resumeIds } }),
        };

        const resumes = await prisma.resume.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
        });

        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            resumes: resumes.map((resume) => ({
                id: resume.id,
                title: resume.title,
                templateId: resume.templateId,
                content: resume.content as ResumeContent,
                status: resume.status,
                createdAt: resume.createdAt.toISOString(),
                updatedAt: resume.updatedAt.toISOString(),
            })),
        };
    }

    private async updateResumeCount(userId: string): Promise<void> {
        const count = await prisma.resume.count({
            where: {
                userId,
                deletedAt: null,
            },
        });

        await prisma.user.update({
            where: { id: userId },
            data: { resumeCount: count },
        });
    }
}
