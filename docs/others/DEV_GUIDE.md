# Development Guide

## 🚀 Quick Start

### Start Development Server with Auto-Restart

```bash
npm run dev
```

This will:
- ✅ Watch for file changes in `src/` directory
- ✅ Auto-rebuild TypeScript on changes
- ✅ Auto-restart server
- ✅ Show pretty colored logs
- ✅ Clear console on each restart

### Alternative Commands

```bash
# Start without auto-restart (direct)
npm run dev:direct

# Build only
npm run build

# Run tests
npm test
```

## 📝 Logging

### Log Levels

The application uses Winston for structured logging with these levels:

- `error` - Error messages (red)
- `warn` - Warning messages (yellow)
- `info` - Informational messages (green)
- `debug` - Debug messages (blue)

### Setting Log Level

In your `.env` file:

```env
LOG_LEVEL=debug  # Show all logs
LOG_LEVEL=info   # Default - show info, warn, error
LOG_LEVEL=warn   # Only warnings and errors
LOG_LEVEL=error  # Only errors
```

### Log Output Examples

**Request logs:**
```
2025-01-15 10:30:45 [info]: → POST /auth/signin
2025-01-15 10:30:45 [info]: ← POST /auth/signin 200 { duration: '45ms', statusCode: 200 }
```

**Error logs:**
```
2025-01-15 10:31:12 [error]: Application error {
  error: 'Invalid credentials',
  method: 'POST',
  path: '/auth/signin',
  statusCode: 401
}
```

**Debug logs:**
```
2025-01-15 10:32:00 [debug]: Health check requested
```

## 🔧 Development Workflow

### 1. Make Changes

Edit any file in `src/` directory:
- `src/handlers/` - API route handlers
- `src/services/` - Business logic
- `src/middleware/` - Express middleware
- `src/utils/` - Utility functions

### 2. Auto-Restart

Nodemon will automatically:
1. Detect your changes
2. Clear the console
3. Rebuild TypeScript
4. Restart the server
5. Show "✅ Build complete! Starting server..."

### 3. Test Your Changes

```bash
# Health check
curl http://localhost:3001/health

# Sign up
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'
```

## 🐛 Debugging

### View Detailed Logs

Set `LOG_LEVEL=debug` in `.env` to see all logs including:
- Request details
- Query parameters
- Response times
- Database queries (if enabled)

### Common Issues

**Port already in use:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>
```

**Build errors:**
```bash
# Clean build
rm -rf dist/
npm run build
```

**Nodemon not restarting:**
```bash
# Check nodemon.json configuration
# Ensure you're editing files in src/ directory
```

## 📊 Request/Response Logging

All HTTP requests are automatically logged with:
- Method and path
- Query parameters (if present)
- Response status code
- Response time
- IP address

Example:
```
[info]: → GET /users/me { query: undefined, ip: '::1' }
[info]: ← GET /users/me 200 { duration: '23ms', statusCode: 200 }
```

## 🎨 Log Colors

- 🟢 Green - Successful requests (2xx)
- 🟡 Yellow - Redirects/warnings (3xx)
- 🔴 Red - Errors (4xx, 5xx)
- 🔵 Blue - Debug information

## 📁 Log Files (Production)

In production, logs are saved to:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs

These files are automatically created when `NODE_ENV=production`.

## 🔥 Hot Tips

1. **Keep terminal visible** - Watch logs in real-time
2. **Use LOG_LEVEL=debug** - When troubleshooting
3. **Check response times** - Optimize slow endpoints
4. **Monitor error patterns** - Fix recurring issues
5. **Clear logs** - Nodemon clears console on restart

## 🚦 Status Codes

The logger automatically colors responses based on status:
- 2xx (Success) - Green
- 3xx (Redirect) - Yellow  
- 4xx (Client Error) - Red
- 5xx (Server Error) - Red

## 📚 Additional Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Nodemon Documentation](https://nodemon.io/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
