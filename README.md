# 🔐 Privacy-Preserving Membership Platform

> Secure, anonymous membership management with Gateway callback architecture, refund protection, and timeout safeguards powered by Zama FHEVM on Ethereum Sepolia

**[Video Demo demo.mp4]** | **[Architecture](ARCHITECTURE.md)** | **[API Reference](API.md)** | **[Documentation](TOOLCHAIN_INTEGRATION.md)**

🌐 **Website**: [https://fhe-membership.vercel.app/](https://fhe-membership.vercel.app/)

Built for the **Zama FHEVM ecosystem** - demonstrating practical privacy-preserving membership applications with production-grade security, DoS protection, and gas optimization.

**Network**: Sepolia (Chain ID: 11155111)
**Contract**: Deploy your own following [deployment guide](DEPLOYMENT.md)
**Explorer**: [View on Sepolia Etherscan](https://sepolia.etherscan.io/)

---

## ✨ Features

### 🏗️ 核心功能

- 🔐 **Privacy-First Architecture** - Member data encrypted with Fully Homomorphic Encryption
- 🎭 **Anonymous Registration** - Join without revealing personal information
- 🎖️ **Tiered Membership** - Bronze, Silver, Gold levels with encrypted progression
- 🔑 **Dual Registration Modes** - Public or anonymous token-based joining
- 📊 **Encrypted Activity Tracking** - Private activity records with FHE

### 🌉 Gateway回调架构

- 🔄 **Gateway Callback Pattern** - 异步解密处理，非阻塞式操作
- 📡 **Oracle Integration** - Zama FHEVM Gateway接口
- ⚡ **Async Processing** - 用户提交请求 → 合约记录 → Gateway解密 → 回调完成
- 🔌 **Pluggable Design** - 支持多种解密服务

### 💰 退款保护机制

- 🛡️ **Auto Refund** - 解密失败自动退款
- ⏱️ **Timeout Refund** - 7天无响应自动创建退款
- 📝 **Pending Transactions** - 待处理交易管理系统
- 🎁 **Manual Refund** - 用户手动申请退款选项

### ⏱️ 超时保护

- 🔒 **Decryption Timeout** - 7天未完成的请求可索取退款
- 📅 **Member Timeout** - 30天无活动的成员保护机制
- 🚨 **Emergency Recovery** - 防止永久锁定的安全机制
- 📊 **Timeout Tracking** - 完整的超时状态管理

### 🔒 安全特性

- 🛡️ **DoS Protection** - Rate limiting (100 actions/hour) + emergency pause mechanism
- ✅ **Input Validation** - 完整的输入检查和验证
- 🔐 **Access Control** - 细粒度的权限控制
- 🛡️ **Overflow Protection** - 数值溢出防护
- 📋 **Audit Trails** - 关键操作审计日志

### ⚡ 性能优化

- ⚡ **Gas Optimized** - Compiler optimization (200 runs + viaIR) with monitoring
- 📊 **Performance Monitoring** - Real-time gas tracking and optimization reports
- 🏗️ **Type Safety** - TypeScript integration for development reliability
- 🚀 **CI/CD Pipeline** - Automated testing, security checks, and deployment
- 🔍 **Security Auditing** - Automated scans via ESLint, Solhint, and CI/CD

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
Node.js 18.x or 20.x
MetaMask browser extension
Sepolia testnet ETH
```

Get free Sepolia ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### Installation

```bash
# Clone repository
git clone <repository-url>
cd privacy-membership-platform

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials (PRIVATE_KEY, PAUSER_ADDRESS, etc.)
```

### Deploy & Run

```bash
# Compile contracts with optimization
npm run compile

# Run comprehensive test suite (20+ tests)
npm test

# Deploy to Sepolia testnet
npm run deploy

# Verify on Etherscan
npm run verify

# Start frontend dev server
npm run dev
```

### Build for Production

```bash
# Build optimized frontend
npm run build

# Preview production build
npm run preview
```

---

## 🏗️ Architecture

```
Frontend Layer (Vite + JavaScript)
├── Client-side FHE encryption
├── MetaMask wallet integration
├── Real-time encrypted data display
├── Transaction monitoring
└── Responsive UI with Web3 connectivity

        ▼

Smart Contract Layer (Solidity 0.8.24)
├── Encrypted storage (euint32, euint64, ebool)
├── Homomorphic operations (FHE.add, FHE.gte, FHE.select)
├── Gateway callback handling
├── Refund mechanism management
├── Timeout protection
├── DoS protection (rate limiting + pause mechanism)
├── Gas-optimized (200 runs + viaIR compiler)
└── Access control (Owner + Pauser roles)

        ▼

Gateway Layer (Zama Oracle Service)
├── Asynchronous decryption processing
├── Request queuing and batching
├── Cryptographic verification
├── Callback transaction execution
└── Failure handling and retry logic

        ▼

Security & Quality Layer
├── ESLint (50+ security rules)
├── Solhint (gas optimization + security checks)
├── Input validation framework
├── Overflow protection
├── Audit event logging
├── Pre-commit hooks (Husky + lint-staged)
├── CI/CD (GitHub Actions security audits)
└── Performance benchmarking

        ▼

Zama FHEVM (Sepolia Testnet)
├── Encrypted computation layer
├── Privacy-preserving analytics
├── Secure membership tracking
├── Homomorphic operations on encrypted data
└── Oracle network integration
```

### 🔄 Gateway回调工作流程

```
用户提交加密请求
    ↓
合约记录请求（DecryptionRequest）
    ↓ [发出事件：DecryptionRequested]

Gateway监听事件
    ↓
检索加密数据
    ↓
执行同态解密
    ↓
验证解密结果
    ↓
生成证明（proof）
    ↓ [调用回调函数]

gatewayCallback(requestId, result, success)
    ↓
    ├─ 成功？ → _completeTransaction()
    │   └─ 更新状态 + 完成操作
    │
    └─ 失败？ → _triggerRefund()
        └─ 创建待处理退款

用户索取退款
    ↓
claimRefund(txId)
    ↓
资金退还
```

### ⏱️ 超时保护机制

```
成员注册/操作
    ↓
记录时间戳
    ↓
    ├─ [T + 7天] → 解密请求超时
    │   └─ 可以索取超时退款
    │
    └─ [T + 30天] → 成员账户超时
        └─ 触发恢复机制
```

---

## 🔧 Technical Implementation

### Gateway回调模式实现

**核心概念：异步解密处理**

```solidity
// 步骤1: 用户提交加密请求
uint256 requestId = submitDecryptionRequest(memberId, encryptedValue, "operation");

// 步骤2: Gateway监听事件后处理
event DecryptionRequested(uint256 requestId, uint32 memberId, string operation);

// 步骤3: Gateway验证后回调合约
function gatewayCallback(
    uint256 requestId,
    bytes memory decryptedResult,
    bool success
) external onlyOwner
```

**优势：**
- ✅ 非阻塞式操作 - 不延迟链上交易
- ✅ 容错能力强 - 失败自动退款
- ✅ 成本优化 - 批量处理请求
- ✅ 用户友好 - 透明的状态管理

### 退款机制实现

**三种退款方式：**

1. **自动退款（解密失败）**
```solidity
// Gateway检测到解密失败
gatewayCallback(requestId, "", false);
  → _triggerRefund(memberId, "Decryption failed")
  → 自动创建待处理退款记录
  → 用户稍后领取
```

2. **超时退款（7天无响应）**
```solidity
// 检查解密请求是否超时
if (block.timestamp - req.requestTime > 7 days) {
    claimTimeoutRefund(requestId);
    // 自动创建退款交易
}
```

3. **手动退款（用户申请）**
```solidity
// 用户主动请求
requestRefund(memberId, "Manual request");
  → 创建待处理交易
  → 用户确认领取
```

**待处理交易管理：**
```solidity
// 查看自己的待处理交易
bytes32[] txIds = getUserPendingTransactions(userAddress);

// 获取交易详情
(address user, uint256 amount, uint256 timestamp, bool claimed, string txType)
    = getPendingTransactionInfo(txId);

// 领取退款
claimRefund(txId);
```

### 超时保护实现

**双层超时保护：**

1. **解密请求超时（7天）**
   - 防止Gateway服务故障导致永久锁定
   - 用户可以索取超时退款

2. **成员账户超时（30天）**
   - 防止成员长期无活动
   - 触发账户恢复机制

```solidity
// 追踪关键时间点
mapping(uint32 => uint256) memberRegistrationTime;      // 注册时间
mapping(uint256 => uint256) decryptionRequestTime;      // 请求时间

// 检查超时
bool isMemberTimeout = (now - memberRegistrationTime > 30 days);
bool isDecryptionTimeout = (now - requestTime > 7 days);
```

### FHEVM Integration

**Encrypted Data Types**:

```solidity
// Member data protected with FHE
struct Member {
    euint32 encryptedMemberId;        // Private member ID
    euint64 encryptedJoinTimestamp;   // Private join time
    euint32 encryptedMembershipLevel; // Private tier (Bronze/Silver/Gold)
    bool isActive;
    bool isAnonymous;
    address wallet;
    uint256 publicJoinTime;
}
```

**Homomorphic Computations**:

```solidity
// Compare encrypted values without decryption
ebool isEligible = FHE.gte(memberScore, requiredScore);

// Add encrypted activity scores
euint64 totalScore = FHE.add(score1, score2);

// Conditional selection based on encrypted condition
euint32 newLevel = FHE.select(isEligible, goldLevel, silverLevel);
```

**Permission Management**:

```solidity
// Grant decryption permissions
FHE.allowThis(encryptedValue);           // Contract can use
FHE.allow(encryptedValue, memberAddress); // Member can decrypt
```

### DoS Protection Implementation

**Rate Limiting Mechanism**:

```solidity
modifier rateLimited() {
    uint256 currentWindow = block.timestamp / RATE_LIMIT_WINDOW;
    uint256 lastWindow = lastActionTimestamp[msg.sender] / RATE_LIMIT_WINDOW;

    if (currentWindow > lastWindow) {
        actionCount[msg.sender] = 0;
    }

    require(actionCount[msg.sender] < MAX_BATCH_SIZE, "Rate limit exceeded");
    actionCount[msg.sender]++;
    lastActionTimestamp[msg.sender] = block.timestamp;
    _;
}
```

**Emergency Pause Mechanism**:

```solidity
modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}

function pause() external onlyPauser whenNotPaused {
    paused = true;
    emit Paused(msg.sender);
}

function unpause() external onlyPauser whenPaused {
    paused = false;
    emit Unpaused(msg.sender);
}
```

**Configuration** (`.env`):

```env
PAUSER_ADDRESS=0x...        # Emergency pause authority
RATE_LIMIT_WINDOW=3600      # 1 hour window (seconds)
MAX_BATCH_SIZE=100          # Max 100 actions per window
```

---

## 📋 Tech Stack

### Smart Contracts
- **Solidity**: 0.8.24 with optimizer enabled (200 runs + viaIR)
- **FHEVM**: @fhevm/solidity v0.8.0 for encrypted types
- **Network**: Ethereum Sepolia testnet
- **Security**: Rate limiting, pause mechanism, access control

### Development Tools
- **Hardhat**: Development environment with gas reporter
- **TypeScript**: Type-safe scripts and tests
- **ESLint**: 50+ security-focused JavaScript rules
- **Solhint**: Solidity linting with gas optimization
- **Prettier**: Consistent code formatting

### Frontend
- **Vite**: Fast build tool and development server
- **Ethers.js**: v6.15.0 for blockchain interactions
- **JavaScript**: ES6+ with Web3 integration
- **MetaMask**: Wallet connectivity

### CI/CD & Quality
- **GitHub Actions**: Automated testing and security audits
- **Husky**: Pre-commit hooks for quality gates
- **Lint-staged**: Fast linting on changed files only
- **Coverage**: Comprehensive test coverage reporting

---

## 📁 Project Structure

```
privacy-membership-platform/
├── contracts/
│   └── AnonymousMembership.sol       # Main FHE contract with DoS protection
├── scripts/
│   ├── deploy.js                     # Hardhat deployment script
│   ├── verify.js                     # Etherscan verification
│   ├── interact.js                   # Interactive CLI for contract
│   └── simulate.js                   # Testing scenarios
├── test/
│   └── PrivacyMembership.test.js     # 20+ comprehensive tests
├── .github/workflows/
│   ├── test.yml                      # Multi-version testing
│   ├── pull-request.yml              # PR validation
│   └── security-audit.yml            # Security + performance audits
├── .husky/
│   ├── pre-commit                    # Quality checks before commit
│   └── commit-msg                    # Commit message validation
├── hardhat.config.cjs                # Hardhat + gas reporter config
├── tsconfig.json                     # TypeScript strict mode
├── .eslintrc.json                    # ESLint security rules
├── .solhint.json                     # Solhint gas + security rules
├── .prettierrc.json                  # Code formatting rules
├── TOOLCHAIN_INTEGRATION.md          # Complete toolchain guide
├── TESTING.md                        # Testing documentation
├── DEPLOYMENT.md                     # Deployment guide
└── .env.example                      # Environment configuration template
```

---

## 🔐 Safety & Security Guarantees

### 防止三类永久锁定

#### 1️⃣ 解密服务故障保护

**问题：** Gateway无响应导致用户资金永久锁定

**解决方案：**
```
T0: 用户提交解密请求
  ↓
T0 + 7天: 超时自动触发退款
  ↓
用户可以索取完整退款
```

**实现：**
```solidity
function claimTimeoutRefund(uint256 requestId) external {
    require(
        block.timestamp - req.requestTime > DECRYPTION_TIMEOUT,
        "Not yet timeout"
    );
    // 自动创建待处理退款
}
```

#### 2️⃣ 成员账户永久冻结保护

**问题：** 成员因任何原因无法继续操作

**解决方案：**
```
T0: 成员注册
  ↓
T0 + 30天: 成员超期
  ↓
触发账户恢复机制
```

#### 3️⃣ 解密失败保护

**问题：** 解密过程中出现错误

**解决方案：**
```
Gateway检测到失败
  ↓
gatewayCallback(requestId, "", false)
  ↓
自动触发 _triggerRefund()
  ↓
创建待处理退款
```

### 安全验证框架

```solidity
// 1️⃣ 输入验证 - 防止非法数据
function _validateMemberId(uint32 memberId) private view {
    require(memberId > 0 && memberId < membershipIdCounter);
}

// 2️⃣ 访问控制 - 防止权限提升
modifier onlyOwner() { require(msg.sender == owner); _; }
modifier onlyActiveMember() { require(members[id].isActive); _; }

// 3️⃣ 溢出保护 - 防止数值溢出
function _safeAdd(uint256 a, uint256 b) private pure returns (uint256) {
    require(a + b >= a, "Overflow");
    return a + b;
}

// 4️⃣ 审计日志 - 记录所有关键操作
event DecryptionRequested(uint256 requestId, uint32 memberId);
event GatewayCallback(uint256 requestId, bool success);
event RefundClaimed(bytes32 txId, address user);
```

### 常见问题解决

| 问题 | 症状 | 解决方案 |
|------|------|--------|
| Gateway超时 | 7天无响应 | `claimTimeoutRefund()` 索取退款 |
| 解密失败 | 交易失败 | 自动触发退款机制 |
| 成员冻结 | 30天无活动 | 触发账户恢复 |
| 重复注册 | "Already registered" | 使用不同地址重新注册 |
| 速率限制 | "Rate limit exceeded" | 等待1小时后重试 |

---

## 🔐 Privacy Model

### What's Private

- ✅ **Individual member IDs** - Encrypted with FHE (euint32)
- ✅ **Join timestamps** - Hidden for anonymous members (euint64)
- ✅ **Activity scores** - Encrypted computations only
- ✅ **Membership levels** - Private tier information (euint32)

### What's Public

- 📊 **Total member count** - Organizational transparency
- ✔️ **Membership status** - Active/inactive visibility
- 🔗 **Transaction existence** - Blockchain requirement
- ⚙️ **Contract metadata** - Level names, settings, counts

### Decryption Permissions

| Role | Permission | Access Level |
|------|-----------|--------------|
| **Members** | Can decrypt own data | Personal encrypted values |
| **Contract** | Homomorphic operations | Encrypted computations only |
| **Owner** | Administrative access | Encrypted campaign data |
| **Public** | No decryption | Aggregated statistics only |

---

## 🧪 Testing

### Test Coverage (20+ Tests)

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage
open coverage/index.html

# With gas reporting
REPORT_GAS=true npm test

# View gas report
cat gas-report.txt
```

### Test Categories

- ✅ **Deployment**: Contract initialization, default levels
- ✅ **Registration**: Public and anonymous member joining
- ✅ **Activity**: Private activity recording and tracking
- ✅ **Levels**: Membership tier progression and custom levels
- ✅ **Access Control**: Owner-only functions, pauser authorization
- ✅ **Security**: DoS protection, rate limiting, pause mechanism
- ✅ **Edge Cases**: Invalid inputs, duplicate registrations, limits

### Performance Metrics

| Operation | Gas Cost | Optimized |
|-----------|----------|-----------|
| Deploy Contract | ~3,500,000 | ✅ viaIR enabled |
| Register Public Member | ~280,000 | ✅ Rate limited |
| Register Anonymous Member | ~290,000 | ✅ Rate limited |
| Record Private Activity | ~180,000 | ✅ Optimized storage |
| Update Member Level | ~120,000 | ✅ Minimal computation |
| Pause/Unpause | ~28,000 | ✅ Simple state change |

**Contract Size**: ~22KB (under 24KB EIP-170 limit) ✅
**Test Execution**: ~15-20 seconds
**Coverage**: 95%+ lines covered

See [TESTING.md](TESTING.md) for complete testing documentation.

---

## 📖 Usage Guide

### 1. Register as Member

**Public Registration**:

```javascript
// Connect MetaMask and call contract
await contract.registerPublicMember();
// ✅ Transparent joining with public timestamp
```

**Anonymous Registration**:

```javascript
// Get anonymous token from owner
const token = await contract.generateAnonymousToken();

// Register anonymously
await contract.registerAnonymousMember(token);
// ✅ Complete privacy, no public timestamp
```

### 2. Record Activities

```javascript
// Record encrypted activity score
await contract.recordPrivateActivity(50);
// ✅ Score encrypted with FHE, only member can decrypt
```

### 3. Check Membership

```javascript
// Get my member ID
const memberId = await contract.getMyMemberId();

// Check membership info
const info = await contract.getMemberInfo(memberId);
console.log(info.activityCount); // Public activity count
```

### 4. Admin Operations

```javascript
// Create custom membership level (owner only)
await contract.createMembershipLevel("Platinum", 5000, 10);

// Update member tier based on encrypted score
await contract.updateMemberLevel(memberId);

// Emergency pause (pauser only)
await contract.pause();
```

### Interactive CLI

```bash
# Launch interactive contract interface
npm run interact

# Available actions:
# - View system statistics
# - Check membership status
# - Register as public/anonymous member
# - Record private activities
# - Update membership levels
# - Manage members (owner only)
# - Pause/unpause (pauser only)
```

---

## 🚢 Deployment

### Local Development

```bash
# Start local Hardhat node
npm run node

# Deploy to local network (in another terminal)
npm run deploy:local

# Run simulation scenarios
npm run simulate
```

### Sepolia Testnet Deployment

```bash
# 1. Ensure .env is configured
PRIVATE_KEY=your_private_key
PAUSER_ADDRESS=your_pauser_address
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_api_key

# 2. Compile with optimization
npm run compile

# 3. Deploy to Sepolia
npm run deploy
# ✅ Saves deployment info to deployments/sepolia-deployment.json

# 4. Verify contract on Etherscan
npm run verify
```

### Deployment Output

```json
{
  "network": "sepolia",
  "contractAddress": "0x...",
  "deployerAddress": "0x...",
  "transactionHash": "0x...",
  "blockNumber": 12345,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "etherscanUrl": "https://sepolia.etherscan.io/address/0x...",
  "verified": true
}
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

---

## 🔍 Security & Performance

### Security Features

- ✅ **ESLint**: 50+ security rules (no-eval, no-unsafe-negation, etc.)
- ✅ **Solhint**: Gas optimization + security checks (reentrancy, tx.origin)
- ✅ **DoS Protection**: Rate limiting (100 actions/hour per address)
- ✅ **Pause Mechanism**: Emergency stop with separate pauser role
- ✅ **Access Control**: Owner and pauser role separation
- ✅ **CI/CD Audits**: Automated security scanning on every PR

### Performance Optimization

**Compiler Settings**:

```javascript
solidity: {
  version: "0.8.24",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200      // Balanced optimization
    },
    viaIR: true      // Advanced IR-based optimization
  }
}
```

**Gas Monitoring**:

```bash
# Enable gas reporting
REPORT_GAS=true npm test

