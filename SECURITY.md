# Security Policy

## Supported Versions

We actively support the following versions of GitSwitch with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities in GitSwitch seriously. If you discover a security vulnerability, please follow these guidelines:

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities by:

1. **Email**: Send details to the project maintainers through GitHub
2. **GitHub Security Advisories**: Use GitHub's private vulnerability reporting feature
3. **Direct Contact**: Contact project maintainers directly

### What to Include

Please include the following information in your report:

- **Description**: A clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact**: What the vulnerability could allow an attacker to do
- **Affected Versions**: Which versions of GitSwitch are affected
- **Environment**: OS, Node.js version, and other relevant details
- **Proof of Concept**: If possible, include a minimal example (without causing harm)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Regular Updates**: We will keep you informed of our progress
- **Resolution Timeline**: We aim to resolve critical vulnerabilities within 30 days
- **Credit**: With your permission, we will credit you in the security advisory

## Security Best Practices

When using GitSwitch, follow these security best practices:

### For Users

1. **Keep Updated**: Always use the latest version of GitSwitch
2. **Verify Downloads**: Only download GitSwitch from official sources
3. **Review Permissions**: Be aware of what permissions GitSwitch requires
4. **Secure Configuration**: Keep your git configuration files secure
5. **Environment Variables**: Don't expose sensitive information in environment variables

### For Contributors

1. **Dependency Security**: Regularly audit and update dependencies
2. **Input Validation**: Always validate user input and file paths
3. **Secure Defaults**: Use secure defaults in all configurations
4. **Error Handling**: Don't expose sensitive information in error messages
5. **Authentication**: Implement secure authentication mechanisms

## Security Features

GitSwitch implements several security features:

- **Local Storage**: All data is stored locally, not transmitted to external servers
- **Path Validation**: File paths are validated to prevent directory traversal
- **Input Sanitization**: User input is sanitized to prevent injection attacks
- **Minimal Permissions**: GitSwitch requests only necessary system permissions

## Known Security Considerations

- **Git Configuration**: GitSwitch modifies git configuration files - ensure these files have appropriate permissions
- **File System Access**: GitSwitch requires file system access to manage git repositories
- **Process Execution**: GitSwitch executes git commands - ensure git is from a trusted source

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Acknowledgment sent
3. **Day 3-7**: Initial assessment and triage
4. **Day 8-30**: Development of fix and testing
5. **Day 30+**: Public disclosure (coordinated with reporter)

## Security Updates

Security updates will be:

- Released as soon as possible after a fix is developed
- Clearly marked in release notes
- Communicated through GitHub releases and security advisories
- Backwards compatible when possible

## Contact

For security-related questions or concerns:

- **Security Issues**: Use GitHub's private vulnerability reporting
- **General Questions**: Open a GitHub issue (for non-sensitive matters)
- **Urgent Matters**: Contact project maintainers directly

## Acknowledgments

We thank the security research community for helping keep GitSwitch and our users safe. Contributors who report valid security vulnerabilities will be acknowledged in our security advisories (with their permission).

---

**Note**: This security policy applies to the GitSwitch project and its official distribution channels. For security issues with third-party distributions or modifications, please contact the respective maintainers.