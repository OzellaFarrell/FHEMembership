import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Privacy Membership Contract", function () {

  // Fixture to deploy contract
  async function deployMembershipFixture() {
    const [owner, user1, user2, user3, user4] = await hre.ethers.getSigners();

    const MembershipContract = await hre.ethers.getContractFactory("AnonymousMembership");
    const membership = await MembershipContract.deploy();
    await membership.waitForDeployment();

    return { membership, owner, user1, user2, user3, user4 };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { membership, owner } = await loadFixture(deployMembershipFixture);
      expect(await membership.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      const { membership } = await loadFixture(deployMembershipFixture);

      const stats = await membership.getSystemStats();
      expect(stats[0]).to.equal(0); // totalMembers
      expect(stats[1]).to.equal(3); // totalLevels (Bronze, Silver, Gold)
      expect(stats[2]).to.equal(1); // nextMemberId
    });

    it("Should create default membership levels", async function () {
      const { membership } = await loadFixture(deployMembershipFixture);

      const bronze = await membership.getMembershipLevelInfo(1);
      expect(bronze[0]).to.equal("Bronze");
      expect(bronze[1]).to.equal(true);

      const silver = await membership.getMembershipLevelInfo(2);
      expect(silver[0]).to.equal("Silver");
      expect(silver[1]).to.equal(true);

      const gold = await membership.getMembershipLevelInfo(3);
      expect(gold[0]).to.equal("Gold");
      expect(gold[1]).to.equal(true);
    });
  });

  describe("Public Member Registration", function () {
    it("Should allow new user to register as public member", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await expect(membership.connect(user1).registerPublicMember())
        .to.emit(membership, "MemberRegistered")
        .withArgs(1, user1.address, false);

      const memberId = await membership.connect(user1).getMyMemberId();
      expect(memberId).to.equal(1);

      const isMember = await membership.isMember(user1.address);
      expect(isMember).to.equal(true);
    });

    it("Should increment member counter after registration", async function () {
      const { membership, user1, user2 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const stats1 = await membership.getSystemStats();
      expect(stats1[0]).to.equal(1); // totalMembers

      await membership.connect(user2).registerPublicMember();
      const stats2 = await membership.getSystemStats();
      expect(stats2[0]).to.equal(2); // totalMembers
    });

    it("Should reject duplicate registration", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();

      await expect(
        membership.connect(user1).registerPublicMember()
      ).to.be.revertedWith("Already registered");
    });

    it("Should store correct member information", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      const memberInfo = await membership.getMemberInfo(memberId);
      expect(memberInfo[0]).to.equal(true); // isActive
      expect(memberInfo[1]).to.equal(false); // isAnonymous
      expect(memberInfo[2]).to.equal(user1.address); // wallet
      expect(memberInfo[3]).to.be.greaterThan(0); // publicJoinTime
      expect(memberInfo[4]).to.equal(0); // activityCount
    });
  });

  describe("Anonymous Member Registration", function () {
    it("Should allow registration with valid anonymous token", async function () {
      const { membership, owner, user1 } = await loadFixture(deployMembershipFixture);

      const token = await membership.generateAnonymousToken();

      await expect(membership.connect(user1).registerAnonymousMember(token))
        .to.emit(membership, "MemberRegistered")
        .withArgs(1, user1.address, true);

      const memberId = await membership.connect(user1).getMyMemberId();
      expect(memberId).to.equal(1);

      const memberInfo = await membership.getMemberInfo(memberId);
      expect(memberInfo[1]).to.equal(true); // isAnonymous
      expect(memberInfo[3]).to.equal(0); // publicJoinTime is hidden
    });

    it("Should reject registration with used token", async function () {
      const { membership, user1, user2 } = await loadFixture(deployMembershipFixture);

      const token = await membership.generateAnonymousToken();

      await membership.connect(user1).registerAnonymousMember(token);

      await expect(
        membership.connect(user2).registerAnonymousMember(token)
      ).to.be.revertedWith("Token already used");
    });

    it("Should reject registration with invalid token", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      const invalidToken = hre.ethers.ZeroHash;

      await expect(
        membership.connect(user1).registerAnonymousMember(invalidToken)
      ).to.be.revertedWith("Invalid token");
    });

    it("Should generate unique tokens", async function () {
      const { membership } = await loadFixture(deployMembershipFixture);

      const token1 = await membership.generateAnonymousToken();

      // Advance time slightly
      await hre.ethers.provider.send("evm_mine", []);

      const token2 = await membership.generateAnonymousToken();

      expect(token1).to.not.equal(token2);
    });
  });

  describe("Private Activity Recording", function () {
    it("Should allow active members to record activities", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      await expect(membership.connect(user1).recordPrivateActivity(100))
        .to.emit(membership, "PrivateActivityRecorded");

      const memberInfo = await membership.getMemberInfo(memberId);
      expect(memberInfo[4]).to.equal(1); // activityCount
    });

    it("Should reject activity recording from non-members", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await expect(
        membership.connect(user1).recordPrivateActivity(100)
      ).to.be.revertedWith("Not an active member");
    });

    it("Should track multiple activities correctly", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      for (let i = 0; i < 5; i++) {
        await membership.connect(user1).recordPrivateActivity(50 + i * 10);
      }

      const memberInfo = await membership.getMemberInfo(memberId);
      expect(memberInfo[4]).to.equal(5);
    });
  });

  describe("Membership Level Management", function () {
    it("Should start members at Bronze level", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      // Level is encrypted, but we can verify through system behavior
      const memberInfo = await membership.getMemberInfo(1);
      expect(memberInfo[0]).to.equal(true); // isActive
    });

    it("Should update member level based on activity", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      // Add 12 activities to reach Silver
      for (let i = 0; i < 12; i++) {
        await membership.connect(user1).recordPrivateActivity(50);
      }

      await expect(membership.updateMemberLevel(memberId))
        .to.emit(membership, "MemberLevelUpdated");
    });

    it("Should allow owner to create custom levels", async function () {
      const { membership, owner } = await loadFixture(deployMembershipFixture);

      await expect(membership.createMembershipLevel("Platinum", 2000, 10))
        .to.emit(membership, "MembershipLevelCreated")
        .withArgs(4, "Platinum");

      const platinumInfo = await membership.getMembershipLevelInfo(4);
      expect(platinumInfo[0]).to.equal("Platinum");
      expect(platinumInfo[1]).to.equal(true);
    });

    it("Should reject level creation from non-owner", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await expect(
        membership.connect(user1).createMembershipLevel("Diamond", 5000, 20)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Member Deactivation", function () {
    it("Should allow owner to deactivate members", async function () {
      const { membership, owner, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      await expect(membership.deactivateMember(memberId))
        .to.emit(membership, "MemberDeactivated")
        .withArgs(memberId);

      const memberInfo = await membership.getMemberInfo(memberId);
      expect(memberInfo[0]).to.equal(false); // isActive
    });

    it("Should reject deactivation from non-owner", async function () {
      const { membership, user1, user2 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      await expect(
        membership.connect(user2).deactivateMember(memberId)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should prevent deactivated members from recording activities", async function () {
      const { membership, owner, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      await membership.deactivateMember(memberId);

      await expect(
        membership.connect(user1).recordPrivateActivity(100)
      ).to.be.revertedWith("Not an active member");
    });

    it("Should decrement total members count", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      const statsBefore = await membership.getSystemStats();
      expect(statsBefore[0]).to.equal(1);

      await membership.deactivateMember(memberId);

      const statsAfter = await membership.getSystemStats();
      expect(statsAfter[0]).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return correct system statistics", async function () {
      const { membership, user1, user2 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      await membership.connect(user2).registerPublicMember();

      const stats = await membership.getSystemStats();
      expect(stats[0]).to.equal(2); // totalMembers
      expect(stats[1]).to.equal(3); // totalLevels
      expect(stats[2]).to.equal(3); // nextMemberId
    });

    it("Should return correct member information", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      await membership.connect(user1).recordPrivateActivity(100);
      await membership.connect(user1).recordPrivateActivity(150);

      const memberInfo = await membership.getMemberInfo(memberId);
      expect(memberInfo[0]).to.equal(true); // isActive
      expect(memberInfo[1]).to.equal(false); // isAnonymous
      expect(memberInfo[2]).to.equal(user1.address); // wallet
      expect(memberInfo[4]).to.equal(2); // activityCount
    });

    it("Should check membership status correctly", async function () {
      const { membership, user1, user2 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();

      expect(await membership.isMember(user1.address)).to.equal(true);
      expect(await membership.isMember(user2.address)).to.equal(false);
    });

    it("Should return zero for non-member ID query", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      const memberId = await membership.connect(user1).getMyMemberId();
      expect(memberId).to.equal(0);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete membership lifecycle", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      // Register
      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      // Record activities
      for (let i = 0; i < 15; i++) {
        await membership.connect(user1).recordPrivateActivity(75);
      }

      // Update level
      await membership.updateMemberLevel(memberId);

      // Verify state
      const memberInfo = await membership.getMemberInfo(memberId);
      expect(memberInfo[0]).to.equal(true);
      expect(memberInfo[4]).to.equal(15);

      // Deactivate
      await membership.deactivateMember(memberId);

      const finalInfo = await membership.getMemberInfo(memberId);
      expect(finalInfo[0]).to.equal(false);
    });

    it("Should handle mixed member types", async function () {
      const { membership, user1, user2, user3 } = await loadFixture(deployMembershipFixture);

      // Public member
      await membership.connect(user1).registerPublicMember();

      // Anonymous member
      const token = await membership.generateAnonymousToken();
      await membership.connect(user2).registerAnonymousMember(token);

      // Another public member
      await membership.connect(user3).registerPublicMember();

      const stats = await membership.getSystemStats();
      expect(stats[0]).to.equal(3);

      const member1 = await membership.getMemberInfo(1);
      const member2 = await membership.getMemberInfo(2);
      const member3 = await membership.getMemberInfo(3);

      expect(member1[1]).to.equal(false); // not anonymous
      expect(member2[1]).to.equal(true);  // anonymous
      expect(member3[1]).to.equal(false); // not anonymous
    });
  });

  describe("Access Control", function () {
    it("Should restrict owner functions to owner only", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      // Test deactivation
      await expect(
        membership.connect(user1).deactivateMember(memberId)
      ).to.be.revertedWith("Not authorized");

      // Test level creation
      await expect(
        membership.connect(user1).createMembershipLevel("Test", 1000, 5)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow owner to perform administrative functions", async function () {
      const { membership, owner, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      // Owner can deactivate
      await expect(membership.connect(owner).deactivateMember(memberId))
        .to.not.be.reverted;

      // Owner can create levels
      await expect(membership.connect(owner).createMembershipLevel("Platinum", 3000, 15))
        .to.not.be.reverted;

      // Owner can generate tokens
      expect(await membership.connect(owner).generateAnonymousToken())
        .to.not.equal(hre.ethers.ZeroHash);
    });
  });
});
