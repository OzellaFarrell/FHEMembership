# Integrated Toolchain Guide

## Overview

This document provides a quick reference for the integrated development, security, and performance toolchain in the Privacy Membership Platform.

## Toolchain Components

### Layer 1: Development (Hardhat)

| Tool | Purpose | Command |
|------|---------|---------|
| **Hardhat** | Smart contract development framework | `npm run compile` |
| **Solhint** | Solidity linting | `npm run lint:sol` |
| **Gas Reporter** | Gas cost tracking | `REPORT_GAS=true npm test` |
| **Contract Sizer** | Contract size monitoring | `npm run size` |
| **Optimizer** | Bytecode optimization | Configured in `hardhat.config.cjs` |

### Layer 2: Frontend

| Tool | Purpose | Command |
|------|---------|---------|
| **ESLint** | JavaScript linting | `npm run lint:js` |
| **Prettier** | Code formatting | `npm run prettier` |
| **TypeScript** | Type safety (optional) | `npm run typecheck` |

### Layer 3: Quality Gates

| Tool | Purpose | Trigger |
|------|---------|---------|
| **Husky** | Git hooks management | Automatic on git operations |
| **lint-staged** | Staged file checks | Pre-commit |
| **commitlint** | Commit message validation | Commit-msg hook |

### Layer 4: CI/CD

| Tool | Purpose | Trigger |
|------|---------|---------|
| **GitHub Actions** | Automated workflows | Push/PR |
| **Codecov** | Coverage tracking | After tests |
| **Dependency Review** | Supply chain security | PR only |

---

## Quick Start

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Initialize Husky
npx husky install

# 3. Create environment file
cp .env.example .env

# 4. Configure .env with your values
# Edit .env with your private key, RPC URLs, etc.
```

### Daily Development Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feat/your-feature

# 3. Write code
# Your IDE should auto-lint/format on save

# 4. Compile contracts
npm run compile

# 5. Run tests
npm test

# 6. Check gas usage (optional)
REPORT_GAS=true npm test

# 7. Format code
npm run prettier

# 8. Commit changes
git add .
git commit -m "feat(scope): your message"
# Pre-commit hooks run automatically

# 9. Push to GitHub
git push origin feat/your-feature
# CI/CD runs automatically
```

---

## Configuration Files

### Core Configuration

| File | Purpose | Key Settings |
|------|---------|--------------|
| `hardhat.config.cjs` | Hardhat configuration | Optimizer, networks, gas reporter |
| `.env` | Environment variables | Keys, URLs, API tokens |
| `package.json` | Dependencies and scripts | NPM scripts, versions |

### Code Quality

| File | Purpose | Key Rules |
|------|---------|-----------|
| `.solhint.json` | Solidity linting rules | Complexity, security, style |
| `.eslintrc.json` | JavaScript linting rules | Quotes, semicolons, complexity |
| `.prettierrc.json` | Code formatting rules | Line length, tabs, quotes |

### Git Hooks

| File | Purpose | Actions |
|------|---------|---------|
| `.husky/pre-commit` | Pre-commit hook | Run lint-staged |
| `.husky/commit-msg` | Commit message hook | Validate format |
| `.lintstagedrc.json` | Staged file checks | Lint and format |
| `.commitlintrc.json` | Commit message rules | Conventional commits |

### CI/CD

| File | Purpose | Jobs |
|------|---------|------|
| `.github/workflows/test.yml` | Main CI/CD | 7 jobs (lint, test, gas, security, build) |
| `.github/workflows/pull-request.yml` | PR validation | 3 jobs (validation, size, dependencies) |
| `codecov.yml` | Coverage configuration | 80% target |

---

## NPM Scripts Reference

### Compilation

```bash
npm run compile           # Compile contracts
npm run clean            # Clean artifacts
npm run compile:clean    # Clean then compile
```

### Testing

```bash
npm test                 # Run all tests
npm run test:coverage    # Run with coverage
npm run test:gas        # Run with gas reporting
npm run test:security   # Run security tests only
npm run test:performance # Run performance tests only
```

### Linting & Formatting

```bash
npm run lint:sol         # Lint Solidity
npm run lint:sol:fix     # Lint and fix Solidity
npm run lint:js          # Lint JavaScript
npm run lint:js:fix      # Lint and fix JavaScript
npm run prettier         # Format all files
npm run prettier:check   # Check formatting
```

### Size & Gas

