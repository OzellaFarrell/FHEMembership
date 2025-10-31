# CI/CD Pipeline Documentation

## Overview

This project implements a comprehensive CI/CD pipeline using GitHub Actions for continuous integration, automated testing, and quality assurance.

## Pipeline Architecture

### Workflow Triggers

The CI/CD pipeline runs automatically on:
- ✅ **Push to `main` branch** - Full test suite with coverage
- ✅ **Push to `develop` branch** - Development testing
- ✅ **Pull Requests** - PR validation and checks
- ✅ **Manual Trigger** - On-demand workflow execution

### Multi-Node Testing

Tests run on multiple Node.js versions:
- **Node.js 18.x** - LTS support
- **Node.js 20.x** - Latest LTS with coverage

---

## Workflows

### 1. Main CI/CD Pipeline (`.github/workflows/test.yml`)

Comprehensive testing and validation workflow with 6 jobs:

#### Job 1: Code Quality Check (`lint-and-format`)

**Purpose**: Validate code formatting and linting standards

**Steps**:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Run Prettier format check
5. Run Solidity linter (Solhint)

**Required to pass**: ✅ Yes

#### Job 2: Test on Node.js 18.x (`test-node-18`)

**Purpose**: Ensure compatibility with Node.js 18 LTS

**Steps**:
1. Checkout code
2. Setup Node.js 18.x
3. Install dependencies
4. Compile contracts
5. Run test suite

**Depends on**: `lint-and-format`
**Required to pass**: ✅ Yes

#### Job 3: Test on Node.js 20.x with Coverage (`test-node-20`)

**Purpose**: Test on latest LTS and generate coverage

**Steps**:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Compile contracts
5. Run test suite
6. Generate coverage report
7. Upload coverage to Codecov

**Depends on**: `lint-and-format`
**Required to pass**: ✅ Yes

**Coverage Upload**:
- Platform: Codecov
- Report: `coverage/lcov.info`
- Flags: `unittests`

#### Job 4: Gas Usage Report (`gas-report`)

**Purpose**: Track gas consumption of contract functions

**Steps**:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Compile contracts
5. Run tests with gas reporting enabled
6. Upload gas report as artifact

**Environment Variable**: `REPORT_GAS=true`
**Artifact**: `gas-report.txt`

#### Job 5: Security Audit (`security-audit`)

**Purpose**: Identify security vulnerabilities in dependencies

**Steps**:
1. Checkout code
2. Setup Node.js 20.x
3. Run `npm audit` with moderate severity threshold

**Continues on error**: ⚠️ Yes (non-blocking)

#### Job 6: Build Verification (`build-verification`)

**Purpose**: Ensure project builds successfully

**Steps**:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Compile contracts
5. Build frontend
6. Verify compiled artifacts exist

**Depends on**: `test-node-18`, `test-node-20`

#### Job 7: All Checks Summary (`all-checks-passed`)

**Purpose**: Final validation of all critical jobs

**Runs**: Always (even if previous jobs fail)
**Checks**: All job statuses
**Fails if**: Any critical job fails

---

### 2. Pull Request Workflow (`.github/workflows/pull-request.yml`)

Enhanced validation for pull requests with 3 jobs:

#### Job 1: PR Validation (`pr-validation`)

**Purpose**: Validate PR quality and standards

**Checks**:
1. ✅ PR title follows conventional commits format
   - Valid prefixes: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`
   - Format: `type(scope): description`
   - Examples:
     - `feat: add new membership tier`
     - `fix: resolve registration bug`
     - `docs: update README`

2. ✅ Code formatting (Prettier)
3. ✅ Solidity linting (Solhint)
4. ✅ Contract compilation
5. ✅ Test execution
6. ✅ Coverage generation

**PR Comment**:
Automatically posts results summary to PR with:
- Check status
- Quick stats
- Next steps

#### Job 2: Contract Size Check (`size-check`)

**Purpose**: Monitor contract bytecode sizes

**Checks**:
- Contract sizes against 24KB limit
- Generates size report table
- Uploads report as artifact

**Warning**: If contract exceeds 24KB

#### Job 3: Dependency Review (`dependency-review`)

**Purpose**: Review dependency changes in PR

**Action**: `actions/dependency-review-action@v4`
**Threshold**: Moderate severity
**Runs**: Only on pull requests

---

## Configuration Files

### 1. Solhint Configuration (`.solhint.json`)

Solidity linting rules:

```json
{
  "extends": "solhint:recommended",
  "rules": {
    "code-complexity": ["error", 8],
    "compiler-version": ["error", "^0.8.24"],
    "func-visibility": ["error", { "ignoreConstructors": true }],
    "max-line-length": ["error", 120],
    "max-states-count": ["warn", 15],
    "named-parameters-mapping": "warn",
    "not-rely-on-time": "off",
    "quotes": ["error", "double"]
  }
}
```

**Key Rules**:
- Maximum complexity: 8
- Compiler version: ^0.8.24
- Max line length: 120 characters
- Double quotes enforced

### 2. Prettier Configuration (`.prettierrc.json`)

Code formatting rules:

```json
{
  "printWidth": 120,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5"
}
```

**Solidity-specific**:
- Tab width: 4 spaces
- No bracket spacing
- Print width: 120

### 3. Codecov Configuration (`codecov.yml`)

Coverage reporting configuration:

```yaml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%
    patch:
      default:
        target: 80%
        threshold: 5%
