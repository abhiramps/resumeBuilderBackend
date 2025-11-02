# Kiro Steering Rules - Backend

## Overview

This directory contains Kiro steering rules that provide context and guidelines for AI-assisted development of the Resume Builder backend.

## Steering Files

### 1. project-guidelines.md (Always Included)
**Purpose:** Core development guidelines and best practices

**Contains:**
- Project context and current status
- Technology stack details
- Coding standards (TypeScript, Prisma, Express)
- File naming conventions
- Component patterns
- Error handling
- Testing guidelines
- API design patterns
- Common pitfalls to avoid

**When to reference:** Always active - provides foundation for all development

---

### 2. security-guidelines.md (Always Included)
**Purpose:** Security best practices and requirements

**Contains:**
- Authentication & authorization patterns
- Input validation requirements
- SQL injection prevention
- Password security
- JWT security
- Stripe webhook security
- Rate limiting
- CORS configuration
- Environment variable management
- Error handling (without exposing sensitive data)
- Logging best practices
- Security testing

**When to reference:** Always active - security is non-negotiable

---

## How Steering Rules Work

### Inclusion Types

**1. Always Included (`inclusion: always`)**
- Automatically included in every AI interaction
- Provides consistent context across all tasks
- Both current steering files use this

**2. Conditional Inclusion (`inclusion: fileMatch`)**
- Included when specific files are being worked on
- Example: Database-specific rules when editing Prisma schema

**3. Manual Inclusion (`inclusion: manual`)**
- Included only when explicitly referenced with `#` in chat
- Useful for specialized contexts

### File References

Steering files can reference other files:
```markdown
See the complete schema in #[[file:prisma/schema.prisma]]
```

## Usage Guidelines

### For Developers

When working on the backend:
1. These rules are automatically applied by Kiro
2. Follow the patterns and conventions outlined
3. Reference specific sections when needed
4. Update rules as project evolves

### For AI Assistants

When helping with backend development:
1. Always follow project-guidelines.md conventions
2. Always apply security-guidelines.md requirements
3. Suggest code that matches established patterns
4. Point out security issues proactively
5. Maintain consistency with existing codebase

## Key Principles

### From project-guidelines.md

1. **Type Safety First** - Use TypeScript strict mode, Prisma for type-safe DB access
2. **Security by Default** - JWT auth, input validation, RLS
3. **Serverless Architecture** - Stateless functions, connection pooling, optimize for cold starts

### From security-guidelines.md

1. **Never trust user input** - Validate everything
2. **Principle of least privilege** - Minimum necessary access
3. **Defense in depth** - Multiple security layers
4. **Fail securely** - Default to deny access
5. **Keep secrets secret** - Never commit credentials

## Adding New Steering Rules

To add new steering rules:

1. Create new `.md` file in this directory
2. Add frontmatter with inclusion type:
```markdown
---
inclusion: always
---
```

3. Document specific guidelines or context
4. Reference from other files if needed

### Suggested Additional Rules

Consider adding:
- `database-guidelines.md` - Prisma-specific patterns (conditional on schema files)
- `api-design.md` - REST API conventions (conditional on handler files)
- `testing-guidelines.md` - Testing patterns and requirements
- `deployment-guidelines.md` - AWS Lambda deployment specifics

## Current Project Status

**Backend Status:** Task 0 (Ready to start)
**Frontend Status:** Task 35 (Nearly complete)

**Next Steps:**
1. Follow Task 1: Project Initialization
2. Set up Prisma with Supabase
3. Implement authentication (Tasks 6-10)
4. Build resume management (Tasks 11-15)
5. Add subscriptions & payments (Tasks 19-23)

## Resources

- [Project Documentation](../docs/)
- [Task List](../docs/task_list.md)
- [Architecture Recommendation](../docs/architecture_recommendation.md)
- [Database Schema](../docs/database_schema.md)
- [Prisma Setup Guide](../docs/prompts/00_prisma_setup.md)

## Questions?

When implementing features:
1. Check steering rules for patterns
2. Follow established conventions
3. Maintain security standards
4. Write tests
5. Update documentation

**Remember:** These rules ensure consistency, security, and quality across the entire backend codebase.
