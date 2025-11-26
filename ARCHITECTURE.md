# 🏗️ Privacy Membership Platform - 架构说明

> 融合加密成员管理与隐私保护的创新性架构设计

## 📋 目录

- [系统架构](#系统架构)
- [Gateway回调模式](#gateway回调模式)
- [退款机制](#退款机制)
- [超时保护](#超时保护)
- [安全特性](#安全特性)
- [数据流设计](#数据流设计)

---

## 🏛️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     前端应用 (Frontend)                      │
│  - 用户注册/身份验证                                         │
│  - 加密数据提交                                              │
│  - 实时状态查询                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   MetaMask / Web3 钱包         │
        │   Ethers.js 合约交互           │
        └────────────────┬───────────────┘
                         │
        ┌────────────────▼───────────────┐
        │   AnonymousMembership 合约      │
        │   (Solidity + FHE)             │
        │                                 │
        │  ├─ 成员管理系统                │
        │  ├─ Gateway回调处理             │
        │  ├─ 退款机制                    │
        │  └─ 超时保护                    │
        └────────────────┬───────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │   Zama FHEVM Gateway             │
        │   (解密 + 回调服务)              │
        │                                   │
        │  ├─ 接收加密请求                │
        │  ├─ 执行同态计算                │
        │  ├─ 解密结果                    │
        │  └─ 回调合约                    │
        └────────────────┬──────────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │   Ethereum Sepolia 区块链        │
        │                                   │
        │  ├─ 交易验证                     │
        │  ├─ 状态持久化                   │
        │  └─ 事件日志                     │
        └───────────────────────────────────┘
```

### 核心组件

#### 1. 智能合约 (AnonymousMembership.sol)

**主要功能：**
- ✅ 隐私成员管理
- ✅ 加密数据处理
- ✅ Gateway集成
- ✅ 自动退款
- ✅ 超时保护
- ✅ DoS防护

**关键状态变量：**
```solidity
// 成员数据
mapping(uint32 => Member) members;           // 成员信息
mapping(address => uint32) walletToMemberId; // 钱包地址映射

// 解密请求追踪
mapping(uint256 => DecryptionRequest) decryptionRequests;
mapping(uint256 => string) betIdByRequestId;

// 待处理交易
mapping(bytes32 => PendingTransaction) pendingTransactions;
mapping(address => bytes32[]) userPendingTransactions;

// 超时追踪
mapping(uint32 => uint256) memberRegistrationTime;
```

#### 2. Gateway服务 (网关)

**职责：**
- 接收加密解密请求
- 执行同态计算
- 验证解密结果
- 回调智能合约

**请求流程：**
```
用户提交加密请求
    ↓
合约记录请求（DecryptionRequest）
    ↓
Gateway异步处理
    ↓
验证解密签名
    ↓
调用gatewayCallback()
    ↓
更新合约状态
```

---

## 🔄 Gateway回调模式

### 设计原理

**传统模式的问题：**
- ❌ 阻塞式等待 - 合约无法主动获取链外数据
- ❌ 单点故障 - Oracle故障导致永久锁定
- ❌ 成本高昂 - 每个操作都需要Oracle费用

**Gateway回调模式的优势：**
- ✅ 异步处理 - 非阻塞式操作
- ✅ 容错机制 - 超时自动退款
- ✅ 成本优化 - 批量处理请求
- ✅ 用户体验 - 快速反馈

### 实现流程

#### 步骤1：提交加密请求

```solidity
function submitDecryptionRequest(
    uint32 memberId,
    euint64 encryptedValue,
    string memory operation
) external onlyActiveMember returns (uint256)
```

**作用：**
- 记录用户的解密请求
- 返回唯一的requestId
- 触发DecryptionRequested事件

**示例：**
```javascript
const requestId = await contract.submitDecryptionRequest(
    memberId,
    encryptedActivityScore,
    "update_member_level"
);
```

#### 步骤2：Gateway处理

```
Gateway 监听事件 DecryptionRequested
    ↓
检索 euint64 encryptedValue
    ↓
使用私钥解密
    ↓
验证解密结果
    ↓
生成证明 (proof)
```

#### 步骤3：回调合约

```solidity
function gatewayCallback(
    uint256 requestId,
    bytes memory decryptedResult,
    bool success
) external onlyOwner
```

**处理逻辑：**
- 验证requestId有效性
- 解析解密结果
- 成功 → 完成交易
- 失败 → 触发退款

**流程图：**
```
gatewayCallback(requestId, result, success)
    │
    ├─ 解密成功?
    │   ├─ YES → _completeTransaction(memberId, result)
    │   └─ NO  → _triggerRefund(memberId, "Decryption failed")
    │
    └─ 发出事件 GatewayCallback
```

### 错误处理

```solidity
// 情景1：Gateway超时（7天）
if (block.timestamp - req.requestTime > DECRYPTION_TIMEOUT) {
    user.claimTimeoutRefund(requestId); // 自动退款
}

// 情景2：解密失败
gatewayCallback(requestId, "", false); // 立即触发退款

// 情景3：重复请求
require(!req.resolved, "Already resolved"); // 防止重复处理
```

---

## 💰 退款机制

### 设计目标

**保护用户资产，防止永久锁定：**
- 解密失败自动退款
- 超时自动退款
- 用户手动申请退款

### 退款流程

#### 1. 自动退款（解密失败）

```solidity
// Gateway发现解密失败
gatewayCallback(requestId, "", false)
    ↓
_triggerRefund(memberId, "Decryption failed")
    ↓
创建 PendingTransaction
    ↓
用户索取退款 claimRefund(txId)
    ↓
资金转账
```

#### 2. 超时退款

```solidity
// 检查是否超时
if (block.timestamp - req.requestTime > DECRYPTION_TIMEOUT) {
    ✅ 用户可以索取超时退款
}

// 用户调用
claimTimeoutRefund(requestId)
    ↓
标记请求为已解决
    ↓
创建退款交易记录
    ↓
发出 TransactionTimeout 事件
```

#### 3. 手动退款请求

```solidity
// 用户主动请求
requestRefund(memberId, "Manual request")
    ↓
_triggerRefund(memberId, reason)
    ↓
生成待处理交易 (PendingTransaction)
    ↓
用户稍后索取 claimRefund(txId)
```

### 待处理交易结构

```solidity
struct PendingTransaction {
    address user;          // 收款地址
    uint256 amount;        // 退款金额
    uint256 timestamp;     // 申请时间
    bool claimed;          // 是否已领取
    string txType;         // 交易类型
}

// 类型包括：
// - "refund"          : 正常退款
// - "timeout_refund"  : 超时退款
// - "registration"    : 注册待处理
// - "activity"        : 活动待处理
```

### 退款管理函数

```solidity
// 查询用户待处理交易
bytes32[] txIds = contract.getUserPendingTransactions(userAddress);

// 获取交易详情
(address user, uint256 amount, uint256 timestamp, bool claimed, string txType)
    = contract.getPendingTransactionInfo(txId);

// 索取退款
contract.claimRefund(txId);
```

---

## ⏱️ 超时保护

### 保护机制

**防止三类永久锁定：**

#### 1. 成员永久锁定

```solidity
// 追踪注册时间
mapping(uint32 => uint256) memberRegistrationTime;

// 检查是否超期
function isMemberTimeout(uint32 memberId) external view returns (bool) {
    uint256 age = block.timestamp - memberRegistrationTime[memberId];
    return age > REFUND_TIMEOUT; // 30天
}
```

**流程：**
```
成员注册
    ↓ (30 days)
可以索取退款
    ↓
账户恢复正常
```

#### 2. 解密请求超时

```solidity
// 解密请求超时 = 7天无响应
uint256 private constant DECRYPTION_TIMEOUT = 7 days;

// 检查超时
function isDecryptionTimeout(uint256 requestId) external view returns (bool) {
    DecryptionRequest storage req = decryptionRequests[requestId];
    return (block.timestamp - req.requestTime) > DECRYPTION_TIMEOUT;
}

// 索取超时退款
function claimTimeoutRefund(uint256 requestId) external {
    require(isDecryptionTimeout(requestId), "Not yet timeout");
    // 自动创建退款
}
```

**时间线：**
```
T0: 提交解密请求
    ↓
T0 + 7 days: 可以索取超时退款
    ↓
自动退款（可选）
```

#### 3. 成员活动超时

```solidity
// 30天后，成员可以要求重置账户
if (block.timestamp - memberRegistrationTime[memberId] > 30 days) {
    // 允许重新注册或恢复
}
```

### 超时常数配置

```solidity
// 防止解密服务故障导致永久锁定
uint256 private constant DECRYPTION_TIMEOUT = 7 days;

// 防止成员账户长期无响应
uint256 private constant REFUND_TIMEOUT = 30 days;
```

### 超时工作流

```
用户提交请求
    │
    ├─ 立即处理 (< 7天)
    │   └─ 成功 ✓
    │
    ├─ 超时 (> 7天)
    │   ├─ 无响应
    │   └─ claimTimeoutRefund()
    │
    └─ Gateway延迟回调
        ├─ 仍可恢复
        └─ 更新状态
```

---

## 🔐 安全特性

### 1. 输入验证

```solidity
function _validateMemberId(uint32 memberId) private view {
    require(memberId > 0 && memberId < membershipIdCounter, "Invalid member ID");
}

// 应用场所：
// - 所有接受 memberId 的函数
// - 所有接受外部输入的函数
```

**验证清单：**
- ✅ 成员ID范围检查
- ✅ 零地址检查
- ✅ 金额范围检查
- ✅ 时间戳合法性检查

### 2. 访问控制

```solidity
modifier onlyOwner() { }
modifier onlyPauser() { }
modifier onlyActiveMember() { }

// 权限矩阵
┌──────────────────┬───────┬─────────┬────────────┐
│ 函数             │ Owner │ Pauser  │ Member     │
├──────────────────┼───────┼─────────┼────────────┤
│ pause()          │ ✓     │ ✓       │ ✗          │
│ withdraw()       │ ✓     │ ✗       │ ✗          │
│ register()       │ ✓     │ ✓       │ ✓          │
│ recordActivity() │ ✗     │ ✓       │ ✓          │
│ claimRefund()    │ ✓     │ ✗       │ ✓          │
└──────────────────┴───────┴─────────┴────────────┘
```

### 3. 溢出保护

```solidity
function _safeAdd(uint256 a, uint256 b) private pure returns (uint256) {
    require(a + b >= a, "Overflow protection triggered");
    return a + b;
}

// Solidity 0.8.x 内置检查
// + 自定义安全函数，增加防护
```

**保护场景：**
- ✅ 待处理交易金额累加
- ✅ 解密请求计数器
- ✅ 活动记录计数

### 4. 审计提示

```solidity
function _auditLog(string memory operation, uint32 memberId) private {
    // 记录关键操作，供链下审计系统监听
}

// 关键事件：
// - MemberRegistered    : 新成员
// - DecryptionRequested : 解密请求
// - GatewayCallback     : Gateway回调
// - RefundRequested     : 退款请求
// - TransactionTimeout  : 超时发生
```

**审计日志示例：**
```javascript
// 监听事件
contract.on("DecryptionRequested", (requestId, memberId, operation) => {
    console.log(`[AUDIT] 请求解密: ${requestId} - 成员: ${memberId}`);
});

contract.on("GatewayCallback", (requestId, success, result) => {
    console.log(`[AUDIT] Gateway回调: ${requestId} - 状态: ${success}`);
});
```

---

## 📊 数据流设计

### 完整的业务流程

#### 流程1：基本成员注册 + 活动记录

```
用户
  │
  ├─ 1. registerPublicMember()
  │      └─ 创建成员记录 + 记录注册时间
  │
  ├─ 2. recordPrivateActivity(score)
  │      └─ 记录加密活动
  │
  └─ 3. getMyMemberId()
         └─ 查询成员ID
```

#### 流程2：Gateway解密 + 退款

```
用户
  │
  ├─ 1. submitDecryptionRequest(memberId, encryptedValue, operation)
  │      ↓
  │      [合约]
  │      ├─ 创建 DecryptionRequest
  │      └─ 发出 DecryptionRequested 事件
  │
  ├─ [Gateway 监听事件]
  │   ├─ 检索加密值
  │   ├─ 执行解密
  │   └─ 生成证明
  │
  ├─ 2. gatewayCallback(requestId, result, success) [Gateway调用]
  │      ↓
  │      [合约]
  │      ├─ 验证签名
  │      ├─ 解析结果
  │      ├─ 成功? → _completeTransaction()
  │      └─ 失败? → _triggerRefund()
  │
  ├─ 3. claimRefund(txId) [可选]
  │      └─ 用户领取退款
  │
  └─ [自动超时处理]
      └─ 7天后 → claimTimeoutRefund(requestId)
```

#### 流程3：超时保护激活

```
成员活动
  │
  ├─ T0: 注册时刻记录
  │
  ├─ T0 + 7 天
  │   └─ 解密请求过期
  │       └─ claimTimeoutRefund() 可用
  │
  ├─ T0 + 30 天
  │   └─ 成员过期
  │       └─ isMemberTimeout() = true
  │
  └─ T0 + 30+ 天
      └─ 可以重新注册或恢复
```

### 状态转移图

```
┌─────────────┐
│  未注册      │
│ (UNREGISTERED)
└──────┬──────┘
       │ registerPublicMember()
       │ registerAnonymousMember()
       ▼
┌─────────────────────┐
│  已注册 - 活跃       │
│ (REGISTERED_ACTIVE) │
└──────┬──────────────┘
       │
       ├─ recordPrivateActivity()
       │  │
       │  └─ [活动记录]
       │
       ├─ submitDecryptionRequest()
       │  │
       │  ├─ [解密成功]
       │  │  └─ _completeTransaction()
       │  │
       │  ├─ [解密失败]
       │  │  └─ _triggerRefund()
       │  │
       │  └─ [超时 > 7天]
       │     └─ claimTimeoutRefund()
       │
       ├─ requestRefund()
       │  └─ _triggerRefund()
       │
       ├─ pause()
       │  └─ [暂停 → 所有操作受阻]
       │
       └─ deactivateMember() [Owner]
          └─ [成员停用]
               ▼
          ┌──────────────┐
          │ 已停用        │
          │ (INACTIVE)   │
          └──────────────┘
```

---

## 📈 性能考虑

### Gas优化

```solidity
// 优化1: 批量操作
// ✅ 减少存储操作次数
// ✅ 合并相关状态变化

// 优化2: 映射索引
// ✅ walletToMemberId - O(1) 查询
// ✅ memberActivities - 按成员ID索引

// 优化3: 事件驱动
// ✅ 链下索引关键事件
// ✅ 减少合约查询压力

// 典型操作成本
操作                   Gas     优化
─────────────────────────────────────
registerPublicMember   ~80K    ✓ 优化
recordPrivateActivity  ~60K    ✓ 优化
submitDecryption       ~90K    ✓ 优化
gatewayCallback        ~100K   ✓ 优化
claimRefund           ~40K    ✓ 优化
```

### 存储布局

```solidity
// Slot优化
Contract Storage:

Slot 0: address owner          (20 bytes)
        address pauser         (20 bytes)
        bool paused            (1 byte)

Slot 1: uint32 totalMembers    (4 bytes)
        uint32 membershipIdCounter (4 bytes)
        uint32 levelCounter    (4 bytes)

Slot 2+: 映射数据 (按需分配)
```

---

## 🔍 监控和维护

### 关键指标

```javascript
// 1. 成员指标
totalMembers           // 总成员数
activeMemberRatio      // 活跃成员比例
anonymousMembers       // 匿名成员数

// 2. 解密指标
pendingDecryptions     // 待处理解密
decryptionTimeouts    // 超时次数
decryptionSuccessRate // 成功率

// 3. 财务指标
totalRefunds          // 退款总额
refundClaims          // 退款索取
platformFees          // 平台费用
```

### 事件监听示例

```javascript
// 监听新成员注册
contract.on("MemberRegistered", (memberId, wallet, isAnonymous) => {
    console.log(`新成员: ${memberId} - 匿名: ${isAnonymous}`);
});

// 监听解密请求
contract.on("DecryptionRequested", (requestId, memberId) => {
    console.log(`解密请求: ${requestId} - 成员: ${memberId}`);
    // 触发Gateway处理
});

// 监听超时发生
contract.on("TransactionTimeout", (duration, txId) => {
    console.log(`超时: ${duration} - 交易: ${txId}`);
});

// 监听退款
contract.on("RefundClaimed", (txId, user, amount) => {
    console.log(`退款: ${amount} wei - 用户: ${user}`);
});
```

---

## 📚 总结

### 创新特性

| 特性 | 传统模式 | 本方案 |
|------|---------|--------|
| 解密方式 | 同步等待 | 异步回调 |
| 失败处理 | 永久锁定 | 自动退款 |
| 超时保护 | 无 | 双层超时 |
| 成本 | 高 | 优化 |
| 用户体验 | 差 | 优秀 |

### 下一步

- 📝 查看 [API.md](API.md) 获取完整API文档
- 🧪 查看 [TESTING.md](TESTING.md) 了解测试方案
- 🚀 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解部署步骤
- 📖 查看 [README.md](README.md) 获取快速开始指南

---

**建立于Zama FHEVM的创新隐私架构** 🔐
