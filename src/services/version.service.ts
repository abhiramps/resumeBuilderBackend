import { prisma } from '../utils/prisma';
import { ResumeVersion, CreateVersionData, CompareVersionsResult, VersionDiff } from '../types/version.types';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export class VersionService {
    async createVersion(
        resumeId: string,
        userId: string,
        data: CreateVersionData = {}
    ): Promise<ResumeVersion> {
        // Get current resume
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

        // Get next version number
        const count = await prisma.resumeVersion.count({
            where: { resumeId },
        });

        const versionNumber = count + 1;

        // Create version
        const version = await prisma.resumeVersion.create({
            data: {
                resumeId,
                userId,
                versionNumber,
                versionName: data.versionName || `Version ${versionNumber}`,
                content: resume.content as Prisma.InputJsonValue,
                templateId: resume.templateId,
                changesSummary: data.changesSummary || null,
                createdBy: userId,
            },
        });

        return version as ResumeVersion;
    }

    async listVersions(resumeId: string, userId: string): Promise<ResumeVersion[]> {
        // Verify resume ownership
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

        const versions = await prisma.resumeVersion.findMany({
            where: {
                resumeId,
                userId,
            },
            orderBy: { versionNumber: 'desc' },
        });

        return versions as ResumeVersion[];
    }

    async getVersionById(
        resumeId: string,
        versionId: string,
        userId: string
    ): Promise<ResumeVersion> {
        const version = await prisma.resumeVersion.findFirst({
            where: {
                id: versionId,
                resumeId,
                userId,
            },
        });

        if (!version) {
            throw new NotFoundError('Version not found');
        }

        return version as ResumeVersion;
    }

    async restoreVersion(
        resumeId: string,
        versionId: string,
        userId: string
    ): Promise<void> {
        // Get version
        const version = await this.getVersionById(resumeId, versionId, userId);

        // Create a new version snapshot before restoring
        await this.createVersion(resumeId, userId, {
            versionName: 'Auto-save before restore',
            changesSummary: `Restoring to version ${version.versionNumber}`,
        });

        // Update resume with version content
        await prisma.resume.update({
            where: { id: resumeId },
            data: {
                content: version.content as Prisma.InputJsonValue,
                templateId: version.templateId,
            },
        });
    }

    async compareVersions(
        resumeId: string,
        versionId1: string,
        versionId2: string,
        userId: string
    ): Promise<CompareVersionsResult> {
        const [version1, version2] = await Promise.all([
            this.getVersionById(resumeId, versionId1, userId),
            this.getVersionById(resumeId, versionId2, userId),
        ]);

        // Determine which is older
        const [oldVersion, newVersion] =
            version1.versionNumber < version2.versionNumber
                ? [version1, version2]
                : [version2, version1];

        // Calculate diff
        const diff = this.calculateDiff(oldVersion.content, newVersion.content);

        return {
            oldVersion,
            newVersion,
            diff,
        };
    }

    async deleteVersion(
        resumeId: string,
        versionId: string,
        userId: string
    ): Promise<void> {
        // Verify version exists and user owns it
        await this.getVersionById(resumeId, versionId, userId);

        // Don't allow deleting if it's the only version
        const count = await prisma.resumeVersion.count({
            where: { resumeId },
        });

        if (count <= 1) {
            throw new ForbiddenError('Cannot delete the only version');
        }

        await prisma.resumeVersion.delete({
            where: { id: versionId },
        });
    }

    async deleteOldVersions(
        resumeId: string,
        userId: string,
        keepCount: number = 10
    ): Promise<number> {
        // Verify resume ownership
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

        // Get versions to delete (keep the most recent ones)
        const versionsToDelete = await prisma.resumeVersion.findMany({
            where: { resumeId },
            orderBy: { versionNumber: 'desc' },
            skip: keepCount,
            select: { id: true },
        });

        if (versionsToDelete.length === 0) {
            return 0;
        }

        const result = await prisma.resumeVersion.deleteMany({
            where: {
                id: {
                    in: versionsToDelete.map((v) => v.id),
                },
            },
        });

        return result.count;
    }

    private calculateDiff(oldContent: any, newContent: any): VersionDiff {
        const diff: VersionDiff = {
            added: [],
            removed: [],
            modified: [],
        };

        // Get all keys from both objects
        const oldKeys = new Set(Object.keys(oldContent || {}));
        const newKeys = new Set(Object.keys(newContent || {}));

        // Find added keys
        for (const key of newKeys) {
            if (!oldKeys.has(key)) {
                diff.added!.push(key);
            }
        }

        // Find removed keys
        for (const key of oldKeys) {
            if (!newKeys.has(key)) {
                diff.removed!.push(key);
            }
        }

        // Find modified keys
        for (const key of oldKeys) {
            if (newKeys.has(key)) {
                const oldValue = JSON.stringify(oldContent[key]);
                const newValue = JSON.stringify(newContent[key]);
                if (oldValue !== newValue) {
                    diff.modified!.push(key);
                }
            }
        }

        return diff;
    }
}
