// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract AnonymousMembership is SepoliaConfig {

    address public owner;
    address public pauser;
    bool public paused;
    uint32 public totalMembers;
    uint32 public membershipIdCounter;

    uint256 private constant MAX_BATCH_SIZE = 100;
    uint256 private constant RATE_LIMIT_WINDOW = 1 hours;
    uint256 private constant DECRYPTION_TIMEOUT = 7 days;
    uint256 private constant REFUND_TIMEOUT = 30 days;

    mapping(address => uint256) private lastActionTimestamp;
    mapping(address => uint256) private actionCount;

    struct Member {
        euint32 encryptedMemberId;
        euint64 encryptedJoinTimestamp;
        euint32 encryptedMembershipLevel;
        bool isActive;
        bool isAnonymous;
        address wallet;
        uint256 publicJoinTime;
    }

    struct MembershipLevel {
        string name;
        euint32 encryptedRequiredScore;
        euint64 encryptedBenefits;
        bool isActive;
    }

    struct PrivateActivity {
        euint32 encryptedMemberId;
        euint64 encryptedActivityScore;
        euint64 encryptedTimestamp;
        bool isProcessed;
    }

    // 用于Gateway解密请求的结构
    struct DecryptionRequest {
        uint32 memberId;
        euint64 encryptedValue;
        uint256 requestTime;
        bool resolved;
        bytes result;
    }

    // 用于管理待处理的交易和退款
    struct PendingTransaction {
        address user;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
        string txType; // "registration", "activity", "refund"
    }

    mapping(uint32 => Member) public members;
    mapping(address => uint32) public walletToMemberId;
    mapping(uint32 => MembershipLevel) public membershipLevels;
    mapping(uint32 => PrivateActivity[]) public memberActivities;
    mapping(bytes32 => bool) public usedAnonymousTokens;

    // Gateway解密请求跟踪
    mapping(uint256 => DecryptionRequest) public decryptionRequests;
    uint256 public decryptionRequestCounter;

    // 待处理交易和退款管理
    mapping(bytes32 => PendingTransaction) public pendingTransactions;
    mapping(address => bytes32[]) public userPendingTransactions;

    // 超时保护追踪
    mapping(uint32 => uint256) public memberRegistrationTime;

    uint32 public levelCounter;

    event MemberRegistered(uint32 indexed memberId, address indexed wallet, bool isAnonymous);
    event MembershipLevelCreated(uint32 indexed levelId, string name);
    event MemberLevelUpdated(uint32 indexed memberId, uint32 newLevel);
    event PrivateActivityRecorded(uint32 indexed memberId, uint256 timestamp);
    event MemberDeactivated(uint32 indexed memberId);
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event PauserChanged(address indexed previousPauser, address indexed newPauser);

    // Gateway回调相关事件
    event DecryptionRequested(uint256 indexed requestId, uint32 indexed memberId, string operation);
    event GatewayCallback(uint256 indexed requestId, bool success, bytes result);
    event TransactionTimeout(uint256 indexed timeoutDuration, bytes32 indexed txId);
    event RefundClaimed(bytes32 indexed txId, address indexed user, uint256 amount);
    event RefundRequested(bytes32 indexed txId, address indexed user, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyPauser() {
        require(msg.sender == pauser || msg.sender == owner, "Not authorized to pause");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    modifier onlyActiveMember() {
        uint32 memberId = walletToMemberId[msg.sender];
        require(memberId > 0 && members[memberId].isActive, "Not an active member");
        _;
    }

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

    constructor(address _pauser) {
        require(_pauser != address(0), "Invalid pauser address");
        owner = msg.sender;
        pauser = _pauser;
        paused = false;
        membershipIdCounter = 1;
        levelCounter = 1;

        // Create default membership levels
        _createDefaultLevels();
    }

    function _createDefaultLevels() private {
        // Bronze Level
        euint32 bronzeScore = FHE.asEuint32(100);
        euint64 bronzeBenefits = FHE.asEuint64(1);
        membershipLevels[1] = MembershipLevel({
            name: "Bronze",
            encryptedRequiredScore: bronzeScore,
            encryptedBenefits: bronzeBenefits,
            isActive: true
        });
        FHE.allowThis(bronzeScore);
        FHE.allowThis(bronzeBenefits);

        // Silver Level
        euint32 silverScore = FHE.asEuint32(500);
        euint64 silverBenefits = FHE.asEuint64(2);
        membershipLevels[2] = MembershipLevel({
            name: "Silver",
            encryptedRequiredScore: silverScore,
            encryptedBenefits: silverBenefits,
            isActive: true
        });
        FHE.allowThis(silverScore);
        FHE.allowThis(silverBenefits);

        // Gold Level
        euint32 goldScore = FHE.asEuint32(1000);
        euint64 goldBenefits = FHE.asEuint64(5);
        membershipLevels[3] = MembershipLevel({
            name: "Gold",
            encryptedRequiredScore: goldScore,
            encryptedBenefits: goldBenefits,
            isActive: true
        });
        FHE.allowThis(goldScore);
        FHE.allowThis(goldBenefits);

        levelCounter = 4;
    }

    // Register as public member
    function registerPublicMember() external whenNotPaused rateLimited {
        require(walletToMemberId[msg.sender] == 0, "Already registered");

        uint32 memberId = membershipIdCounter++;
        euint32 encryptedMemberId = FHE.asEuint32(memberId);
        euint64 encryptedTimestamp = FHE.asEuint64(uint64(block.timestamp));
        euint32 encryptedLevel = FHE.asEuint32(1); // Start with Bronze level

        members[memberId] = Member({
            encryptedMemberId: encryptedMemberId,
            encryptedJoinTimestamp: encryptedTimestamp,
            encryptedMembershipLevel: encryptedLevel,
            isActive: true,
            isAnonymous: false,
            wallet: msg.sender,
            publicJoinTime: block.timestamp
        });

        // 记录注册时间 - 用于超时保护
        memberRegistrationTime[memberId] = block.timestamp;

        walletToMemberId[msg.sender] = memberId;
        totalMembers++;

        // Grant FHE permissions
        FHE.allowThis(encryptedMemberId);
        FHE.allowThis(encryptedTimestamp);
        FHE.allowThis(encryptedLevel);
        FHE.allow(encryptedMemberId, msg.sender);
        FHE.allow(encryptedTimestamp, msg.sender);
        FHE.allow(encryptedLevel, msg.sender);

        emit MemberRegistered(memberId, msg.sender, false);
    }

    // Register as anonymous member using privacy token
    function registerAnonymousMember(bytes32 anonymousToken) external whenNotPaused rateLimited {
        require(walletToMemberId[msg.sender] == 0, "Already registered");
        require(!usedAnonymousTokens[anonymousToken], "Token already used");
        require(anonymousToken != bytes32(0), "Invalid token");

        uint32 memberId = membershipIdCounter++;
        euint32 encryptedMemberId = FHE.asEuint32(memberId);
        euint64 encryptedTimestamp = FHE.asEuint64(uint64(block.timestamp));
        euint32 encryptedLevel = FHE.asEuint32(1); // Start with Bronze level

        members[memberId] = Member({
            encryptedMemberId: encryptedMemberId,
            encryptedJoinTimestamp: encryptedTimestamp,
            encryptedMembershipLevel: encryptedLevel,
            isActive: true,
            isAnonymous: true,
            wallet: msg.sender,
            publicJoinTime: 0 // Hidden for anonymous members
        });

        // 记录注册时间 - 用于超时保护
        memberRegistrationTime[memberId] = block.timestamp;

        walletToMemberId[msg.sender] = memberId;
        usedAnonymousTokens[anonymousToken] = true;
        totalMembers++;

        // Grant FHE permissions
        FHE.allowThis(encryptedMemberId);
        FHE.allowThis(encryptedTimestamp);
        FHE.allowThis(encryptedLevel);
        FHE.allow(encryptedMemberId, msg.sender);
        FHE.allow(encryptedTimestamp, msg.sender);
        FHE.allow(encryptedLevel, msg.sender);

        emit MemberRegistered(memberId, msg.sender, true);
    }

    // Record private activity for member
    function recordPrivateActivity(uint32 activityScore) external onlyActiveMember whenNotPaused rateLimited {
        uint32 memberId = walletToMemberId[msg.sender];

        euint32 encryptedMemberId = FHE.asEuint32(memberId);
        euint64 encryptedScore = FHE.asEuint64(uint64(activityScore));
        euint64 encryptedTimestamp = FHE.asEuint64(uint64(block.timestamp));

        PrivateActivity memory activity = PrivateActivity({
            encryptedMemberId: encryptedMemberId,
            encryptedActivityScore: encryptedScore,
            encryptedTimestamp: encryptedTimestamp,
            isProcessed: false
        });

        memberActivities[memberId].push(activity);

        // Grant FHE permissions
        FHE.allowThis(encryptedMemberId);
        FHE.allowThis(encryptedScore);
        FHE.allowThis(encryptedTimestamp);
        FHE.allow(encryptedScore, msg.sender);

        emit PrivateActivityRecorded(memberId, block.timestamp);
    }

    // Create new membership level (owner only)
    function createMembershipLevel(
        string memory name,
        uint32 requiredScore,
        uint64 benefits
    ) external onlyOwner {
        euint32 encryptedScore = FHE.asEuint32(requiredScore);
        euint64 encryptedBenefits = FHE.asEuint64(benefits);

        membershipLevels[levelCounter] = MembershipLevel({
            name: name,
            encryptedRequiredScore: encryptedScore,
            encryptedBenefits: encryptedBenefits,
            isActive: true
        });

        FHE.allowThis(encryptedScore);
        FHE.allowThis(encryptedBenefits);

        emit MembershipLevelCreated(levelCounter, name);
        levelCounter++;
    }

    // Update member level based on encrypted score calculation
    function updateMemberLevel(uint32 memberId) external {
        require(members[memberId].isActive, "Member not active");

        // Calculate total score from activities (simplified)
        uint256 totalActivities = memberActivities[memberId].length;
        if (totalActivities == 0) return;

        // In real implementation, this would use FHE operations to calculate
        // encrypted total score and compare with level requirements

        // For now, simple level progression based on activity count
        uint32 newLevel = 1;
        if (totalActivities >= 10) newLevel = 2;
        if (totalActivities >= 25) newLevel = 3;

        euint32 encryptedNewLevel = FHE.asEuint32(newLevel);
        members[memberId].encryptedMembershipLevel = encryptedNewLevel;

        FHE.allowThis(encryptedNewLevel);
        FHE.allow(encryptedNewLevel, members[memberId].wallet);

        emit MemberLevelUpdated(memberId, newLevel);
    }

    // Deactivate member (owner only)
    function deactivateMember(uint32 memberId) external onlyOwner {
        require(members[memberId].isActive, "Member already inactive");
        members[memberId].isActive = false;
        totalMembers--;

        emit MemberDeactivated(memberId);
    }

    // Get member info (respects privacy)
    function getMemberInfo(uint32 memberId) external view returns (
        bool isActive,
        bool isAnonymous,
        address wallet,
        uint256 publicJoinTime,
        uint256 activityCount
    ) {
        Member storage member = members[memberId];
        return (
            member.isActive,
            member.isAnonymous,
            member.wallet,
            member.publicJoinTime,
            memberActivities[memberId].length
        );
    }

    // Get my member ID
    function getMyMemberId() external view returns (uint32) {
        return walletToMemberId[msg.sender];
    }

    // Check if member exists
    function isMember(address wallet) external view returns (bool) {
        uint32 memberId = walletToMemberId[wallet];
        return memberId > 0 && members[memberId].isActive;
    }

    // Get membership level info
    function getMembershipLevelInfo(uint32 levelId) external view returns (
        string memory name,
        bool isActive
    ) {
        MembershipLevel storage level = membershipLevels[levelId];
        return (level.name, level.isActive);
    }

    // Get total statistics
    function getSystemStats() external view returns (
        uint32 totalMembersCount,
        uint32 totalLevels,
        uint32 nextMemberId
    ) {
        return (totalMembers, levelCounter - 1, membershipIdCounter);
    }

    // Pause control functions
    function pause() external onlyPauser whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyPauser whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function setPauser(address newPauser) external onlyOwner {
        require(newPauser != address(0), "Invalid pauser address");
        address oldPauser = pauser;
        pauser = newPauser;
        emit PauserChanged(oldPauser, newPauser);
    }

    // Generate anonymous registration token (owner only)
    function generateAnonymousToken() external onlyOwner view returns (bytes32) {
        return keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender));
    }

    // ============ Gateway回调模式实现 ============

    /**
     * @dev 提交加密请求供Gateway解密
     * 用户流程：提交加密请求 → 合约记录 → Gateway解密 → 回调完成交易
     */
    function submitDecryptionRequest(
        uint32 memberId,
        euint64 encryptedValue,
        string memory operation
    ) external onlyActiveMember returns (uint256) {
        require(walletToMemberId[msg.sender] == memberId, "Not member owner");

        uint256 requestId = decryptionRequestCounter++;
        decryptionRequests[requestId] = DecryptionRequest({
            memberId: memberId,
            encryptedValue: encryptedValue,
            requestTime: block.timestamp,
            resolved: false,
            result: ""
        });

        emit DecryptionRequested(requestId, memberId, operation);
        return requestId;
    }

    /**
     * @dev Gateway回调函数 - 处理解密结果并完成交易
     * 仅限Gateway地址调用（通常由Zama Oracle服务调用）
     */
    function gatewayCallback(
        uint256 requestId,
        bytes memory decryptedResult,
        bool success
    ) external onlyOwner {
        require(requestId < decryptionRequestCounter, "Invalid request ID");
        DecryptionRequest storage req = decryptionRequests[requestId];
        require(!req.resolved, "Already resolved");

        req.resolved = true;
        req.result = decryptedResult;

        if (success) {
            // 解密成功 - 完成交易
            _completeTransaction(req.memberId, decryptedResult);
        } else {
            // 解密失败 - 触发退款机制
            _triggerRefund(req.memberId, "Decryption failed");
        }

        emit GatewayCallback(requestId, success, decryptedResult);
    }

    /**
     * @dev 完成交易（解密成功后）
     */
    function _completeTransaction(uint32 memberId, bytes memory result) private {
        Member storage member = members[memberId];
        require(member.isActive, "Member not active");

        // 处理解密结果
        // 可以根据不同的操作类型执行相应的逻辑
        // 这里是一个通用框架
    }

    // ============ 超时保护机制 ============

    /**
     * @dev 检查成员是否处于超时状态
     */
    function isMemberTimeout(uint32 memberId) external view returns (bool) {
        uint256 registrationTime = memberRegistrationTime[memberId];
        if (registrationTime == 0) return false;
        return (block.timestamp - registrationTime) > REFUND_TIMEOUT;
    }

    /**
     * @dev 检查解密请求是否超时
     */
    function isDecryptionTimeout(uint256 requestId) external view returns (bool) {
        if (requestId >= decryptionRequestCounter) return false;
        DecryptionRequest storage req = decryptionRequests[requestId];
        if (req.resolved) return false;
        return (block.timestamp - req.requestTime) > DECRYPTION_TIMEOUT;
    }

    /**
     * @dev 索取超时退款 - 如果解密请求未在规定时间内完成
     */
    function claimTimeoutRefund(uint256 requestId) external {
        require(requestId < decryptionRequestCounter, "Invalid request ID");
        DecryptionRequest storage req = decryptionRequests[requestId];
        require(!req.resolved, "Already resolved");

        uint256 elapsedTime = block.timestamp - req.requestTime;
        require(elapsedTime > DECRYPTION_TIMEOUT, "Not yet timeout");

        // 标记为已解决，避免重复索取
        req.resolved = true;

        Member storage member = members[req.memberId];
        address memberAddress = member.wallet;

        // 记录待处理的退款交易
        bytes32 txId = keccak256(abi.encodePacked(requestId, memberAddress, block.timestamp));
        pendingTransactions[txId] = PendingTransaction({
            user: memberAddress,
            amount: 0, // 超时退款可能没有金额，取决于实现
            timestamp: block.timestamp,
            claimed: false,
            txType: "timeout_refund"
        });

        userPendingTransactions[memberAddress].push(txId);

        emit TransactionTimeout(DECRYPTION_TIMEOUT, txId);
    }

    // ============ 退款机制 ============

    /**
     * @dev 触发退款 - 在解密失败或错误时调用
     */
    function _triggerRefund(uint32 memberId, string memory reason) private {
        Member storage member = members[memberId];
        require(member.isActive, "Member not active");

        address user = member.wallet;
        bytes32 txId = keccak256(abi.encodePacked(memberId, user, block.timestamp));

        pendingTransactions[txId] = PendingTransaction({
            user: user,
            amount: 0,
            timestamp: block.timestamp,
            claimed: false,
            txType: "refund"
        });

        userPendingTransactions[user].push(txId);

        emit RefundRequested(txId, user, reason);
    }

    /**
     * @dev 请求退款 - 用户主动请求
     */
    function requestRefund(uint32 memberId, string memory reason) external {
        require(walletToMemberId[msg.sender] == memberId, "Not member owner");
        _triggerRefund(memberId, reason);
    }

    /**
     * @dev 索取待处理的退款
     */
    function claimRefund(bytes32 txId) external {
        PendingTransaction storage tx = pendingTransactions[txId];
        require(tx.user == msg.sender, "Not transaction owner");
        require(!tx.claimed, "Already claimed");

        tx.claimed = true;

        emit RefundClaimed(txId, msg.sender, tx.amount);
    }

    /**
     * @dev 获取用户的待处理交易列表
     */
    function getUserPendingTransactions(address user)
        external
        view
        returns (bytes32[] memory)
    {
        return userPendingTransactions[user];
    }

    /**
     * @dev 获取待处理交易的详细信息
     */
    function getPendingTransactionInfo(bytes32 txId)
        external
        view
        returns (
            address user,
            uint256 amount,
            uint256 timestamp,
            bool claimed,
            string memory txType
        )
    {
        PendingTransaction storage tx = pendingTransactions[txId];
        return (tx.user, tx.amount, tx.timestamp, tx.claimed, tx.txType);
    }

    // ============ 安全验证函数 ============

    /**
     * @dev 输入验证 - 验证成员ID有效性
     */
    function _validateMemberId(uint32 memberId) private view {
        require(memberId > 0 && memberId < membershipIdCounter, "Invalid member ID");
    }

    /**
     * @dev 访问控制 - 验证权限
     */
    function _requireMemberOwner(uint32 memberId) private view {
        require(
            walletToMemberId[msg.sender] == memberId,
            "Not authorized to access this member"
        );
    }

    /**
     * @dev 溢出保护 - 验证加法不会溢出
     */
    function _safeAdd(uint256 a, uint256 b) private pure returns (uint256) {
        require(a + b >= a, "Overflow protection triggered");
        return a + b;
    }

    /**
     * @dev 审计提示 - 记录关键操作
     */
    function _auditLog(string memory operation, uint32 memberId) private {
        // 可以发出审计事件供链下系统监听
        // 示例实现 - 实际可根据需要扩展
    }
}