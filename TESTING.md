# Running GitSwitch Tests

## Quick Start

### Install Dependencies
```bash
npm install
```

### Build the Project
```bash
npm run build
```

### Run All Tests

#### CLI Command Tests (Recommended)
```bash
# Run the comprehensive CLI command test suite
npx jest tests/cli-commands.test.ts --verbose

# Expected output:
# Test Suites: 1 passed
# Tests:       103 passed
# Time:        ~24s
```

#### Core Package Tests
```bash
cd packages/core
npm test

# Expected output:
# Test Suites: 2 passed
# Tests:       29 passed
# Time:        ~5s
```

#### Run All Tests Together
```bash
npm test

# Runs all test suites across the project
```

## Test Files

### 1. CLI Commands Test Suite
**File:** `tests/cli-commands.test.ts`  
**Purpose:** Verifies all CLI commands exist and work correctly  
**Coverage:** 103 test cases covering 98 commands  

**What it tests:**
- Command help outputs
- Command existence
- Command parameters
- Both CLI implementations (cli.ts and cli-original.ts)

### 2. Core Functionality Tests
**Location:** `packages/core/tests/`  
**Files:**
- `GitManager.test.ts` - Git operations
- `CoreFunctionality.test.ts` - Manager integration

**What it tests:**
- GitManager operations
- StorageManager functionality
- ProjectManager features
- SmartDetector suggestions
- ProjectScanner capabilities
- GitHookManager operations

## Test Results Documentation

### Detailed Results
See **[COMMAND_TEST_RESULTS.md](COMMAND_TEST_RESULTS.md)** for:
- Complete test matrix
- Implementation status per command
- Backend manager status
- Statistics and analysis

### Executive Summary
See **[TEST_SUMMARY.md](TEST_SUMMARY.md)** for:
- Quick overview
- Key findings
- Comparison with implementation plan
- Recommendations

## Continuous Integration

### Add to CI Pipeline
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - run: npx jest tests/cli-commands.test.ts
      - run: cd packages/core && npm test
```

## Troubleshooting

### Jest Not Found
```bash
npm install --save-dev jest ts-jest @types/jest
```

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm run build
```

### Test Failures
Check that:
1. All packages are built: `npm run build`
2. CLI files exist: `packages/cli/dist/cli.js` and `packages/cli/dist/cli-original.js`
3. Node.js version >= 18

## Test Statistics

| Metric | Value |
|--------|-------|
| Total Commands | 98 |
| Total Test Cases | 132 (103 CLI + 29 Core) |
| Pass Rate | 100% |
| Test Duration | ~29 seconds |
| Coverage | 100% of planned commands |

## Commands Tested

### By Phase
- **Phase 1:** 35 commands (Quick wins)
- **Phase 2:** 28 commands (Enhanced features)
- **Phase 3:** 19 commands (Major features)
- **Phase 4:** 16 commands (Advanced features)

### By Category
- Core Commands (3)
- Project Commands (9)
- Account Commands (7)
- Hook Commands (4)
- Repository Commands (6)
- Remote Commands (5)
- Branch Commands (7)
- Security Commands (2)
- Automation Commands (9)
- Monorepo Commands (3)
- Commit Commands (4)
- Workflow Commands (9)
- Config Commands (4)
- History Commands (7)
- Git Commands (4)
- Integration Commands (3)
- Context Commands (4)
- Pattern Commands (5)
- Performance Commands (3)

## Contributing

When adding new commands:
1. Update `commands_implementation_plan.md`
2. Add tests to `tests/cli-commands.test.ts`
3. Update `COMMAND_TEST_RESULTS.md`
4. Run tests to verify: `npx jest tests/cli-commands.test.ts`
5. Update this guide if needed

## Questions?

- 📖 Check [COMMAND_TEST_RESULTS.md](COMMAND_TEST_RESULTS.md) for detailed documentation
- 📊 See [TEST_SUMMARY.md](TEST_SUMMARY.md) for executive summary
- 🐛 Report issues on GitHub