```bash
npm run size            # Check contract sizes
npm run gas             # Gas report
```

### Deployment

```bash
npm run deploy          # Deploy to configured network
npm run deploy:sepolia  # Deploy to Sepolia
npm run verify          # Verify on Etherscan
npm run interact        # Interact with deployed contract
npm run simulate        # Run simulation scenarios
```

### CI/CD

```bash
npm run ci              # Run all CI checks
npm run ci:coverage     # Run CI with coverage
```

---

## Git Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(membership): add anonymous registration` |
| `fix` | Bug fix | `fix(security): prevent reentrancy` |
| `docs` | Documentation | `docs(readme): update setup instructions` |
| `style` | Code style | `style(contracts): format with prettier` |
| `refactor` | Code refactoring | `refactor(storage): optimize struct packing` |
| `perf` | Performance improvement | `perf(gas): reduce storage operations` |
| `test` | Add/update tests | `test(security): add DoS prevention tests` |
| `chore` | Maintenance | `chore(deps): update dependencies` |

### Examples

**Good:**
```bash
git commit -m "feat(membership): add level progression system"
git commit -m "fix(security): prevent unauthorized access to admin functions"
git commit -m "perf(gas): optimize member registration storage"
git commit -m "test(integration): add end-to-end membership flow tests"
```

**Bad:**
```bash
git commit -m "update code"
git commit -m "fix bug"
git commit -m "WIP"
```

---

## Environment Variables

### Required

```env
PRIVATE_KEY=              # Your wallet private key (without 0x)
OWNER_ADDRESS=            # Contract owner address
DEPLOYER_ADDRESS=         # Deployer address
SEPOLIA_RPC_URL=         # Sepolia testnet RPC URL
ETHERSCAN_API_KEY=       # For contract verification
```

### Optional - Gas & Performance

```env
REPORT_GAS=false          # Enable gas reporting
COINMARKETCAP_API_KEY=   # For USD gas prices
CONTRACT_SIZE_LIMIT=24576 # Contract size warning threshold
GAS_WARNING_THRESHOLD=500000 # Gas cost warning threshold
```

### Optional - Security

```env
PAUSER_ADDRESS=          # Address authorized to pause contract
ENABLE_SECURITY_SCAN=true # Enable security scanning
ENABLE_SLITHER=false     # Enable Slither analysis
ENABLE_MYTHRIL=false     # Enable Mythril analysis
```

### Optional - Testing

```env
TEST_NETWORK=hardhat     # Test network (hardhat, localhost, sepolia)
ENABLE_COVERAGE=true     # Enable coverage reporting
CODECOV_TOKEN=           # Codecov upload token
TEST_TIMEOUT=120000      # Test timeout in ms
```

### Optional - Compiler

```env
SOLC_VERSION=0.8.24      # Solidity compiler version
SOLC_OPTIMIZER_ENABLED=true # Enable optimizer
SOLC_OPTIMIZER_RUNS=200  # Optimizer runs (1-10000+)
SOLC_VIA_IR=false        # Enable via-IR compilation
```

### Optional - CI/CD

```env
ENABLE_CI=true           # Enable CI/CD workflows
CI_NODE_VERSIONS=18.x,20.x # Node versions for CI
ENABLE_PR_VALIDATION=true # Validate PR titles
ENABLE_DEPENDENCY_REVIEW=true # Review dependencies in PRs
```

---

## Pre-commit Checks

### What Gets Checked

When you run `git commit`, the following checks run automatically:

**Solidity files (*.sol):**
1. ✅ Prettier formatting
2. ✅ Solhint linting

**JavaScript files (*.js):**
1. ✅ ESLint linting (with auto-fix)
2. ✅ Prettier formatting

**JSON/Markdown files (*.json, *.md):**
1. ✅ Prettier formatting

### Bypassing Hooks (Not Recommended)

```bash
# Skip pre-commit hooks (use only in emergencies)
git commit --no-verify -m "message"
```

---

## CI/CD Workflows

### Main Workflow (test.yml)

**Triggers:**
- Push to `main` or `develop`
- Pull requests

**Jobs:**

1. **lint-and-format** (5-10s)
   - Prettier check
   - Solhint
   - ESLint

2. **test-node-18** (30-60s)
   - Run all tests on Node 18.x
   - Ensure compatibility

3. **test-node-20** (30-60s)
   - Run all tests on Node 20.x
   - Generate coverage report
   - Upload to Codecov