```

**Targets**:
- Project coverage: 80%
- Patch coverage: 80%
- Precision: 2 decimal places

---

## NPM Scripts

### Code Quality

| Script | Command | Description |
|--------|---------|-------------|
| `lint:sol` | `solhint 'contracts/**/*.sol'` | Lint Solidity files |
| `lint:sol:fix` | `solhint 'contracts/**/*.sol' --fix` | Auto-fix linting issues |
| `prettier` | `prettier --write '**/*.{js,json,sol,md}'` | Format all files |
| `prettier:check` | `prettier --check '**/*.{js,json,sol,md}'` | Check formatting |
| `prettier:sol` | `prettier --write 'contracts/**/*.sol'` | Format Solidity only |
| `format` | `prettier + lint:sol:fix` | Format and fix all |

### Testing

| Script | Command | Description |
|--------|---------|-------------|
| `test` | `hardhat test` | Run test suite |
| `test:coverage` | `hardhat coverage` | Generate coverage |
| `compile` | `hardhat compile` | Compile contracts |

### CI/CD

| Script | Command | Description |
|--------|---------|-------------|
| `ci` | Full CI pipeline (check + lint + test) | Local CI simulation |
| `ci:coverage` | Full CI with coverage | CI with coverage report |

### Development

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server |
| `build` | `vite build` | Build production |
| `clean` | `hardhat clean` | Clean artifacts |

---

## Running Locally

### Run Full CI Pipeline

```bash
npm run ci
```

This runs:
1. ✅ Prettier check
2. ✅ Solidity linting
3. ✅ Contract compilation
4. ✅ Test suite

### Run with Coverage

```bash
npm run ci:coverage
```

Additional step:
5. ✅ Coverage report generation

### Fix Code Quality Issues

```bash
# Format code
npm run format

# Check what would be formatted
npm run prettier:check

# Lint Solidity
npm run lint:sol

# Auto-fix linting issues
npm run lint:sol:fix
```

---

## GitHub Actions Setup

### Required Secrets

Configure these secrets in GitHub repository settings:

| Secret | Required | Description |
|--------|----------|-------------|
| `CODECOV_TOKEN` | Recommended | Codecov upload token |
| `SEPOLIA_RPC_URL` | Optional | Sepolia RPC endpoint (for deployment) |
| `PRIVATE_KEY` | Optional | Deployment wallet key (for deployment) |
| `ETHERSCAN_API_KEY` | Optional | Etherscan verification key |

### Setting Up Codecov

1. **Sign up at [codecov.io](https://codecov.io)**
2. **Connect GitHub repository**
3. **Copy repository token**
4. **Add to GitHub Secrets**:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CODECOV_TOKEN`
   - Value: [your token]

### Testing GitHub Actions Locally

