# Contributing to OmniSync AI

Thank you for your interest in contributing. This document provides guidelines for contributing to the project.

---

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/omnisync-ai.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Install dependencies: `npm install`
5. Copy environment config: `cp .env.example .env`
6. Run tests: `npm test`

## Development Setup

**Prerequisites:**
- Node.js 20+
- PostgreSQL 16
- Redis 7+
- OpenAI API key (for LLM-dependent features)

```bash
npm run dev          # Start development server with hot reload
npm test             # Run test suite
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

## Code Standards

- **Language:** TypeScript (strict mode)
- **Formatting:** Prettier (config in `.prettierrc`)
- **Linting:** ESLint with `@typescript-eslint`
- **Tests:** Vitest for unit tests, Supertest for API integration tests
- **Commits:** Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)

## Pull Request Process

1. Ensure all tests pass and there are no linting errors
2. Update documentation if you changed any interfaces or behavior
3. Write a clear PR description explaining what changed and why
4. Link related issues if applicable
5. Request review from a maintainer

## What We Need Help With

- WhatsApp template message management UI
- Scheduler state machine visualization component
- Multi-language support (Hindi, Spanish, Portuguese, Arabic)
- Load testing harness for concurrent conversations
- ERP/CRM integration connectors (SAP, Tally, Salesforce)
- Dashboard analytics charts and data visualization
- Docker Compose setup for local development
- End-to-end test coverage

## Reporting Issues

Use [GitHub Issues](https://github.com/gitswagata1/omnisync-ai/issues) with the appropriate template:
- **Bug Report** — for unexpected behavior
- **Feature Request** — for new capabilities
- **Documentation** — for docs improvements

## Code of Conduct

Be respectful, constructive, and collaborative. We're building something that helps real manufacturing workers do their jobs better.

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
