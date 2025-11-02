import Joi from 'joi';

export const signUpSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    fullName: Joi.string().min(2).required(),
});

export const signInSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

export const updatePasswordSchema = Joi.object({
    password: Joi.string().min(8).required(),
});
