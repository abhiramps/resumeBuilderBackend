import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for pretty console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add stack trace for errors
    if (stack) {
        msg += `\n${stack}`;
    }

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
        msg += `\n${JSON.stringify(metadata, null, 2)}`;
    }

    return msg;
});

// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
    ),
    transports: [
        // Console transport with colors
        new winston.transports.Console({
            format: combine(
                colorize(),
                consoleFormat
            ),
        }),
    ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    logger.add(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: combine(
                timestamp(),
                winston.format.json()
            ),
        })
    );

    logger.add(
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: combine(
                timestamp(),
                winston.format.json()
            ),
        })
    );
}

export default logger;
