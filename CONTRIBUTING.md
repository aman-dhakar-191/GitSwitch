# Contributing to GitSwitch

Thank you for your interest in contributing to GitSwitch! We welcome contributions from developers of all skill levels.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/GitSwitch.git
   cd GitSwitch
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Build the project**:
   ```bash
   npm run build
   ```

## 🏗️ Development Workflow

GitSwitch follows a staged development approach. See our development guides:

- [`docs/development-guide.md`](./docs/development-guide.md) - How to use stage-based development
- [`docs/stage-1-mvp.md`](./docs/stage-1-mvp.md) - Current stage specifications
- [`docs/stage-2-enhanced.md`](./docs/stage-2-enhanced.md) - Next stage features
- [`docs/stage-3-advanced.md`](./docs/stage-3-advanced.md) - Advanced features

### Project Structure
```
GitSwitch/
├── packages/
│   ├── cli/           # Command-line interface
│   ├── core/          # Shared business logic
│   ├── types/         # TypeScript type definitions
│   └── gitswitch/     # Global CLI package
├── docs/              # Stage-based documentation
├── scripts/           # Development and build scripts
└── tests/             # Test suites
```

## 🔧 Development Commands

```bash
# Build all packages
npm run build

# Build individual packages
cd packages/types && npm run build
cd packages/core && npm run build
cd packages/cli && npm run build

# Run tests
npm test

# Test CLI functionality
npm run test-cli

# Development mode (with watch)
cd packages/core && npm run dev
cd packages/cli && npm run dev
```

## 🧪 Testing

Before submitting a pull request, ensure all tests pass:

```bash
# Run all tests
npm test

# Test CLI functionality
npm run test-cli

# Manual testing
npm run demo
```

## 📝 How to Contribute

### Reporting Bugs

1. **Search existing issues** to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Provide detailed information**:
   - Operating system and version
   - Node.js version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Features

1. **Check the roadmap** in [`README.md`](./README.md) to see planned features
2. **Use the feature request template**
3. **Explain the use case** and benefit to users
4. **Consider the current development stage** (refer to docs/)

### Submitting Pull Requests

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow existing code style and patterns
   - Add tests for new functionality
   - Update documentation if needed
   - Ensure all tests pass

3. **Commit your changes**:
   ```bash
   git commit -m "feat: add your feature description"
   ```
   Follow [Conventional Commits](https://conventionalcommits.org/) format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test additions/changes
   - `refactor:` for code refactoring
   - `chore:` for maintenance tasks

4. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a pull request on GitHub.

## 🎯 Code Guidelines

### TypeScript
- Use strict TypeScript settings
- Provide proper type definitions
- Avoid `any` types when possible
- Use interfaces for object shapes

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Keep functions small and focused
- Write descriptive variable and function names

### Testing
- Write unit tests for new functionality
- Test error cases and edge conditions
- Use descriptive test names
- Mock external dependencies

### Documentation
- Update README.md if adding new features
- Document new CLI commands
- Add JSDoc comments for public APIs
- Update relevant stage documentation files

## 🏷️ Issue Labels

We use labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to docs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `stage-1`, `stage-2`, `stage-3` - Related to specific development stages

## 🤝 Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow our [Code of Conduct](./CODE_OF_CONDUCT.md)

## ❓ Need Help?

- **Documentation**: Check [`docs/`](./docs/) folder
- **Issues**: Search existing [GitHub Issues](https://github.com/aman-dhakar-191/GitSwitch/issues)
- **Discussions**: Start a [GitHub Discussion](https://github.com/aman-dhakar-191/GitSwitch/discussions)

## 🏆 Recognition

Contributors will be recognized in:
- [`README.md`](./README.md) contributors section
- Release notes for significant contributions
- GitHub contributor insights

Thank you for contributing to GitSwitch! 🔄