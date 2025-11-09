# Kiro Steering Rules - Summary

## What Are Steering Rules?

Kiro steering rules are markdown files that provide context, guidelines, and best practices to AI assistants during development. They ensure consistency, quality, and adherence to project standards.

## Created Steering Rules

### Backend (.kiro/steering/)

**1. project-guidelines.md** (Always Active)
- Project context and status
- Technology stack (Node.js 22.x, TypeScript 5.x, Prisma 6.x)
- Coding standards and conventions
- Prisma best practices
- API design patterns
- Error handling
- Testing guidelines
- Performance optimization
- Common pitfalls

**2. security-guidelines.md** (Always Active)
- Authentication & authorization
- Input validation
- SQL injection prevention
- Password security
- JWT security
- Stripe webhook security
- Rate limiting
- CORS configuration
- Environment variables
- Logging best practices
- Security testing

**3. README.md**
- Overview of steering rules
- How they work
- Usage guidelines
- Key principles
- Project status

### Frontend (.kiro/steering/)

**1. project-guidelines.md** (Always Active)
- Project context (Task 35 complete)
- Technology stack (React 18, TypeScript, Vite, Tailwind)
- Coding standards
- Component patterns
- State management
- Styling guidelines
- Performance optimization
- Testing
- Accessibility

**2. ats-compliance.md** (Always Active)
- ATS-safe practices
- What to avoid
- Validation rules
- PDF export requirements
- Warning system
- Testing checklist
- **Critical:** ATS compliance is non-negotiable

**3. README.md**
- Overview of steering rules
- How they work
- Usage guidelines
- Key principles
- ATS compliance emphasis

## How They Work

### Automatic Inclusion

Both projects have steering rules marked with `inclusion: always`:
```markdown
---
inclusion: always
---
```

This means they're automatically included in every AI interaction, providing consistent context.

### Benefits

**For Developers:**
- Consistent code quality
- Automatic adherence to best practices
- Reduced need to remember all conventions
- Faster onboarding for new team members

**For AI Assistants:**
- Clear guidelines for code generation
- Project-specific context
- Security and compliance awareness
- Pattern consistency

## Key Principles

### Backend

1. **Type Safety First** - TypeScript strict mode, Prisma for type-safe DB
2. **Security by Default** - JWT auth, input validation, RLS
3. **Serverless Architecture** - Stateless, optimized for Lambda

### Frontend

1. **ATS Compliance First** - Every feature must be ATS-compatible
2. **Type Safety** - TypeScript strict mode
3. **Component Architecture** - Functional components, hooks, composition

## Critical Rules

### Backend Security (Non-Negotiable)

- ✅ Always authenticate protected routes
- ✅ Always validate user input
- ✅ Always verify resource ownership
- ✅ Never expose sensitive data in errors
- ✅ Never commit secrets to git
- ✅ Always verify Stripe webhook signatures
- ✅ Always use parameterized queries (Prisma handles this)

### Frontend ATS Compliance (Non-Negotiable)

- ✅ Use simple, parseable HTML (no tables for layout)
- ✅ Use standard section headers
- ✅ Use ATS-safe fonts only
- ✅ Keep text selectable (no images/canvas for text)
- ✅ Use simple bullet points
- ✅ No graphics in resume content
- ✅ Validate ATS score in real-time

## Usage Examples

### When Implementing a Feature

**Backend Example:**
```typescript
// AI will suggest code following steering rules:
// - Type-safe with Prisma
// - Authenticated route
// - Input validation
// - Error handling
// - Logging

router.post(
  '/resumes',
  authenticate,
  validateRequest(createResumeSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const resume = await resumeService.create(req.user!.id, req.body);
      logger.info('Resume created', { userId: req.user!.id, resumeId: resume.id });
      res.status(201).json(resume);
    } catch (error) {
      next(error);
    }
  }
);
```

**Frontend Example:**
```typescript
// AI will suggest code following steering rules:
// - ATS-compliant HTML
// - Type-safe TypeScript
// - Proper component structure
// - Tailwind styling

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ items }) => {
  return (
    <div className="resume-section">
      <h2 className="text-xl font-semibold mb-4">Work Experience</h2>
      {items.map((item) => (
        <div key={item.id} className="mb-4">
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-gray-600">{item.company}</p>
          <ul className="list-disc ml-5 mt-2">
            {item.responsibilities.map((resp, idx) => (
              <li key={idx}>{resp}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
```

## Updating Steering Rules

As the project evolves, update steering rules to reflect:
- New patterns and conventions
- Lessons learned
- Common mistakes to avoid
- New best practices

### To Update:

1. Edit the relevant `.md` file in `.kiro/steering/`
2. Commit changes to git
3. Kiro will automatically use updated rules

## Testing Steering Rules

### Backend

Test that generated code:
- Uses Prisma correctly
- Includes authentication
- Validates input
- Handles errors
- Logs appropriately
- Follows security guidelines

### Frontend

Test that generated code:
- Maintains ATS compliance
- Uses TypeScript properly
- Follows component patterns
- Uses Tailwind correctly
- Is accessible

## Common Scenarios

### Scenario 1: Adding New API Endpoint

**Steering rules ensure:**
- Authentication middleware applied
- Input validation schema defined
- Service layer separation
- Error handling
- Logging
- Type safety

### Scenario 2: Creating New Component

**Steering rules ensure:**
- ATS-compliant HTML
- TypeScript interfaces
- Proper props typing
- Tailwind styling
- Accessibility attributes
- Performance optimization

### Scenario 3: Database Query

**Steering rules ensure:**
- Prisma client usage
- Type-safe queries
- Row-level security
- Error handling
- Soft delete consideration

## Benefits Realized

### Code Quality
- Consistent patterns across codebase
- Fewer bugs from common mistakes
- Better maintainability

### Security
- Automatic security best practices
- Reduced vulnerability risk
- Consistent authentication/authorization

### ATS Compliance
- Every feature maintains compatibility
- Real-time validation
- User warnings for issues

### Developer Experience
- Faster development
- Less context switching
- Automatic best practices
- Easier code reviews

## Resources

### Backend
- [Project Guidelines](.kiro/steering/project-guidelines.md)
- [Security Guidelines](.kiro/steering/security-guidelines.md)
- [Task List](docs/task_list.md)
- [Architecture](docs/architecture_recommendation.md)

### Frontend
- [Project Guidelines](../resumeBuilderFrontend/.kiro/steering/project-guidelines.md)
- [ATS Compliance](../resumeBuilderFrontend/.kiro/steering/ats-compliance.md)
- [Task List](../resumeBuilderFrontend/docs/task_list_optimized.md)

## Summary

Kiro steering rules provide:
- ✅ Automatic context for AI assistants
- ✅ Consistent code quality
- ✅ Security best practices
- ✅ ATS compliance enforcement
- ✅ Project-specific conventions
- ✅ Reduced cognitive load
- ✅ Faster development
- ✅ Better maintainability

**Result:** Higher quality code that follows best practices automatically, with special emphasis on security (backend) and ATS compliance (frontend).

---

**Ready to develop with confidence!** 🚀

The steering rules ensure that every line of code generated follows project standards, maintains security, and preserves ATS compatibility.
