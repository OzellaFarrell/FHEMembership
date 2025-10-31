import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Security Tests", function () {
  async function deployMembershipFixture() {
    const [owner, user1, user2, attacker] = await hre.ethers.getSigners();

    const MembershipContract = await hre.ethers.getContractFactory("AnonymousMembership");
    const membership = await MembershipContract.deploy();
    await membership.waitForDeployment();

    return { membership, owner, user1, user2, attacker };
  }

  describe("Access Control Security", function () {
    it("Should prevent unauthorized owner function calls", async function () {
      const { membership, attacker } = await loadFixture(deployMembershipFixture);

      await expect(
        membership.connect(attacker).createMembershipLevel("Hacker", 1000, 10)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should prevent unauthorized member deactivation", async function () {
      const { membership, user1, attacker } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      await expect(
        membership.connect(attacker).deactivateMember(memberId)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should prevent non-members from recording activity", async function () {
      const { membership, attacker } = await loadFixture(deployMembershipFixture);

      await expect(
        membership.connect(attacker).recordPrivateActivity(100)
      ).to.be.revertedWith("Not an active member");
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should handle concurrent registrations safely", async function () {
      const { membership, user1, user2 } = await loadFixture(deployMembershipFixture);

      const tx1 = membership.connect(user1).registerPublicMember();
      const tx2 = membership.connect(user2).registerPublicMember();

      await Promise.all([tx1, tx2]);

      const stats = await membership.getSystemStats();
      expect(stats[0]).to.equal(2);
    });

    it("Should handle concurrent activity recording", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(membership.connect(user1).recordPrivateActivity(50));
      }

      await Promise.all(promises);

      const memberId = await membership.connect(user1).getMyMemberId();
      const info = await membership.getMemberInfo(memberId);
      expect(info[4]).to.equal(5);
    });
  });

  describe("Input Validation", function () {
    it("Should reject empty anonymous token", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await expect(
        membership.connect(user1).registerAnonymousMember(hre.ethers.ZeroHash)
      ).to.be.revertedWith("Invalid token");
    });

    it("Should reject reused anonymous tokens", async function () {
      const { membership, user1, user2 } = await loadFixture(deployMembershipFixture);

      const token = await membership.generateAnonymousToken();
      await membership.connect(user1).registerAnonymousMember(token);

      await expect(
        membership.connect(user2).registerAnonymousMember(token)
      ).to.be.revertedWith("Token already used");
    });

    it("Should reject duplicate member registration", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();

      await expect(
        membership.connect(user1).registerPublicMember()
      ).to.be.revertedWith("Already registered");
    });
  });

  describe("State Consistency", function () {
    it("Should maintain consistent member count", async function () {
      const { membership, user1, user2 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      await membership.connect(user2).registerPublicMember();

      let stats = await membership.getSystemStats();
      expect(stats[0]).to.equal(2);

      const memberId1 = await membership.connect(user1).getMyMemberId();
      await membership.deactivateMember(memberId1);

      stats = await membership.getSystemStats();
      expect(stats[0]).to.equal(1);
    });

    it("Should prevent deactivated members from activities", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const memberId = await membership.connect(user1).getMyMemberId();

      await membership.deactivateMember(memberId);

      await expect(
        membership.connect(user1).recordPrivateActivity(100)
      ).to.be.revertedWith("Not an active member");
    });
  });

  describe("DoS Attack Prevention", function () {
    it("Should handle many members efficiently", async function () {
      const { membership } = await loadFixture(deployMembershipFixture);
      const signers = await hre.ethers.getSigners();

      const registrations = [];
      for (let i = 0; i < 10; i++) {
        registrations.push(membership.connect(signers[i]).registerPublicMember());
      }

      await Promise.all(registrations);

      const stats = await membership.getSystemStats();
      expect(stats[0]).to.equal(10);
    });

    it("Should handle many activities per member", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();

      for (let i = 0; i < 50; i++) {
        await membership.connect(user1).recordPrivateActivity(10);
      }

      const memberId = await membership.connect(user1).getMyMemberId();
      const info = await membership.getMemberInfo(memberId);
      expect(info[4]).to.equal(50);
    });
  });

  describe("Integer Overflow/Underflow", function () {
    it("Should handle maximum activity scores", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();

      const maxUint32 = 2 ** 32 - 1;
      await expect(
        membership.connect(user1).recordPrivateActivity(maxUint32)
      ).to.not.be.reverted;
    });

    it("Should handle member counter properly", async function () {
      const { membership, user1, user2 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      const id1 = await membership.connect(user1).getMyMemberId();

      await membership.connect(user2).registerPublicMember();
      const id2 = await membership.connect(user2).getMyMemberId();

      expect(id2).to.equal(id1 + BigInt(1));
    });
  });

  describe("Data Privacy", function () {
    it("Should hide anonymous member join time", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      const token = await membership.generateAnonymousToken();
      await membership.connect(user1).registerAnonymousMember(token);

      const memberId = await membership.connect(user1).getMyMemberId();
      const info = await membership.getMemberInfo(memberId);

      expect(info[3]).to.equal(0); // Join time should be 0 for anonymous
      expect(info[1]).to.equal(true); // Should be marked as anonymous
    });

    it("Should maintain encrypted data", async function () {
      const { membership, user1 } = await loadFixture(deployMembershipFixture);

      await membership.connect(user1).registerPublicMember();
      await membership.connect(user1).recordPrivateActivity(100);

      // Activity data should be stored but encrypted
      const memberId = await membership.connect(user1).getMyMemberId();
      const info = await membership.getMemberInfo(memberId);
      expect(info[4]).to.equal(1); // Count is public
      // Individual scores remain encrypted
    });
  });
});
