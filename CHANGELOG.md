# Changelog

## [Unreleased] - 2025-01-15

### Added
- ✅ **Auto-restart on code changes** using nodemon
  - Watches `src/` directory for changes
  - Auto-rebuilds TypeScript
  - Auto-restarts server
  - 1 second delay to batch changes
  
- ✅ **Pretty error logging** with Winston
  - Colored console output
  - Structured logging with context
  - Request/response logging
  - Error stack traces
  - Configurable log levels (debug, info, warn, error)
  
- ✅ **Request logging middleware**
  - Logs all incoming requests
  - Tracks response times
  - Shows status codes with colors
  - Includes query parameters and IP
  
- ✅ **Enhanced error handling**
  - Detailed error context (method, path, query, body)
  - Different log levels for different error types
  - Stack traces for unexpected errors
  - Production-safe error messages

### Changed
- Updated `npm run dev` to use nodemon instead of direct serverless offline
- Enhanced error middleware with structured logging
- Added request logger middleware to main handler

### Files Added
- `nodemon.json` - Nodemon configuration
- `src/utils/logger.ts` - Winston logger setup
- `src/middleware/request-logger.middleware.ts` - Request logging
- `DEV_GUIDE.md` - Development guide
- `.env.example` - Environment variables template

### Files Modified
- `package.json` - Updated dev script
- `src/handlers/index.ts` - Added request logging
- `src/middleware/error.middleware.ts` - Enhanced with Winston

## Usage

```bash
# Start dev server with auto-restart
npm run dev

# Set log level in .env
LOG_LEVEL=debug  # or info, warn, error
```
