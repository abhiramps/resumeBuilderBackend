import { prisma } from '../utils/prisma';
import { CreateResumeData, UpdateResumeData, Resume, ResumeListOptions } from '../types/resume.types';
import { checkSubscriptionLimits } from '../utils/subscription-limits';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { Prisma } from '@prisma/client';

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
        const { page = 1, limit = 10, status, template } = options;
        const offset = (page - 1) * limit;

        const where = {
            userId,
            deletedAt: null,
            ...(status && { status }),
            ...(template && { templateId: template }),
        };

        const [resumes, total] = await Promise.all([
            prisma.resume.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
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
