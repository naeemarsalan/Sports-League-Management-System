# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| dev     | Yes                |
| new     | Yes (main branch)  |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email the maintainers with details of the vulnerability
3. Include steps to reproduce the issue
4. Allow reasonable time for a fix before public disclosure

## Automated Security Scanning

This project uses the following automated security tools:

| Tool | Purpose | Trigger |
|------|---------|---------|
| **Gitleaks** | Secret detection | PR, pre-commit |
| **Semgrep** | JavaScript/Node.js SAST | PR |
| **Bandit** | Python SAST | PR, pre-commit |
| **Trivy** | Config & filesystem scanning | PR |
| **npm audit** | Dependency vulnerabilities | PR |
| **Dependency Review** | New dependency vetting | PR only |
| **license-checker** | License compliance | PR |
| **ESLint Security** | JS security linting | Pre-commit |

## Development Security Guidelines

### Secure Randomness

- **Use** `crypto.randomUUID()` or `crypto.getRandomValues()` in Node.js
- **Use** `expo-crypto` (`Crypto.getRandomValues()`) in React Native
- **Never use** `Math.random()` for security-sensitive values (IDs, tokens, codes)

### Authorization

- Always verify `userId` ownership in server functions by comparing against `req.headers['x-appwrite-user-id']`
- Use `Role.user(userId)` for write/delete permissions, not `Role.users()`
- Never trust `userId` from the request body without verification

### Input Sanitization

- Sanitize user-provided strings before including in notifications
- Strip HTML tags and limit string lengths
- Validate and sanitize all external input at system boundaries

### Permissions

- Use `Permission.read(Role.users())` for read access (all authenticated users)
- Use `Permission.update(Role.user(specificUserId))` for write access (specific users only)
- Use `Permission.delete(Role.user(specificUserId))` for delete access (specific users only)

## Pre-commit Hooks

Install pre-commit hooks to catch issues before they reach CI:

```bash
# Install pre-commit (if not already installed)
pip install pre-commit
# or: brew install pre-commit

# Install the hooks
npm run precommit:install
# or: pre-commit install

# Run manually against all files
pre-commit run --all-files
```