# View detailed report
cat gas-report.txt

# Check contract sizes
cat contract-size-report.txt
```

**Optimization Strategies**:
- ✅ Storage layout optimization
- ✅ Memory usage for temporary data
- ✅ Batch operations where possible
- ✅ Event emission for off-chain logging
- ✅ Minimal state variable usage

See [TOOLCHAIN_INTEGRATION.md](TOOLCHAIN_INTEGRATION.md) for complete toolchain documentation.

---

## 🔗 API Reference

> 完整的API文档请查看 [API.md](API.md)

### Member Functions

```solidity
// Register as public member (transparent)
function registerPublicMember() external whenNotPaused rateLimited

// Register anonymously with token
function registerAnonymousMember(bytes32 token) external whenNotPaused rateLimited

// Record encrypted activity score
function recordPrivateActivity(uint32 score) external onlyActiveMember whenNotPaused rateLimited

// Get my member ID
function getMyMemberId() external view returns (uint32)

// Check if address is active member
function isMember(address wallet) external view returns (bool)
```

### Gateway Functions

```solidity
// Submit decryption request to Gateway
function submitDecryptionRequest(
    uint32 memberId,
    euint64 encryptedValue,
    string memory operation
) external onlyActiveMember returns (uint256)

// Gateway callback function (owner only)
function gatewayCallback(
    uint256 requestId,
    bytes memory decryptedResult,
    bool success
) external onlyOwner
```

### Refund Functions

```solidity
// Request a refund
function requestRefund(uint32 memberId, string memory reason) external

