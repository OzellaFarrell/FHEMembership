// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract AnonymousMembership is SepoliaConfig {

    address public owner;
    uint32 public totalMembers;
    uint32 public membershipIdCounter;

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

    mapping(uint32 => Member) public members;
    mapping(address => uint32) public walletToMemberId;
    mapping(uint32 => MembershipLevel) public membershipLevels;
    mapping(uint32 => PrivateActivity[]) public memberActivities;
    mapping(bytes32 => bool) public usedAnonymousTokens;

    uint32 public levelCounter;

    event MemberRegistered(uint32 indexed memberId, address indexed wallet, bool isAnonymous);
    event MembershipLevelCreated(uint32 indexed levelId, string name);
    event MemberLevelUpdated(uint32 indexed memberId, uint32 newLevel);
    event PrivateActivityRecorded(uint32 indexed memberId, uint256 timestamp);
    event MemberDeactivated(uint32 indexed memberId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyActiveMember() {
        uint32 memberId = walletToMemberId[msg.sender];
        require(memberId > 0 && members[memberId].isActive, "Not an active member");
        _;
    }

    constructor() {
        owner = msg.sender;
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
    function registerPublicMember() external {
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
    function registerAnonymousMember(bytes32 anonymousToken) external {
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
    function recordPrivateActivity(uint32 activityScore) external onlyActiveMember {
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

    // Emergency functions
    function pauseSystem() external onlyOwner {
        // Implementation for pausing the system
    }

    function unpauseSystem() external onlyOwner {
        // Implementation for unpausing the system
    }

    // Generate anonymous registration token (owner only)
    function generateAnonymousToken() external onlyOwner view returns (bytes32) {
        return keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender));
    }
}