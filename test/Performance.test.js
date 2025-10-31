import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Performance Tests", function () {
  async function deployMembershipFixture() {
    const [owner, ...users] = await hre.ethers.getSigners();

    const MembershipContract = await hre.ethers.getContractFactory("AnonymousMembership");
    const membership = await MembershipContract.deploy();
    await membership.waitForDeployment();

    return { membership, owner, users };
  }

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for registration", async function () {
      const { membership, users } = await loadFixture(deployMembershipFixture);

      const tx = await membership.connect(users[0]).registerPublicMember();
      const receipt = await tx.wait();

      console.log(`      📊 Registration Gas Used: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(500000);
    });

    it("Should use reasonable gas for activity recording", async function () {
      const { membership, users } = await loadFixture(deployMembershipFixture);

      await membership.connect(users[0]).registerPublicMember();

      const tx = await membership.connect(users[0]).recordPrivateActivity(100);
      const receipt = await tx.wait();

      console.log(`      📊 Activity Recording Gas: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(300000);
    });

    it("Should use reasonable gas for level updates", async function () {
      const { membership, users } = await loadFixture(deployMembershipFixture);

      await membership.connect(users[0]).registerPublicMember();
      const memberId = await membership.connect(users[0]).getMyMemberId();

      for (let i = 0; i < 12; i++) {
        await membership.connect(users[0]).recordPrivateActivity(50);
      }

      const tx = await membership.updateMemberLevel(memberId);
      const receipt = await tx.wait();

      console.log(`      📊 Level Update Gas: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(200000);
    });
  });

  describe("Batch Operations Performance", function () {
    it("Should handle batch registrations efficiently", async function () {
      const { membership, users } = await loadFixture(deployMembershipFixture);

      const startTime = Date.now();
      const batchSize = 10;

      for (let i = 0; i < batchSize; i++) {
        await membership.connect(users[i]).registerPublicMember();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`      ⏱️  Batch Registration Time: ${duration}ms for ${batchSize} users`);
      console.log(`      📊 Average: ${(duration / batchSize).toFixed(2)}ms per registration`);

      const stats = await membership.getSystemStats();
      expect(stats[0]).to.equal(batchSize);
    });

    it("Should handle batch activities efficiently", async function () {
      const { membership, users } = await loadFixture(deployMembershipFixture);

      await membership.connect(users[0]).registerPublicMember();

      const startTime = Date.now();
      const activityCount = 20;

      for (let i = 0; i < activityCount; i++) {
        await membership.connect(users[0]).recordPrivateActivity(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`      ⏱️  Batch Activity Time: ${duration}ms for ${activityCount} activities`);
      console.log(`      📊 Average: ${(duration / activityCount).toFixed(2)}ms per activity`);

      const memberId = await membership.connect(users[0]).getMyMemberId();
      const info = await membership.getMemberInfo(memberId);
      expect(info[4]).to.equal(activityCount);
    });
  });

  describe("View Function Performance", function () {
    it("Should retrieve member info quickly", async function () {
      const { membership, users } = await loadFixture(deployMembershipFixture);

      await membership.connect(users[0]).registerPublicMember();
      const memberId = await membership.connect(users[0]).getMyMemberId();

      const startTime = Date.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        await membership.getMemberInfo(memberId);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`      ⏱️  View Function Time: ${duration}ms for ${iterations} calls`);
      console.log(`      📊 Average: ${(duration / iterations).toFixed(2)}ms per call`);
    });

    it("Should retrieve system stats quickly", async function () {
      const { membership } = await loadFixture(deployMembershipFixture);

      const startTime = Date.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        await membership.getSystemStats();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`      ⏱️  System Stats Time: ${duration}ms for ${iterations} calls`);
      console.log(`      📊 Average: ${(duration / iterations).toFixed(2)}ms per call`);
    });
  });

  describe("Storage Optimization", function () {
    it("Should efficiently store member data", async function () {
      const { membership, users } = await loadFixture(deployMembershipFixture);

      const membersBefore = [];
      for (let i = 0; i < 5; i++) {
        const tx = await membership.connect(users[i]).registerPublicMember();
        const receipt = await tx.wait();
        membersBefore.push(receipt.gasUsed);
      }

      const avgGas = membersBefore.reduce((a, b) => a + b, BigInt(0)) / BigInt(membersBefore.length);
      console.log(`      📊 Average Registration Gas: ${avgGas.toString()}`);

      // Gas should be relatively consistent
      expect(membersBefore[4]).to.be.closeTo(membersBefore[0], 50000);
    });

    it("Should efficiently store activity data", async function () {
      const { membership, users } = await loadFixture(deployMembershipFixture);

      await membership.connect(users[0]).registerPublicMember();

      const gasUsed = [];
      for (let i = 0; i < 10; i++) {
        const tx = await membership.connect(users[0]).recordPrivateActivity(50);
        const receipt = await tx.wait();
        gasUsed.push(receipt.gasUsed);
      }

      const avgGas = gasUsed.reduce((a, b) => a + b, BigInt(0)) / BigInt(gasUsed.length);
      console.log(`      📊 Average Activity Gas: ${avgGas.toString()}`);

      // Gas should increase slightly with array growth but stay reasonable
      expect(gasUsed[9]).to.be.lt(gasUsed[0] * BigInt(2));
    });
  });

  describe("Scalability Tests", function () {
    it("Should handle growing member base", async function () {
      const { membership, users } = await loadFixture(deployMembershipFixture);

      const milestones = [5, 10, 15];
      const gasData = [];

      for (const milestone of milestones) {
        const currentMembers = Number((await membership.getSystemStats())[0]);
        const toAdd = milestone - currentMembers;

        if (toAdd > 0) {
          const tx = await membership.connect(users[milestone - 1]).registerPublicMember();
          const receipt = await tx.wait();
          gasData.push({ members: milestone, gas: receipt.gasUsed });

          console.log(`      📊 At ${milestone} members: ${receipt.gasUsed.toString()} gas`);
        }
      }

      // Gas should not increase significantly with member count
      if (gasData.length >= 2) {
        const gasIncrease = Number(gasData[gasData.length - 1].gas - gasData[0].gas);
        const percentIncrease = (gasIncrease / Number(gasData[0].gas)) * 100;
        console.log(`      📈 Gas increase: ${percentIncrease.toFixed(2)}%`);
        expect(percentIncrease).to.be.lt(20); // Less than 20% increase
      }
    });

    it("Should handle growing activity history", async function () {
      const { membership, users } = await loadFixture(deployMembershipFixture);

      await membership.connect(users[0]).registerPublicMember();

      const milestones = [10, 20, 30];
      const gasData = [];

      let currentActivities = 0;
      for (const milestone of milestones) {
        const toAdd = milestone - currentActivities;

        for (let i = 0; i < toAdd - 1; i++) {
          await membership.connect(users[0]).recordPrivateActivity(50);
        }

        const tx = await membership.connect(users[0]).recordPrivateActivity(50);
        const receipt = await tx.wait();
        gasData.push({ activities: milestone, gas: receipt.gasUsed });

        console.log(`      📊 At ${milestone} activities: ${receipt.gasUsed.toString()} gas`);
        currentActivities = milestone;
      }

      // Gas should scale reasonably with activity count
      if (gasData.length >= 2) {
        const gasIncrease = Number(gasData[gasData.length - 1].gas - gasData[0].gas);
        const percentIncrease = (gasIncrease / Number(gasData[0].gas)) * 100;
        console.log(`      📈 Gas increase: ${percentIncrease.toFixed(2)}%`);
      }
    });
  });

  describe("Contract Size", function () {
    it("Should have reasonable contract size", async function () {
      const { membership } = await loadFixture(deployMembershipFixture);

      const code = await hre.ethers.provider.getCode(await membership.getAddress());
      const sizeInBytes = (code.length - 2) / 2; // Remove '0x' and divide by 2
      const sizeInKB = sizeInBytes / 1024;

      console.log(`      📦 Contract Size: ${sizeInBytes} bytes (${sizeInKB.toFixed(2)} KB)`);
      console.log(`      📊 Limit: 24,576 bytes (24 KB)`);

      expect(sizeInBytes).to.be.lt(24576); // EIP-170 limit
    });
  });
});