// Claim pending refund
function claimRefund(bytes32 txId) external

// Claim timeout refund
function claimTimeoutRefund(uint256 requestId) external

// Get user's pending transactions
function getUserPendingTransactions(address user)
    external view returns (bytes32[] memory)

// Get pending transaction info
function getPendingTransactionInfo(bytes32 txId)
    external view returns (
        address user,
        uint256 amount,
        uint256 timestamp,
        bool claimed,
        string memory txType
    )
```

### Timeout Protection Functions

```solidity
// Check if member has timed out
function isMemberTimeout(uint32 memberId) external view returns (bool)

// Check if decryption request has timed out
function isDecryptionTimeout(uint256 requestId) external view returns (bool)
```

### Admin Functions

```solidity
// Create custom membership level (owner only)
function createMembershipLevel(string name, uint32 score, uint64 benefits) external onlyOwner

// Update member tier based on encrypted score
function updateMemberLevel(uint32 memberId) external

// Deactivate member (owner only)
function deactivateMember(uint32 memberId) external onlyOwner

// Generate anonymous registration token (owner only)
function generateAnonymousToken() external onlyOwner view returns (bytes32)
```

### Security Functions

```solidity
// Emergency pause (pauser or owner only)
function pause() external onlyPauser whenNotPaused

// Resume operations (pauser or owner only)
function unpause() external onlyPauser whenPaused