Use [act](https://github.com/nektos/act) to test workflows locally:

```bash
# Install act
npm install -g act

# Run all workflows
act

# Run specific job
act -j lint-and-format

# Run with secrets
act --secret-file .env.secrets
```

---

## Workflow Status Badges

Add these badges to your README.md:

```markdown
![CI/CD Pipeline](https://github.com/your-username/repo-name/workflows/CI/CD%20Pipeline/badge.svg)
![Pull Request Checks](https://github.com/your-username/repo-name/workflows/Pull%20Request%20Checks/badge.svg)
[![codecov](https://codecov.io/gh/your-username/repo-name/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/repo-name)
```

---

## Best Practices

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructure
- `test`: Tests
- `chore`: Maintenance
- `perf`: Performance

**Examples**:
```
feat: add platinum membership tier
fix: resolve duplicate registration bug
docs: update deployment guide
test: add edge case tests for activity recording
```

### Pre-commit Checks

Run locally before committing:

```bash
npm run format      # Format code
npm run ci          # Run full checks
```

### Pull Request Guidelines

1. **Title**: Use conventional commits format
2. **Description**: Explain changes clearly
3. **Tests**: Ensure all tests pass
4. **Coverage**: Maintain or improve coverage
5. **Linting**: Fix all linting errors
6. **Size**: Keep contracts under 24KB

---

## Troubleshooting

### Common Issues

#### 1. Workflow Fails on `npm ci`

**Error**: `Cannot find module`

**Solution**:
```bash
# Update package-lock.json
npm install
git add package-lock.json
git commit -m "chore: update dependencies"
```

#### 2. Prettier Check Fails

**Error**: `Code style issues found`

**Solution**:
```bash
npm run format
git add .
git commit -m "style: format code"
```

#### 3. Solhint Fails

**Error**: `Linting errors found`

**Solution**:
```bash
npm run lint:sol:fix
# Review and fix remaining issues manually
git add .
git commit -m "fix: resolve linting issues"
```

#### 4. Coverage Upload Fails

**Error**: `Codecov token not found`

**Solution**:
- Add `CODECOV_TOKEN` to GitHub Secrets
- Make sure workflow has correct secret reference

#### 5. Node Version Mismatch

**Error**: `Unsupported Node.js version`

**Solution**:
- Update `.github/workflows/*.yml`
- Change `node-version` to supported version

---

## Monitoring

### Workflow Runs

View workflow status:
- Go to **Actions** tab in GitHub repository
- Click on specific workflow run
- Expand jobs to see detailed logs

### Coverage Reports

View coverage on Codecov:
1. Visit your Codecov project page
2. View coverage trends over time
3. Check file-by-file coverage
4. Review coverage changes in PRs

### Gas Reports

Download gas reports:
1. Go to workflow run
2. Scroll to **Artifacts**
3. Download `gas-report.txt`
4. Review gas consumption

---

## Maintenance

### Updating Dependencies

```bash
# Update all dependencies
npm update

# Update specific package
npm update hardhat --legacy-peer-deps

# Audit and fix vulnerabilities
npm audit fix
```

### Updating Workflows

When updating workflows:

1. Test locally with `act`
2. Create PR with workflow changes
3. Verify workflow runs on PR
4. Merge after validation

### Adding New Checks

To add a new check:

1. Add job to `.github/workflows/test.yml`
2. Add corresponding NPM script
3. Test locally
4. Document in this file

---

## Performance Optimization

### Caching

Workflows use caching to speed up runs:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20.x'
    cache: 'npm'
```

This caches `node_modules` between runs.

### Parallel Execution

Jobs run in parallel when possible:

```
lint-and-format
    ↓
[test-node-18] [test-node-20] [gas-report]
    ↓              ↓
    build-verification
    ↓
    all-checks-passed
```

### Conditional Runs

Some jobs only run when necessary:

```yaml
if: github.event_name == 'pull_request'
```

---

## Security

### Secret Management

- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate keys regularly
- Use minimum required permissions

### Dependency Scanning

- `npm audit` runs on every workflow
- Dependency review on PRs
- Moderate severity threshold enforced

### Code Scanning

Consider adding:
- **CodeQL** for security analysis
- **Snyk** for vulnerability scanning
- **Slither** for Solidity security

---

## Future Enhancements

Planned improvements:

1. ✅ **Automated Deployment**
   - Deploy to Sepolia on main branch merge
   - Automatic contract verification

2. ✅ **Performance Testing**
   - Benchmark gas costs
   - Track performance trends

3. ✅ **Integration Tests**
   - Test contract interactions
   - End-to-end scenarios

4. ✅ **Release Automation**
   - Semantic versioning
   - Automatic changelog generation
   - GitHub releases

---

## Support

For issues with CI/CD:

1. Check workflow logs in Actions tab
2. Review this documentation
3. Open issue with workflow logs
4. Contact maintainers

---

## Summary

### CI/CD Features

✅ **Automated Testing**: Tests run on every push and PR
✅ **Multi-Node Support**: Tests on Node.js 18.x and 20.x
✅ **Code Quality**: Prettier and Solhint enforcement
✅ **Coverage Tracking**: Codecov integration
✅ **Gas Reporting**: Gas usage monitoring
✅ **Security Audits**: Dependency vulnerability scanning
✅ **PR Validation**: Comprehensive PR checks
✅ **Build Verification**: Production build validation

### Quality Metrics

- **Code Coverage**: Target 80%
- **Test Pass Rate**: 100% required
- **Lint Errors**: 0 allowed
- **Format Issues**: 0 allowed
- **Security Vulnerabilities**: Moderate+ blocking

### Pipeline Success Criteria

All of these must pass:
1. ✅ Code formatting (Prettier)
2. ✅ Solidity linting (Solhint)
3. ✅ Contract compilation
4. ✅ Tests on Node.js 18.x
5. ✅ Tests on Node.js 20.x
6. ✅ Build verification

---

**CI/CD Pipeline Version**: 1.0.0
**Last Updated**: 2025-10-30
**Maintainer**: Development Team
