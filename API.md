# 📚 Privacy Membership Platform - API 文档

完整的智能合约API参考和使用示例

## 目录

- [成员管理](#成员管理)
- [成员等级](#成员等级)
- [活动记录](#活动记录)
- [Gateway解密](#gateway解密)
- [退款管理](#退款管理)
- [超时保护](#超时保护)
- [系统管理](#系统管理)
- [查询函数](#查询函数)

---

## 👥 成员管理

### registerPublicMember()

公开注册为成员

```solidity
function registerPublicMember() external whenNotPaused rateLimited
```

**参数：** 无

**返回值：** 无

**事件：**
```solidity
event MemberRegistered(uint32 indexed memberId, address indexed wallet, bool isAnonymous);
```

**用法示例：**

```javascript
// 使用ethers.js
const tx = await contract.registerPublicMember();
await tx.wait();

// 监听事件
contract.on("MemberRegistered", (memberId, wallet, isAnonymous) => {
    console.log(`成员 #${memberId} 已注册`);
    console.log(`匿名模式: ${isAnonymous}`);
});
```

**前置条件：**
- ✅ 调用者未注册过
- ✅ 合约未暂停
- ✅ 速率限制未超过（100请求/小时）

**后置效果：**
- ✅ 创建新成员记录
- ✅ 映射钱包地址 → 成员ID
- ✅ 初始化成员为Bronze等级
- ✅ 记录注册时间（用于超时保护）

**Gas成本：** ~80,000 gas

---

### registerAnonymousMember(bytes32 anonymousToken)

匿名注册为成员

```solidity
function registerAnonymousMember(bytes32 anonymousToken)
    external
    whenNotPaused
    rateLimited
```

**参数：**
- `anonymousToken` (bytes32) - 匿名令牌（由owner生成）

**返回值：** 无

**事件：**
```solidity
event MemberRegistered(uint32 indexed memberId, address indexed wallet, bool isAnonymous);
```

**用法示例：**

```javascript
// 1. Owner生成令牌
const token = await contract.generateAnonymousToken();

// 2. 用户使用令牌注册
const tx = await contract.registerAnonymousMember(token);
await tx.wait();

// 3. 验证注册成功
const memberId = await contract.getMyMemberId();
const info = await contract.getMemberInfo(memberId);
console.log(`匿名注册完成: ${info.isAnonymous}`); // true
```

**前置条件：**
- ✅ 令牌未被使用过
- ✅ 令牌非零值
- ✅ 调用者未注册过
- ✅ 合约未暂停

**后置效果：**
- ✅ 创建匿名成员记录
- ✅ publicJoinTime 设为 0（隐藏注册时间）
- ✅ 标记令牌为已使用
- ✅ 发出MemberRegistered事件

**Gas成本：** ~85,000 gas

---

## 📊 成员等级

### createMembershipLevel(string memory name, uint32 requiredScore, uint64 benefits)

创建新的成员等级

```solidity
function createMembershipLevel(
    string memory name,
    uint32 requiredScore,
    uint64 benefits
) external onlyOwner
```

**参数：**
- `name` (string) - 等级名称 (如："Platinum")
- `requiredScore` (uint32) - 所需得分
- `benefits` (uint64) - 权益值

**返回值：** 无

**事件：**
```solidity
event MembershipLevelCreated(uint32 indexed levelId, string name);
```

**用法示例：**

```javascript
// Owner创建新等级
const tx = await contract.createMembershipLevel(
    "Platinum",
    5000,    // 需要5000分
    10       // 10个权益点
);
await tx.wait();

// 获取等级信息
const levelInfo = await contract.getMembershipLevelInfo(4);
console.log(`等级名称: ${levelInfo.name}`);  // "Platinum"
console.log(`活跃: ${levelInfo.isActive}`);  // true
```

**默认等级：**
```
Bronze  - 需要100分  - 1个权益
Silver  - 需要500分  - 2个权益
Gold    - 需要1000分 - 5个权益
```

**Gas成本：** ~50,000 gas

---

### updateMemberLevel(uint32 memberId)

更新成员等级

```solidity
function updateMemberLevel(uint32 memberId) external
```

**参数：**
- `memberId` (uint32) - 成员ID

**返回值：** 无

**事件：**
```solidity
event MemberLevelUpdated(uint32 indexed memberId, uint32 newLevel);
```

**用法示例：**

```javascript
// 更新成员等级（基于活动记录）
const tx = await contract.updateMemberLevel(memberId);
await tx.wait();

// 监听等级更新
contract.on("MemberLevelUpdated", (memberId, newLevel) => {
    console.log(`成员 #${memberId} 升级到等级 #${newLevel}`);
});
```

**升级规则：**
```
活动记录数   →  等级
0-9        →  Bronze (1)
10-24      →  Silver (2)
25+        →  Gold   (3)
```

**Gas成本：** ~60,000 gas

---

## 📝 活动记录

### recordPrivateActivity(uint32 activityScore)

记录加密活动

```solidity
function recordPrivateActivity(uint32 activityScore)
    external
    onlyActiveMember
    whenNotPaused
    rateLimited
```

**参数：**
- `activityScore` (uint32) - 活动得分

**返回值：** 无

**事件：**
```solidity
event PrivateActivityRecorded(uint32 indexed memberId, uint256 timestamp);
```

**用法示例：**

```javascript
// 1. 获取自己的成员ID
const memberId = await contract.getMyMemberId();

// 2. 记录加密活动
const score = 50; // 50分
const tx = await contract.recordPrivateActivity(score);
await tx.wait();

// 3. 查询活动记录（链下）
contract.on("PrivateActivityRecorded", (memberId, timestamp) => {
    console.log(`活动已记录: 成员 #${memberId} at ${new Date(timestamp*1000)}`);
});

// 4. 检查活动计数
const memberInfo = await contract.getMemberInfo(memberId);
console.log(`活动总数: ${memberInfo.activityCount}`);
```

**前置条件：**
- ✅ 调用者是活跃成员
- ✅ 合约未暂停
- ✅ 速率限制未超过
- ✅ activityScore ≥ 0

**数据加密：**
- ✅ 得分以FHE加密存储 (euint64)
- ✅ 时间戳加密存储
- ✅ 只有成员可以解密自己的数据

**Gas成本：** ~60,000 gas

---

## 🔐 Gateway解密

### submitDecryptionRequest(uint32 memberId, euint64 encryptedValue, string memory operation)

提交解密请求给Gateway

```solidity
function submitDecryptionRequest(
    uint32 memberId,
    euint64 encryptedValue,
    string memory operation
) external onlyActiveMember returns (uint256)
```

**参数：**
- `memberId` (uint32) - 成员ID
- `encryptedValue` (euint64) - 加密值
- `operation` (string) - 操作类型 (如："update_level", "calculate_rewards")

**返回值：**
- `requestId` (uint256) - 唯一的请求ID

**事件：**
```solidity
event DecryptionRequested(uint256 indexed requestId, uint32 indexed memberId, string operation);
```

**工作流程：**

```javascript
// 步骤1: 提交解密请求
const requestId = await contract.submitDecryptionRequest(
    memberId,
    encryptedActivityScore,
    "update_member_level"
);

// 步骤2: Gateway 监听事件并处理
// [链下过程 - Gateway服务]
// - 检索加密值
// - 使用私钥解密
// - 生成证明
// - 发送回调

// 步骤3: 处理Gateway回调结果
contract.on("GatewayCallback", (requestId, success, result) => {
    if (success) {
        console.log(`解密成功: ${result}`);
        // 用户可以继续
    } else {
        console.log(`解密失败，请求退款`);
        // 自动触发退款
    }
});
```

**前置条件：**
- ✅ 调用者是活跃成员
- ✅ 调用者拥有该成员ID
- ✅ encryptedValue 非空

**后置效果：**
- ✅ 创建DecryptionRequest记录
- ✅ 记录请求时间（用于超时检测）
- ✅ 返回唯一requestId

**Gas成本：** ~90,000 gas

---

### gatewayCallback(uint256 requestId, bytes memory decryptedResult, bool success)

Gateway的回调函数

```solidity
function gatewayCallback(
    uint256 requestId,
    bytes memory decryptedResult,
    bool success
) external onlyOwner
```

**参数：**
- `requestId` (uint256) - 原始请求ID
- `decryptedResult` (bytes) - 解密的结果
- `success` (bool) - 解密是否成功

**返回值：** 无

**事件：**
```solidity
event GatewayCallback(uint256 indexed requestId, bool success, bytes result);
```

**调用方式：**

```javascript
// 仅Gateway服务可以调用（通过owner账户）
const decryptedValue = 100; // 示例值
const encodedResult = ethers.AbiCoder.defaultAbiCoder().encode(
    ['uint64'],
    [decryptedValue]
);

const tx = await contract.gatewayCallback(
    requestId,
    encodedResult,
    true  // 成功标志
);
await tx.wait();
```

**成功流程：**
```
gatewayCallback(requestId, result, true)
    ↓
_completeTransaction(memberId, result)
    ↓
处理解密数据
    ↓
更新合约状态
```

**失败流程：**
```
gatewayCallback(requestId, "", false)
    ↓
_triggerRefund(memberId, "Decryption failed")
    ↓
创建待处理退款
    ↓
用户可索取
```

**Gas成本：** ~100,000 gas

---

## 💰 退款管理

### requestRefund(uint32 memberId, string memory reason)

请求退款

```solidity
function requestRefund(uint32 memberId, string memory reason) external
```

**参数：**
- `memberId` (uint32) - 成员ID
- `reason` (string) - 退款原因

**返回值：** 无

**事件：**
```solidity
event RefundRequested(bytes32 indexed txId, address indexed user, string reason);
```

**用法示例：**

```javascript
// 用户请求退款
const tx = await contract.requestRefund(
    memberId,
    "Decryption failed"
);
await tx.wait();

// 监听退款请求
contract.on("RefundRequested", (txId, user, reason) => {
    console.log(`退款请求: ${reason}`);
    console.log(`交易ID: ${txId}`);
});
```

**前置条件：**
- ✅ 调用者拥有该成员ID

**后置效果：**
- ✅ 创建PendingTransaction记录
- ✅ 发出RefundRequested事件
- ✅ 用户可以索取退款

**Gas成本：** ~50,000 gas

---

### claimRefund(bytes32 txId)

索取待处理退款

```solidity
function claimRefund(bytes32 txId) external
```

**参数：**
- `txId` (bytes32) - 待处理交易ID

**返回值：** 无

**事件：**
```solidity
event RefundClaimed(bytes32 indexed txId, address indexed user, uint256 amount);
```

**完整流程示例：**

```javascript
// 步骤1: 查询待处理交易
const userAddress = await signer.getAddress();
const txIds = await contract.getUserPendingTransactions(userAddress);

// 步骤2: 检查交易详情
for (let txId of txIds) {
    const info = await contract.getPendingTransactionInfo(txId);
    console.log(`交易类型: ${info.txType}`);
    console.log(`金额: ${info.amount} wei`);
    console.log(`已领取: ${info.claimed}`);

    // 步骤3: 索取退款
    if (!info.claimed) {
        const tx = await contract.claimRefund(txId);
        await tx.wait();
        console.log(`✓ 退款已领取`);
    }
}
```

**前置条件：**
- ✅ 调用者是交易所有者
- ✅ 交易未被领取

**后置效果：**
- ✅ 标记交易为已领取
- ✅ 发出RefundClaimed事件
- ✅ 可能转账资金（如果有金额）

**Gas成本：** ~40,000 gas

---

### claimTimeoutRefund(uint256 requestId)

索取解密超时退款

```solidity
function claimTimeoutRefund(uint256 requestId) external
```

**参数：**
- `requestId` (uint256) - 解密请求ID

**返回值：** 无

**事件：**
```solidity
event TransactionTimeout(uint256 indexed timeoutDuration, bytes32 indexed txId);
```

**超时退款流程：**

```javascript
// 步骤1: 检查请求是否超时
const isTimeout = await contract.isDecryptionTimeout(requestId);

if (isTimeout) {
    // 步骤2: 索取超时退款
    const tx = await contract.claimTimeoutRefund(requestId);
    await tx.wait();
    console.log(`✓ 超时退款已创建`);

    // 步骤3: 查询新的待处理交易
    const txIds = await contract.getUserPendingTransactions(userAddress);
    console.log(`待处理交易数: ${txIds.length}`);
}
```

**超时规则：**
- ⏱️ 解密请求超时 = 7天无响应
- 🔄 自动创建退款交易
- 💳 用户可随时领取

**前置条件：**
- ✅ requestId < decryptionRequestCounter
- ✅ 请求未已解决
- ✅ 已超过7天

**后置效果：**
- ✅ 标记请求为已解决
- ✅ 创建PendingTransaction
- ✅ 发出TransactionTimeout事件

**Gas成本：** ~70,000 gas

---

## ⏱️ 超时保护

### isMemberTimeout(uint32 memberId)

检查成员是否已超期

```solidity
function isMemberTimeout(uint32 memberId) external view returns (bool)
```

**参数：**
- `memberId` (uint32) - 成员ID

**返回值：**
- `bool` - true如果成员已超过30天未活动

**用法示例：**

```javascript
const memberId = await contract.getMyMemberId();
const isTimeout = await contract.isMemberTimeout(memberId);

if (isTimeout) {
    console.log(`⚠️  成员已超期，可以申请重置`);
    // 可能允许重新注册或其他操作
}
```

**Gas成本：** ~1,000 gas (view函数)

---

### isDecryptionTimeout(uint256 requestId)

检查解密请求是否已超时

```solidity
function isDecryptionTimeout(uint256 requestId) external view returns (bool)
```

**参数：**
- `requestId` (uint256) - 解密请求ID

**返回值：**
- `bool` - true如果请求已超过7天未处理

**监控例子：**

```javascript
// 定时检查待处理请求
setInterval(async () => {
    // 扫描所有待处理的解密请求
    for (let i = 0; i < requestCount; i++) {
        const req = await contract.decryptionRequests(i);

        if (!req.resolved) {
            const isTimeout = await contract.isDecryptionTimeout(i);
            if (isTimeout) {
                console.log(`⚠️  请求 #${i} 已超时，可以索取退款`);
                // 自动索取超时退款
                await contract.claimTimeoutRefund(i);
            }
        }
    }
}, 1000 * 60 * 60); // 每小时检查一次
```

**Gas成本：** ~1,000 gas (view函数)

---

## 🛠️ 系统管理

### pause()

暂停合约

```solidity
function pause() external onlyPauser whenNotPaused
```

**参数：** 无

**返回值：** 无

**事件：**
```solidity
event Paused(address indexed account);
```

**用法示例：**

```javascript
// Owner或Pauser暂停合约
const tx = await contract.pause();
await tx.wait();

// 验证暂停状态
const isPaused = await contract.paused();
console.log(`合约已暂停: ${isPaused}`);

// 尝试操作会失败
try {
    await contract.registerPublicMember();
} catch (error) {
    console.log(`错误: Contract is paused`);
}
```

**效果：**
- ✅ 所有外部操作被阻止
- ✅ 查询函数仍可用
- ✅ 管理员可以unpause

**Gas成本：** ~28,000 gas

---

### unpause()

恢复合约

```solidity
function unpause() external onlyPauser whenPaused
```

**参数：** 无

**返回值：** 无

**事件：**
```solidity
event Unpaused(address indexed account);
```

**用法示例：**

```javascript
const tx = await contract.unpause();
await tx.wait();
console.log(`✓ 合约已恢复`);
```

**Gas成本：** ~28,000 gas

---

### setPauser(address newPauser)

更改Pauser地址

```solidity
function setPauser(address newPauser) external onlyOwner
```

**参数：**
- `newPauser` (address) - 新的Pauser地址

**返回值：** 无

**事件：**
```solidity
event PauserChanged(address indexed previousPauser, address indexed newPauser);
```

**用法示例：**

```javascript
const newPauserAddress = "0x..."; // 新的pauser地址

const tx = await contract.setPauser(newPauserAddress);
await tx.wait();

console.log(`Pauser已更改为: ${newPauserAddress}`);
```

**Gas成本：** ~30,000 gas

---

### deactivateMember(uint32 memberId)

停用成员

```solidity
function deactivateMember(uint32 memberId) external onlyOwner
```

**参数：**
- `memberId` (uint32) - 成员ID

**返回值：** 无

**事件：**
```solidity
event MemberDeactivated(uint32 indexed memberId);
```

**用法示例：**

```javascript
// Owner停用成员
const tx = await contract.deactivateMember(memberId);
await tx.wait();

// 验证成员已停用
const info = await contract.getMemberInfo(memberId);
console.log(`成员活跃: ${info.isActive}`); // false
```

**前置条件：**
- ✅ 成员当前活跃

**后置效果：**
- ✅ 成员标记为非活跃
- ✅ totalMembers计数减少
- ✅ 成员无法执行操作

**Gas成本：** ~35,000 gas

---

## 📊 查询函数

### getMyMemberId()

获取调用者的成员ID

```solidity
function getMyMemberId() external view returns (uint32)
```

**返回值：**
- `uint32` - 成员ID (如果未注册则返回0)

**用法示例：**

```javascript
const memberId = await contract.getMyMemberId();
if (memberId === 0) {
    console.log("您还未注册");
} else {
    console.log(`您的成员ID: #${memberId}`);
}
```

**Gas成本：** <1,000 gas

---

### isMember(address wallet)

检查地址是否是活跃成员

```solidity
function isMember(address wallet) external view returns (bool)
```

**参数：**
- `wallet` (address) - 钱包地址

**返回值：**
- `bool` - true如果地址是活跃成员

**用法示例：**

```javascript
const memberAddress = "0x...";
const isActive = await contract.isMember(memberAddress);
console.log(`${memberAddress} 是活跃成员: ${isActive}`);
```

**Gas成本：** <1,000 gas

---

### getMemberInfo(uint32 memberId)

获取成员信息

```solidity
function getMemberInfo(uint32 memberId) external view returns (
    bool isActive,
    bool isAnonymous,
    address wallet,
    uint256 publicJoinTime,
    uint256 activityCount
)
```

**参数：**
- `memberId` (uint32) - 成员ID

**返回值：**
- `isActive` (bool) - 成员是否活跃
- `isAnonymous` (bool) - 是否匿名注册
- `wallet` (address) - 钱包地址
- `publicJoinTime` (uint256) - 公开加入时间 (匿名为0)
- `activityCount` (uint256) - 活动记录数

**用法示例：**

```javascript
const memberId = await contract.getMyMemberId();
const info = await contract.getMemberInfo(memberId);

console.log(`活跃: ${info.isActive}`);
console.log(`匿名: ${info.isAnonymous}`);
console.log(`钱包: ${info.wallet}`);
console.log(`加入时间: ${new Date(info.publicJoinTime * 1000)}`);
console.log(`活动数: ${info.activityCount}`);
```

**Gas成本：** <1,000 gas

---

### getMembershipLevelInfo(uint32 levelId)

获取成员等级信息

```solidity
function getMembershipLevelInfo(uint32 levelId) external view returns (
    string memory name,
    bool isActive
)
```

**参数：**
- `levelId` (uint32) - 等级ID

**返回值：**
- `name` (string) - 等级名称
- `isActive` (bool) - 等级是否活跃

**用法示例：**

```javascript
// 列出所有等级
for (let i = 1; i <= 3; i++) {
    const level = await contract.getMembershipLevelInfo(i);
    console.log(`${i}. ${level.name} (活跃: ${level.isActive})`);
}

// 输出：
// 1. Bronze (活跃: true)
// 2. Silver (活跃: true)
// 3. Gold (活跃: true)
```

**Gas成本：** <1,000 gas

---

### getSystemStats()

获取系统统计

```solidity
function getSystemStats() external view returns (
    uint32 totalMembersCount,
    uint32 totalLevels,
    uint32 nextMemberId
)
```

**返回值：**
- `totalMembersCount` (uint32) - 活跃成员总数
- `totalLevels` (uint32) - 等级总数
- `nextMemberId` (uint32) - 下一个成员ID

**用法示例：**

```javascript
const stats = await contract.getSystemStats();

console.log(`统计信息:`);
console.log(`- 活跃成员: ${stats.totalMembersCount}`);
console.log(`- 等级数: ${stats.totalLevels}`);
console.log(`- 下一个成员ID: ${stats.nextMemberId}`);
```

**Gas成本：** <1,000 gas

---

### getUserPendingTransactions(address user)

获取用户的待处理交易列表

```solidity
function getUserPendingTransactions(address user) external view returns (bytes32[] memory)
```

**参数：**
- `user` (address) - 用户地址

**返回值：**
- `bytes32[]` - 待处理交易ID数组

**用法示例：**

```javascript
const userAddress = await signer.getAddress();
const txIds = await contract.getUserPendingTransactions(userAddress);

console.log(`待处理交易: ${txIds.length}`);
txIds.forEach(txId => {
    console.log(`- ${txId}`);
});
```

**Gas成本：** <1,000 gas

---

### getPendingTransactionInfo(bytes32 txId)

获取待处理交易详情

```solidity
function getPendingTransactionInfo(bytes32 txId) external view returns (
    address user,
    uint256 amount,
    uint256 timestamp,
    bool claimed,
    string memory txType
)
```

**参数：**
- `txId` (bytes32) - 交易ID

**返回值：**
- `user` (address) - 用户地址
- `amount` (uint256) - 金额
- `timestamp` (uint256) - 时间戳
- `claimed` (bool) - 是否已领取
- `txType` (string) - 交易类型

**用法示例：**

```javascript
const txId = "0x...";
const info = await contract.getPendingTransactionInfo(txId);

console.log(`交易详情:`);
console.log(`- 用户: ${info.user}`);
console.log(`- 金额: ${ethers.formatEther(info.amount)} ETH`);
console.log(`- 时间: ${new Date(info.timestamp * 1000)}`);
console.log(`- 已领取: ${info.claimed}`);
console.log(`- 类型: ${info.txType}`);
```

**Gas成本：** <1,000 gas

---

## 🔐 权限矩阵

```
┌──────────────────────────────┬──────┬────────┬──────────┐
│ 函数                         │Owner │Pauser  │ Member   │
├──────────────────────────────┼──────┼────────┼──────────┤
│ registerPublicMember         │ ✓    │ ✓      │ ✓        │
│ registerAnonymousMember      │ ✓    │ ✓      │ ✓        │
│ recordPrivateActivity        │ ✓    │ ✓      │ ✓ (own)  │
│ submitDecryptionRequest      │ ✓    │ ✓      │ ✓ (own)  │
│ gatewayCallback              │ ✓    │ ✗      │ ✗        │
│ requestRefund                │ ✓    │ ✓      │ ✓ (own)  │
│ claimRefund                  │ ✓    │ ✓      │ ✓ (own)  │
│ claimTimeoutRefund           │ ✓    │ ✓      │ ✓ (own)  │
│ createMembershipLevel        │ ✓    │ ✗      │ ✗        │
│ updateMemberLevel            │ ✓    │ ✗      │ ✓        │
│ deactivateMember             │ ✓    │ ✗      │ ✗        │
│ pause                        │ ✓    │ ✓      │ ✗        │
│ unpause                      │ ✓    │ ✓      │ ✗        │
│ setPauser                    │ ✓    │ ✗      │ ✗        │
│ generateAnonymousToken       │ ✓    │ ✗      │ ✗        │
│ (所有 view/query 函数)       │ ✓    │ ✓      │ ✓        │
└──────────────────────────────┴──────┴────────┴──────────┘
```

---

## ⚠️ 常见错误

| 错误消息 | 原因 | 解决方案 |
|---------|------|--------|
| "Already registered" | 地址已注册过 | 使用不同地址注册 |
| "Not an active member" | 成员已停用 | 联系管理员 |
| "Rate limit exceeded" | 请求过于频繁 | 等待1小时后重试 |
| "Contract is paused" | 合约已暂停 | 稍候重试 |
| "Token already used" | 令牌已被使用 | 获取新的匿名令牌 |
| "Not authorized" | 权限不足 | 使用正确的账户 |

---

## 📈 最佳实践

### 1. 错误处理

```javascript
try {
    const tx = await contract.registerPublicMember();
    await tx.wait();
    console.log("✓ 注册成功");
} catch (error) {
    if (error.reason === "Already registered") {
        console.log("您已注册过");
    } else {
        console.error("注册失败:", error.message);
    }
}
```

### 2. 批量查询

```javascript
// 不好 - 多个请求
for (let id = 1; id <= 100; id++) {
    const info = await contract.getMemberInfo(id);
}

// 更好 - 使用multicall
const multicall = new ethers.Contract(
    multicallAddress,
    multicallABI,
    provider
);

const calls = [];
for (let id = 1; id <= 100; id++) {
    calls.push(contract.getMemberInfo.populateTransaction(id));
}
const results = await multicall.aggregate(calls);
```

### 3. 事件监听

```javascript
// 实时监听
const listener = (memberId, wallet, isAnonymous) => {
    console.log(`新成员: #${memberId}`);
};

contract.on("MemberRegistered", listener);

// 停止监听
contract.off("MemberRegistered", listener);
```

---

**更新于 2024年 | Zama FHEVM** 🔐