// Change pauser address (owner only)
function setPauser(address newPauser) external onlyOwner
```

### View Functions

```solidity
// Get system statistics
function getSystemStats() external view returns (
    uint32 totalMembersCount,
    uint32 totalLevels,
    uint32 nextMemberId
)

// Get member information (respects privacy)
function getMemberInfo(uint32 memberId) external view returns (
    bool isActive,
    bool isAnonymous,
    address wallet,
    uint256 publicJoinTime,
    uint256 activityCount
)

// Get membership level information
function getMembershipLevelInfo(uint32 levelId) external view returns (
    string memory name,
    bool isActive
)
```

---

## 🛠️ Development Workflow

### Daily Development

```bash
# 1. Start feature branch
git checkout -b feature/new-feature

# 2. Make changes and run checks
npm run lint:sol       # Solidity linting
npm test               # Run tests

# 3. Auto-format code
npm run format         # Prettier + lint fixes

# 4. Commit (triggers pre-commit hooks)
git commit -m "feat: add new feature"
# ✅ Automatic: linting, formatting, validation

# 5. Push and create PR
git push origin feature/new-feature
# ✅ Automatic: CI/CD runs security audits
```

### Pre-deployment Checklist

```bash
# 1. Full test suite
npm run ci

# 2. Gas optimization review
REPORT_GAS=true npm test
cat gas-report.txt