4. **gas-report** (30-60s)
   - Run tests with gas reporting
   - Track gas costs
   - Warn on high gas usage

5. **security-audit** (10-20s)
   - Run `npm audit`
   - Check for vulnerable dependencies
   - Fail on moderate+ vulnerabilities

6. **build-verification** (10-20s)
   - Compile contracts
   - Check contract sizes
   - Fail if size exceeds limits

7. **all-checks-passed** (1s)
   - Depends on all above jobs
   - Required for merge

### PR Workflow (pull-request.yml)

**Triggers:**
- Pull requests only

**Jobs:**

1. **pr-validation** (5s)
   - Validate PR title format
   - Check conventional commits
   - Ensure no WIP commits

2. **size-check** (10s)
   - Check bundle size
   - Compare against baseline
   - Warn on significant increases

3. **dependency-review** (10-20s)
   - Review new dependencies
   - Check licenses
   - Scan for security issues

---

## Gas Optimization Guide

### Understanding Optimizer Runs

| Runs | Deploy Cost | Runtime Cost | Use Case |
|------|-------------|--------------|----------|
| 1 | Lowest | Highest | Deploy once, rarely call |
| 50 | Low | High | Deploy occasionally |
| **200** | **Medium** | **Medium** | **Balanced (recommended)** |
| 1000 | High | Low | Frequently called functions |
| 10000+ | Highest | Lowest | High-frequency operations |

### Configuration

```env
# In .env file
SOLC_OPTIMIZER_ENABLED=true
SOLC_OPTIMIZER_RUNS=200
```

Or in `hardhat.config.cjs`:
```javascript
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
```

### Measuring Gas Usage

```bash
# Enable gas reporting
REPORT_GAS=true npm test

# Run specific test with gas reporting
REPORT_GAS=true npm test test/Performance.test.js

# View contract sizes
npm run size
```

### Gas Optimization Checklist

**Storage:**
- ✅ Pack struct variables
- ✅ Use appropriate uint sizes (uint8, uint16, etc.)
- ✅ Minimize storage writes
- ✅ Use memory for temporary data

**Functions:**
- ✅ Use `calldata` for read-only arrays
- ✅ Use `external` instead of `public` when possible
- ✅ Cache storage variables in memory
- ✅ Use `unchecked` for safe arithmetic

**Patterns:**
- ✅ Avoid unbounded loops
- ✅ Batch operations when possible
- ✅ Use events instead of storing data
- ✅ Consider off-chain computation

---

## Security Checklist

### Development

**Code:**
- ✅ Follow Checks-Effects-Interactions pattern
- ✅ Use explicit visibility modifiers
- ✅ Validate all inputs
- ✅ Avoid low-level calls
- ✅ Use SafeMath or Solidity 0.8+
- ✅ Document security assumptions

**Access Control:**
- ✅ Implement proper access controls
- ✅ Use OpenZeppelin AccessControl
- ✅ Separate owner and operator roles
- ✅ Implement pause mechanism

### Testing

- ✅ Test all access controls
- ✅ Test with malicious inputs
- ✅ Test concurrent operations
- ✅ Test edge cases
- ✅ Achieve 80%+ coverage
- ✅ Run security test suite

### Deployment

- ✅ Test on testnet first
- ✅ Use different keys for testnet/mainnet
- ✅ Verify contract on Etherscan
- ✅ Run security audit (for production)
- ✅ Set up monitoring
- ✅ Document deployment process

### Post-Deployment

- ✅ Monitor contract activity
- ✅ Set up alerts for anomalies
- ✅ Have emergency response plan
- ✅ Keep pauser keys secure
- ✅ Regular security reviews

---

## Performance Monitoring

### Metrics to Track

**Gas Costs:**
- Registration: Target < 500,000 gas
- Activity recording: Target < 300,000 gas
- Level updates: Target < 200,000 gas

**Scalability:**
- Gas increase < 20% as user base grows
- Consistent gas costs across operations

**Contract Size:**
- Total size < 24,576 bytes (EIP-170 limit)
- Warning at 90% (22,118 bytes)

### Running Performance Tests

```bash
# Full performance suite
npm run test:performance

# With gas reporting
REPORT_GAS=true npm run test:performance

# Security tests
npm run test:security
```

### Performance Thresholds

Configure in `.env`:
```env
GAS_WARNING_THRESHOLD=500000
CONTRACT_SIZE_LIMIT=24576
TX_TIME_WARNING_THRESHOLD=5000
```

