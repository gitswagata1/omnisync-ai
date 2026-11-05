# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in OmniSync AI, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Email: security@omnisync.ai

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for resolution.

## Security Architecture

| Layer | Mechanism |
|:------|:----------|
| Webhook verification | HMAC-SHA256 signature validation on all inbound webhooks |
| Agent identity | HMAC-SHA256 hash binding agent credentials to system secret |
| API authentication | JWT (RS256) with role-based claims |
| Data at rest | PostgreSQL encrypted storage; S3 server-side encryption |
| Access control | RBAC enforced at service layer before every message operation |
| Audit trail | Immutable log of every action with actor, timestamp, and target |
| Rate limiting | Per-agent and global rate limits on all API endpoints |

## Supported Versions

| Version | Supported |
|:--------|:----------|
| 1.x (current) | Yes |
| < 1.0 | No |
