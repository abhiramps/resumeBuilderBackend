import Joi from 'joi';

export const createVersionSchema = Joi.object({
    versionName: Joi.string().optional().max(255).trim(),
    changesSummary: Joi.string().optional().max(1000).trim(),
});