# 3. Contract size check
npm run compile
cat contract-size-report.txt

# 4. Coverage analysis
npm run test:coverage

# 5. Security review
npm run lint:sol
npm audit

# 6. Deploy and verify
npm run deploy
npm run verify
```

---

## ❓ Troubleshooting

### Common Issues

**Deployment Fails**:

```bash
# Error: Insufficient funds
# Solution: Get Sepolia ETH from faucet
https://sepoliafaucet.com/

# Error: Invalid RPC URL
# Solution: Check SEPOLIA_RPC_URL in .env
```

**Gas Reporting Not Working**:

```bash
# Solution: Set environment variable
REPORT_GAS=true npm test

# Or add to .env file
echo "REPORT_GAS=true" >> .env
```

**Pre-commit Hooks Fail**:

```bash
# Solution: Run checks manually
npm run format
npm run lint:sol

# Fix issues and retry commit
git add .
git commit -m "your message"
```

**Contract Size Too Large**:

```bash
# Solution 1: Increase optimizer runs
# Edit hardhat.config.cjs: runs: 10000

# Solution 2: Check size report
cat contract-size-report.txt

# Solution 3: Split into libraries
```

**Rate Limit Exceeded Error**:

```bash
# Error: "Rate limit exceeded"
# Reason: More than 100 actions per hour

