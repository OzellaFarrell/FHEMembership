# Security & Performance Toolchain

## Overview

This document provides a comprehensive guide to the integrated security and performance toolchain implemented in the Privacy Membership Platform. The toolchain follows a **shift-left security strategy**, integrating security and performance checks throughout the development lifecycle.

## Table of Contents

1. [Toolchain Architecture](#toolchain-architecture)
2. [Development Layer](#development-layer)
3. [Testing Layer](#testing-layer)
4. [CI/CD Layer](#cicd-layer)
5. [Security Features](#security-features)
6. [Performance Optimization](#performance-optimization)
7. [Configuration Guide](#configuration-guide)
8. [Best Practices](#best-practices)

---

## Toolchain Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Layer                         │
│  Hardhat + Solhint + Gas Reporter + Optimizer               │
│  • Smart contract development                                │
│  • Real-time linting                                         │
│  • Gas cost monitoring                                       │
│  • Compilation optimization                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  ESLint + Prettier + TypeScript (optional)                  │
│  • JavaScript linting                                        │
│  • Code formatting                                           │
│  • Type safety                                               │
│  • Code splitting                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Quality Gates Layer                         │
│  Husky + lint-staged + commitlint                           │
│  • Pre-commit hooks                                          │
│  • Automated formatting                                      │
│  • Commit message validation                                 │
│  • Conventional commits                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD Layer                               │
│  GitHub Actions + Security Checks + Performance Tests       │
│  • Automated testing                                         │
│  • Security audits                                           │
│  • Gas benchmarking                                          │
│  • Coverage tracking                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Development Layer

### 1. Hardhat Configuration

**File:** `hardhat.config.cjs`

The Hardhat configuration is the foundation of the development environment:

```javascript
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,  // Balanced optimization
      },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    showTimeSpent: true,
    showMethodSig: true,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    strict: true,
  },
};
```

#### Optimizer Configuration

**Optimizer Runs Trade-offs:**

| Runs | Use Case | Deployment Cost | Runtime Cost |
|------|----------|-----------------|--------------|
| 1 | Deployment optimization | Lowest | Highest |
| 200 | **Balanced (recommended)** | Medium | Medium |
| 1000 | Frequently called functions | Higher | Lower |
| 10000+ | High-frequency operations | Highest | Lowest |

**Configuration via `.env`:**
```bash
SOLC_OPTIMIZER_ENABLED=true
SOLC_OPTIMIZER_RUNS=200
```

### 2. Solhint (Solidity Linting)

**File:** `.solhint.json`

Enforces Solidity best practices and security patterns:

```json
{
  "extends": "solhint:recommended",
  "rules": {
    "code-complexity": ["error", 8],
    "max-line-length": ["error", 120],
    "function-max-lines": ["error", 50],
    "no-unused-vars": "error",
    "no-console": "warn",
    "compiler-version": ["error", "^0.8.24"]
  }
}
```

**Key Security Rules:**
- `code-complexity`: Limits function complexity (DoS prevention)
- `reentrancy`: Detects potential reentrancy vulnerabilities
- `state-visibility`: Enforces explicit visibility modifiers
- `avoid-low-level-calls`: Warns about unsafe low-level operations

**Usage:**
```bash
# Lint all contracts
npm run lint:sol

# Auto-fix issues
npm run lint:sol:fix
```

### 3. Gas Reporter

Monitors gas consumption in real-time during testing:

```bash
# Enable gas reporting
REPORT_GAS=true npm test
```

**Output includes:**
- Gas used per function call
- Average gas cost across test runs
- USD cost estimates (with CoinMarketCap API)
- Time spent on each operation

### 4. Contract Sizer

Monitors contract bytecode size (EIP-170 limit: 24KB):

```bash
# View contract sizes
npm run compile
```

**Warning triggers:**
- Contracts exceeding 24,576 bytes
- Contracts approaching 90% of limit (22,118 bytes)

---

## Testing Layer

### 1. Test Suite Structure

```
test/
├── PrivacyMembership.test.js   # Main functionality (45+ tests)
├── Security.test.js             # Security-focused tests
└── Performance.test.js          # Gas optimization & scalability
```

### 2. Security Testing

**File:** `test/Security.test.js`

**Test Categories:**
1. **Access Control Security**
   - Unauthorized function call prevention
   - Role-based access validation
   - Owner privilege verification

2. **Reentrancy Protection**
   - Concurrent operation handling
   - State consistency under race conditions
   - Guard mechanism validation

3. **Input Validation**
   - Zero address rejection
   - Token uniqueness enforcement
   - Duplicate registration prevention

4. **DoS Attack Prevention**
   - Batch operation gas limits
   - Array growth patterns
   - Loop gas consumption

5. **Integer Overflow/Underflow**
   - Boundary value testing
   - Maximum value handling
   - Counter integrity

6. **Data Privacy**
   - Anonymous member data protection
   - Encrypted activity storage
   - Timestamp obfuscation

**Running Security Tests:**
```bash
npm test test/Security.test.js
```

### 3. Performance Testing

**File:** `test/Performance.test.js`

**Test Categories:**
1. **Gas Optimization**
   - Registration gas benchmarks (< 500,000 gas)
   - Activity recording efficiency (< 300,000 gas)
   - Level update costs (< 200,000 gas)

2. **Batch Operations**
   - Multi-user registration performance
   - Concurrent activity recording
   - Scalability metrics

3. **View Function Performance**
   - Read operation latency
   - Data retrieval efficiency
   - System stats query speed

4. **Storage Optimization**
   - Member data storage efficiency
   - Activity history gas growth
   - Gas consistency across operations

5. **Scalability Tests**
   - Growing member base handling
   - Activity history expansion
   - Gas increase percentages

6. **Contract Size**
   - Bytecode size monitoring
   - EIP-170 compliance (< 24KB)

**Running Performance Tests:**
```bash
REPORT_GAS=true npm test test/Performance.test.js
```

**Performance Thresholds:**
- Registration: < 500,000 gas
- Activity: < 300,000 gas
- Level update: < 200,000 gas
- Gas increase: < 20% over scale
- Contract size: < 24,576 bytes

---

## Frontend Layer

### 1. ESLint Configuration

**File:** `.eslintrc.json`

JavaScript/TypeScript linting for frontend code:

```json
{
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "max-len": ["warn", { "code": 120 }],
    "complexity": ["error", 10]
  }
}
```

**Security-Focused Rules:**
- `no-eval`: Prevents code injection
- `no-implied-eval`: Blocks indirect eval usage
- `no-new-func`: Disallows Function constructor
- `complexity`: Limits function complexity

**Usage:**
```bash
# Lint JavaScript files
npm run lint:js

# Auto-fix issues
npm run lint:js:fix
```

### 2. Prettier Configuration

**File:** `.prettierrc.json`

Consistent code formatting across the project:

```json
{
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "overrides": [
    {
      "files": "*.sol",
      "options": {
        "tabWidth": 4,
        "printWidth": 120,
        "bracketSpacing": false
      }
    }
  ]
}
```

**Usage:**
```bash
# Format all files
npm run prettier

# Check formatting
npm run prettier:check
```

### 3. Code Splitting (Vite)

**Benefits:**
- Reduced initial bundle size
- Faster load times
- Smaller attack surface
- Better caching

**Implementation:**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['ethers', 'react', 'react-dom'],
          'contracts': ['./src/contracts/*'],
        },
      },
    },
  },
};
```

---

## Quality Gates Layer

### 1. Husky Pre-commit Hooks

**File:** `.husky/pre-commit`

Runs automated checks before each commit:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint-staged
npx lint-staged

echo "✅ Pre-commit checks passed!"
```

**What gets checked:**
- ✅ Solidity files: Prettier formatting + Solhint linting
- ✅ JavaScript files: ESLint linting + Prettier formatting
- ✅ JSON/Markdown files: Prettier formatting

### 2. Lint-staged Configuration

**File:** `.lintstagedrc.json`

Defines checks for staged files:

```json
{
  "*.sol": [
    "prettier --write",
    "solhint --fix"
  ],
  "*.js": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

### 3. Commitlint

**File:** `.commitlintrc.json`

Enforces conventional commit messages:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2, "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore"]
    ],
    "header-max-length": [2, "always", 100]
  }
}
```

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**
- `feat(membership): add anonymous registration`
- `fix(security): prevent reentrancy in recordActivity`
- `perf(gas): optimize storage layout for members`
- `test(security): add DoS prevention tests`

---

## CI/CD Layer

### 1. GitHub Actions Workflows

#### Main CI/CD Workflow

**File:** `.github/workflows/test.yml`

**Jobs:**

1. **lint-and-format** - Code quality checks
   ```yaml
   - run: npm run prettier:check
   - run: npm run lint:sol
   - run: npm run lint:js
   ```

2. **test-node-18** - Tests on Node.js 18.x
   ```yaml
   - run: npm test
   ```

3. **test-node-20** - Tests on Node.js 20.x with coverage
   ```yaml
   - run: npm run test:coverage
   - uses: codecov/codecov-action@v4
   ```

4. **gas-report** - Gas benchmarking
   ```yaml
   - run: REPORT_GAS=true npm test
   ```

5. **security-audit** - Dependency security scanning
   ```yaml
   - run: npm audit --audit-level=moderate
   ```

6. **build-verification** - Compilation and size checks
   ```yaml
   - run: npm run compile
   - run: npm run size
   ```

7. **all-checks-passed** - Gate for merge
   ```yaml
   needs: [lint-and-format, test-node-18, test-node-20,
           gas-report, security-audit, build-verification]
   ```

#### Pull Request Workflow

**File:** `.github/workflows/pull-request.yml`

**Jobs:**

1. **pr-validation** - PR title and commit validation
   ```yaml
   - name: Check PR title
     run: |
       if [[ ! "$PR_TITLE" =~ ^(feat|fix|docs|style|refactor|test|chore|perf)(\(.+\))?:\ .+ ]]; then
         echo "❌ PR title must follow conventional commits"
         exit 1
       fi
   ```

2. **size-check** - Bundle size monitoring
   ```yaml
   - run: npm run size
   ```

3. **dependency-review** - Supply chain security
   ```yaml
   - uses: actions/dependency-review-action@v4
   ```

### 2. Codecov Integration

**File:** `codecov.yml`

Coverage tracking and enforcement:

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
```

**Coverage Reports:**
- Uploaded automatically from `test-node-20` job
- Visible in PR comments
- Blocks merge if coverage drops

---

## Security Features

### 1. Access Control

**Implementation:**
- Owner-only functions protected by `require(msg.sender == owner)`
- Pauser role for emergency contract pausing
- Member-only activity recording

**Tests:**
```javascript
it("Should prevent unauthorized owner function calls", async function () {
  await expect(
    membership.connect(attacker).createMembershipLevel("Hacker", 1000, 10)
  ).to.be.revertedWith("Not authorized");
});
```

### 2. Reentrancy Protection

**Pattern:** Checks-Effects-Interactions
```solidity
function recordActivity(uint256 score) external {
  require(isMember[msg.sender], "Not a member");

  // Effects
  memberActivities[msg.sender].push(score);

  // Interactions (if any) come last
}
```

**Tests:**
```javascript
it("Should handle concurrent activity recording", async function () {
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(membership.connect(user1).recordPrivateActivity(50));
  }
  await Promise.all(promises);
});
```

### 3. Input Validation

**Checks:**
- Non-zero addresses
- Token uniqueness
- Registration status
- Valid score ranges

**Tests:**
```javascript
it("Should reject empty anonymous token", async function () {
  await expect(
    membership.connect(user1).registerAnonymousMember(hre.ethers.ZeroHash)
  ).to.be.revertedWith("Invalid token");
});
```

### 4. DoS Prevention

**Strategies:**
- Avoid unbounded loops
- Limit array growth
- Gas-efficient storage patterns
- Pagination for large datasets

**Tests:**
```javascript
it("Should handle many members efficiently", async function () {
  const registrations = [];
  for (let i = 0; i < 10; i++) {
    registrations.push(membership.connect(signers[i]).registerPublicMember());
  }
  await Promise.all(registrations);
});
```

### 5. Data Privacy

**Features:**
- FHE (Fully Homomorphic Encryption) for sensitive data
- Anonymous member registration
- Obfuscated timestamps
- Encrypted activity scores

**Tests:**
```javascript
it("Should hide anonymous member join time", async function () {
  const token = await membership.generateAnonymousToken();
  await membership.connect(user1).registerAnonymousMember(token);
  const memberId = await membership.connect(user1).getMyMemberId();
  const info = await membership.getMemberInfo(memberId);

  expect(info[3]).to.equal(0); // Join time hidden
  expect(info[1]).to.equal(true); // Marked as anonymous
});
```

---

## Performance Optimization

### 1. Gas Optimization Techniques

#### Storage Layout Optimization

**Before:**
```solidity
struct Member {
  bool isAnonymous;      // 1 byte
  uint256 level;         // 32 bytes
  bool isActive;         // 1 byte
  uint256 joinTime;      // 32 bytes
}
```

**After (packed):**
```solidity
struct Member {
  uint256 joinTime;      // 32 bytes (slot 0)
  uint8 level;           // 1 byte  (slot 1)
  bool isAnonymous;      // 1 byte  (slot 1)
  bool isActive;         // 1 byte  (slot 1)
}
```

**Savings:** 1 storage slot = ~20,000 gas per write

#### Function Optimization

**Use `calldata` for read-only arrays:**
```solidity
// Before
function process(uint256[] memory data) external {
  // Costs ~3 gas per element to copy to memory
}

// After
function process(uint256[] calldata data) external {
  // No copy, direct read from calldata
}
```

**Use `unchecked` for safe arithmetic:**
```solidity
// Before
for (uint256 i = 0; i < array.length; i++) {
  // Overflow checks on every iteration
}

// After
for (uint256 i = 0; i < array.length;) {
  // ... loop body ...
  unchecked { ++i; }  // No overflow check needed
}
```

### 2. Gas Benchmarking

**Monitor gas usage:**
```bash
REPORT_GAS=true npm test test/Performance.test.js
```

**Expected benchmarks:**
- Registration: ~200,000-400,000 gas
- Activity recording: ~80,000-200,000 gas
- Level updates: ~50,000-150,000 gas

**Track gas increase:**
```javascript
const gasData = [];
for (const milestone of [10, 20, 30]) {
  const tx = await membership.recordActivity(50);
  const receipt = await tx.wait();
  gasData.push({ activities: milestone, gas: receipt.gasUsed });
}

// Calculate percentage increase
const gasIncrease = (gasData[2].gas - gasData[0].gas) / gasData[0].gas * 100;
expect(gasIncrease).to.be.lt(20); // Less than 20% increase
```

### 3. Contract Size Optimization

**Techniques:**
1. **Remove unused code**
   ```bash
   npm run compile  # Shows contract sizes
   ```

2. **Extract libraries**
   ```solidity
   library MembershipLib {
     function calculateLevel(uint256 activities) internal pure returns (uint8) {
       // Complex logic extracted
     }
   }
   ```

3. **Use libraries for common operations**
   ```solidity
   import "@openzeppelin/contracts/utils/math/SafeMath.sol";
   ```

4. **Minimize string literals**
   ```solidity
   // Before: "Not authorized to perform this action"
   // After: "Not authorized"
   ```

**Monitor size:**
```bash
npm run size
```

---

## Configuration Guide

### 1. Initial Setup

**1. Install dependencies:**
```bash
npm install
```

**2. Initialize Husky:**
```bash
npx husky install
```

**3. Create `.env` file:**
```bash
cp .env.example .env
```

**4. Configure environment variables:**
```env
# Required
PRIVATE_KEY=your_private_key_here
OWNER_ADDRESS=your_owner_address
DEPLOYER_ADDRESS=your_deployer_address
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_api_key

# Optional
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_api_key
CODECOV_TOKEN=your_token
```

### 2. Development Workflow

**1. Write smart contracts:**
```bash
# Contracts auto-lint on save (if configured in IDE)
```

**2. Compile contracts:**
```bash
npm run compile
```

**3. Run tests:**
```bash
npm test                  # All tests
npm test test/Security    # Security tests only
npm test test/Performance # Performance tests only
```

**4. Check gas usage:**
```bash
REPORT_GAS=true npm test
```

**5. Format code:**
```bash
npm run prettier
```

**6. Commit changes:**
```bash
git add .
git commit -m "feat(membership): add new feature"
# Pre-commit hooks run automatically
```

### 3. CI/CD Setup

**1. Enable GitHub Actions:**
- Workflows are in `.github/workflows/`
- Automatically run on push and PR

**2. Configure secrets:**
```
Settings > Secrets and variables > Actions
```

**Add secrets:**
- `CODECOV_TOKEN` - For coverage uploads
- `SEPOLIA_PRIVATE_KEY` - For deployment (optional)
- `ETHERSCAN_API_KEY` - For verification

**3. Configure branch protection:**
```
Settings > Branches > Add rule
```

**Required checks:**
- ✅ all-checks-passed
- ✅ Codecov coverage threshold

### 4. Performance Monitoring

**1. Enable gas reporting:**
```env
REPORT_GAS=true
```

**2. Set up gas price tracking:**
```env
COINMARKETCAP_API_KEY=your_api_key
GAS_PRICE_TOKEN=ETH
```

**3. Configure thresholds:**
```env
GAS_WARNING_THRESHOLD=500000
CONTRACT_SIZE_LIMIT=24576
```

**4. Run benchmarks:**
```bash
npm run test:gas
```

---

## Best Practices

### 1. Development

**Smart Contracts:**
- ✅ Keep functions under 50 lines
- ✅ Limit complexity to 8 or less
- ✅ Use explicit visibility modifiers
- ✅ Document all public functions
- ✅ Follow Checks-Effects-Interactions pattern
- ✅ Avoid unbounded loops
- ✅ Use events for important state changes

**JavaScript/TypeScript:**
- ✅ Use double quotes consistently
- ✅ Keep line length under 120 characters
- ✅ Limit function complexity to 10
- ✅ Use `const` by default
- ✅ Avoid `eval()` and similar constructs
- ✅ Handle errors explicitly

### 2. Testing

**Coverage:**
- ✅ Maintain 80%+ code coverage
- ✅ Test all edge cases
- ✅ Include negative test cases
- ✅ Test with multiple users
- ✅ Test concurrent operations

**Security:**
- ✅ Test access control thoroughly
- ✅ Verify input validation
- ✅ Check for reentrancy vulnerabilities
- ✅ Test DoS resistance
- ✅ Validate state consistency

**Performance:**
- ✅ Monitor gas usage
- ✅ Track gas increase over scale
- ✅ Verify contract size limits
- ✅ Benchmark critical operations

### 3. Git Workflow

**Commits:**
- ✅ Use conventional commit format
- ✅ Keep commits atomic
- ✅ Write descriptive messages
- ✅ Reference issues/PRs

**Branches:**
- ✅ Use feature branches
- ✅ Keep branches up to date
- ✅ Delete merged branches

**Pull Requests:**
- ✅ Use conventional commit format in PR title
- ✅ Provide clear description
- ✅ Link related issues
- ✅ Ensure CI passes
- ✅ Address review comments

### 4. Security

**Keys and Secrets:**
- ✅ Never commit private keys
- ✅ Use `.env` for sensitive data
- ✅ Rotate keys regularly
- ✅ Use different keys for different networks

**Access Control:**
- ✅ Use multi-signature for production
- ✅ Implement timelock for critical operations
- ✅ Set up pauser role for emergencies
- ✅ Document admin functions

**Deployment:**
- ✅ Test on testnet first
- ✅ Verify contracts on Etherscan
- ✅ Run security audits
- ✅ Monitor deployed contracts

### 5. Performance

**Gas Optimization:**
- ✅ Profile gas usage before optimizing
- ✅ Focus on frequently called functions
- ✅ Use storage efficiently
- ✅ Batch operations when possible
- ✅ Consider L2 solutions for high costs

**Contract Size:**
- ✅ Monitor size during development
- ✅ Extract libraries when needed
- ✅ Remove unused code
- ✅ Minimize string literals

**Monitoring:**
- ✅ Track gas costs over time
- ✅ Set up alerts for anomalies
- ✅ Monitor contract size growth
- ✅ Review performance tests regularly

---

## Troubleshooting

### Common Issues

**1. Pre-commit hooks not running**
```bash
# Reinstall Husky
npm run prepare
```

**2. Linting errors**
```bash
# Auto-fix what can be fixed
npm run lint:sol:fix
npm run lint:js:fix
npm run prettier
```

**3. Gas reporting not working**
```bash
# Check environment variable
echo $REPORT_GAS

# Set it explicitly
REPORT_GAS=true npm test
```

**4. Contract size limit exceeded**
```bash
# Check size
npm run size

# Options:
# - Extract libraries
# - Remove unused code
# - Minimize strings
# - Reduce optimizer runs
```

**5. CI/CD failures**
```bash
# Run CI checks locally
npm run ci

# With coverage
npm run ci:coverage
```

---

## Additional Resources

### Documentation
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solhint Rules](https://github.com/protofire/solhint/blob/master/docs/rules.md)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Security
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [SWC Registry](https://swcregistry.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

### Performance
- [Gas Optimization Tips](https://medium.com/coinmonks/gas-optimization-in-solidity-part-i-variables-9d5775e43dde)
- [EIP-170: Contract code size limit](https://eips.ethereum.org/EIPS/eip-170)

### Tools
- [Codecov](https://about.codecov.io/)
- [CoinMarketCap API](https://coinmarketcap.com/api/)
- [Etherscan API](https://docs.etherscan.io/)

---

## Summary

This comprehensive toolchain provides:

✅ **Security**: Multiple layers of security checks from development to deployment
✅ **Performance**: Gas optimization and contract size monitoring
✅ **Quality**: Automated code quality enforcement
✅ **Efficiency**: Pre-commit hooks prevent issues early
✅ **Visibility**: CI/CD provides continuous feedback
✅ **Compliance**: Conventional commits and coverage tracking

**Toolchain Flow:**
```
Code → Pre-commit Hooks → Commit → Push → CI/CD → Deploy
  ↓         ↓                ↓       ↓        ↓        ↓
Lint    Format           Validate  Test  Verify  Monitor
```

For questions or issues, refer to the project documentation or open an issue on GitHub.