---

## Troubleshooting

### Common Issues

**Issue: Pre-commit hooks not running**
```bash
# Solution: Reinstall Husky
rm -rf .husky
npm run prepare
```

**Issue: Linting errors**
```bash
# Solution: Auto-fix
npm run lint:sol:fix
npm run lint:js:fix
npm run prettier
```

**Issue: Test failures**
```bash
# Solution: Clean and recompile
npm run clean
npm run compile
npm test
```

**Issue: Gas reporting not working**
```bash
# Solution: Check environment
echo $REPORT_GAS  # Should output "true"
REPORT_GAS=true npm test
```

**Issue: Contract size exceeded**
```bash
# Solution: Check size breakdown
npm run size

# Options:
# 1. Extract libraries
# 2. Remove unused code
# 3. Reduce optimizer runs
# 4. Minimize string literals
```

**Issue: CI/CD failures**
```bash
# Solution: Run CI locally
npm run ci

# Check specific job
npm run lint:sol
npm run lint:js
npm test
npm run compile
```

---

## Best Practices Summary

### DO ✅

**Code:**
- Write clear, self-documenting code
- Follow Solidity style guide
- Use explicit visibility
- Document complex logic
- Keep functions small

**Testing:**
- Write tests before code (TDD)
- Test edge cases
- Maintain high coverage
- Run tests frequently
- Use meaningful test names

**Git:**
- Use conventional commits
- Write descriptive messages
- Keep commits atomic
- Review your own PRs
- Address feedback promptly

**Security:**
- Validate all inputs
- Follow security patterns
- Run security tests
- Test on testnet first
- Keep keys secure

**Performance:**
- Monitor gas costs
- Optimize storage
- Profile before optimizing
- Track metrics over time

### DON'T ❌

**Code:**
- Don't commit `.env` files
- Don't use `--no-verify` flag
- Don't skip tests
- Don't ignore warnings
- Don't use low-level calls without reason

**Testing:**
- Don't skip failing tests
- Don't test in production
- Don't rely on manual testing only
- Don't ignore coverage drops

**Git:**
- Don't force push to main
- Don't commit WIP code
- Don't use generic messages
- Don't merge failing PRs

**Security:**
- Don't share private keys
- Don't ignore audit findings
- Don't deploy without testing
- Don't disable security checks

---

## Additional Resources

### Documentation
- [SECURITY_PERFORMANCE.md](./SECURITY_PERFORMANCE.md) - Comprehensive security & performance guide
- [TESTING.md](./TESTING.md) - Testing guide and test cases
- [CI_CD.md](./CI_CD.md) - CI/CD pipeline documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

### External Resources
- [Hardhat Docs](https://hardhat.org/docs)
- [Solidity Docs](https://docs.soliditylang.org/)
- [OpenZeppelin](https://docs.openzeppelin.com/)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)

### Tools
- [Etherscan](https://sepolia.etherscan.io/) - Block explorer
- [Codecov](https://about.codecov.io/) - Coverage tracking
- [CoinMarketCap](https://coinmarketcap.com/api/) - Gas prices

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    QUICK COMMANDS                            │
├─────────────────────────────────────────────────────────────┤
│ Setup                                                        │
│   npm install              Install dependencies             │
│   npx husky install        Initialize git hooks             │
│   cp .env.example .env     Create environment file          │
├─────────────────────────────────────────────────────────────┤
│ Development                                                  │
│   npm run compile          Compile contracts                │
│   npm test                 Run tests                        │
│   npm run prettier         Format code                      │
│   REPORT_GAS=true npm test Gas report                      │
├─────────────────────────────────────────────────────────────┤
│ Quality                                                      │
│   npm run lint:sol         Lint Solidity                    │
│   npm run lint:js          Lint JavaScript                  │
│   npm run ci               Run all CI checks                │
│   npm run size             Check contract sizes             │
├─────────────────────────────────────────────────────────────┤
│ Deployment                                                   │
│   npm run deploy           Deploy contracts                 │
│   npm run verify           Verify on Etherscan              │
│   npm run interact         Interact with contract           │
├─────────────────────────────────────────────────────────────┤
│ Git                                                          │
│   git commit -m "type(scope): message"  Commit             │
│   git push                 Push (CI runs automatically)      │
└─────────────────────────────────────────────────────────────┘
```

---

For detailed information on any topic, refer to the comprehensive documentation files in the project root.