# Solution: Wait for window to reset
# Or adjust MAX_BATCH_SIZE in .env (not recommended for production)
```

---

## 📚 Resources

### Documentation

- **[Zama FHEVM](https://docs.zama.ai/fhevm)** - FHE encryption for blockchain
- **[Hardhat](https://hardhat.org/docs)** - Development environment
- **[Solidity](https://docs.soliditylang.org/)** - Smart contract language
- **[Ethers.js](https://docs.ethers.org/)** - Web3 library

### Tools & Faucets

- **[Sepolia Etherscan](https://sepolia.etherscan.io/)** - Block explorer
- **[Sepolia Faucet](https://sepoliafaucet.com/)** - Get test ETH
- **[Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)** - Alternative faucet
- **[MetaMask](https://metamask.io/)** - Web3 wallet

### Security Resources

- **[Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)** - Best practices
- **[Solidity Security](https://docs.soliditylang.org/en/latest/security-considerations.html)** - Official guide
- **[OpenZeppelin](https://docs.openzeppelin.com/contracts/)** - Secure contracts library

### Project Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - 完整的架构设计说明
  - Gateway回调模式详解
  - 退款机制实现细节
  - 超时保护机制
  - 安全特性框架

- **[API.md](API.md)** - 完整的API参考文档
  - 所有合约函数说明
  - 参数和返回值详解
  - 使用示例代码
  - 权限矩阵

- **[TOOLCHAIN_INTEGRATION.md](TOOLCHAIN_INTEGRATION.md)** - Complete toolchain guide
- **[TESTING.md](TESTING.md)** - Testing documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide
- **[SECURITY_PERFORMANCE.md](SECURITY_PERFORMANCE.md)** - Security & performance details

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with conventional commits: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

**Code Quality Standards**:
- ✅ All tests must pass
- ✅ Code coverage should not decrease
- ✅ ESLint and Solhint checks must pass
- ✅ Pre-commit hooks must succeed
- ✅ Gas usage should not increase significantly

---

## 🗺️ Roadmap

### Completed ✅

**核心功能：**
- Privacy-preserving membership with FHE encryption
- Tiered membership system (Bronze, Silver, Gold)
- DoS protection (rate limiting + pause mechanism)
- Anonymous registration with privacy tokens

**Gateway架构：**
- ✅ Gateway callback pattern implementation
- ✅ Asynchronous decryption processing
- ✅ Refund mechanism (auto + timeout + manual)
- ✅ Timeout protection (7-day + 30-day)
- ✅ Pending transaction management

**安全防护：**
- ✅ Input validation framework
- ✅ Access control system
- ✅ Overflow protection
- ✅ Audit event logging
- ✅ Comprehensive error handling

**开发工具：**
- Gas optimization with comprehensive monitoring
- CI/CD pipeline with security audits
- TypeScript integration for type safety
- Comprehensive testing suite (20+ tests)
- Complete documentation (ARCHITECTURE.md, API.md)

### In Progress 🚧
- Advanced analytics dashboard
- Mobile-responsive UI improvements
- Multi-signature support for admin operations
- Gateway integration testing on Sepolia testnet

### Planned 🔮
- **Mainnet Deployment** - Production-ready release
- **DAO Governance** - Decentralized organizational management
- **Multi-chain Support** - Polygon, Arbitrum deployment
- **Advanced Privacy Features** - Zero-knowledge proofs integration
- **Reputation System** - On-chain reputation tracking
- **Integration APIs** - REST API for external systems
- **Batch Processing** - Optimized Gateway request batching
- **Cross-chain Refunds** - Multi-chain timeout refund system

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

This project is open source and available for educational and commercial use under the MIT license.

---

## 🏆 Acknowledgments

Built for the **Zama FHEVM ecosystem** with production-grade security and performance:

- **[Zama](https://zama.ai/)** - Fully Homomorphic Encryption technology
- **[Hardhat](https://hardhat.org/)** - Ethereum development environment
- **[OpenZeppelin](https://openzeppelin.com/)** - Secure smart contract libraries
- **[Sepolia Network](https://sepolia.etherscan.io/)** - Ethereum testnet infrastructure

Special thanks to the Zama team for advancing privacy-preserving blockchain technology.

---

## 📞 Support

Need help? Here's how to get support:

- 📖 **Documentation**: Check [TOOLCHAIN_INTEGRATION.md](TOOLCHAIN_INTEGRATION.md) and other docs
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Create a discussion thread
- 📧 **Security Issues**: Report privately via GitHub Security Advisory

---

**Built for privacy, secured by cryptography, optimized for performance.**

*Demonstrating the future of privacy-preserving organizational management with Zama FHEVM.*
