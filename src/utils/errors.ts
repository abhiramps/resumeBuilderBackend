export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad Request', code?: string, details?: any) {
        super(400, message, code, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized', code?: string, details?: any) {
        super(401, message, code, details);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden', code?: string, details?: any) {
        super(403, message, code, details);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Not Found', code?: string, details?: any) {
        super(404, message, code, details);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict', code?: string, details?: any) {
        super(409, message, code, details);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Internal Server Error', code?: string, details?: any) {
        super(500, message, code, details);
    }
}

// AI Import specific errors
export class FileValidationError extends BadRequestError {
    constructor(message: string, details?: any) {
        super(message, 'FILE_VALIDATION_ERROR', details);
    }
}

export class FileParsingError extends BadRequestError {
    constructor(message: string, details?: any) {
        super(message, 'FILE_PARSING_ERROR', details);
    }
}

export class AIExtractionError extends BadRequestError {
    constructor(message: string, details?: any) {
        super(message, 'AI_EXTRACTION_ERROR', details);
    }
}

export class AITimeoutError extends BadRequestError {
    constructor(message: string = 'AI extraction timed out', details?: any) {
        super(message, 'AI_TIMEOUT_ERROR', details);
    }
}

export class AIRateLimitError extends BadRequestError {
    constructor(message: string = 'AI service rate limit exceeded', details?: any) {
        super(message, 'AI_RATE_LIMIT_ERROR', details);
    }
}

export class ContentValidationError extends BadRequestError {
    constructor(message: string, details?: any) {
        super(message, 'CONTENT_VALIDATION_ERROR', details);
    }
}

export class PartialImportError extends BadRequestError {
    constructor(message: string, details?: any) {
        super(message, 'PARTIAL_IMPORT_ERROR', details);
    }
}
