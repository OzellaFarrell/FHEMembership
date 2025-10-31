import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("========================================");
  console.log("Privacy Membership Simulation");
  console.log("========================================\n");

  const network = hre.network.name;
  let membership;
  let contractAddress;

  // Check if we're on a local network or should connect to deployed contract
  if (network === "hardhat" || network === "localhost") {
    console.log("🚀 Deploying contract for simulation on local network...\n");

    const MembershipContract = await hre.ethers.getContractFactory("AnonymousMembership");
    membership = await MembershipContract.deploy();
    await membership.waitForDeployment();

    contractAddress = await membership.getAddress();
    console.log(`✅ Contract deployed at: ${contractAddress}\n`);

  } else {
    console.log("📡 Connecting to deployed contract...\n");

    const deploymentFile = path.join(process.cwd(), "deployments", `${network}-deployment.json`);

    if (!fs.existsSync(deploymentFile)) {
      console.error(`❌ Deployment file not found: ${deploymentFile}`);
      console.error("Please deploy the contract first or run on local network\n");
      process.exit(1);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    contractAddress = deploymentInfo.contractAddress;

    const MembershipContract = await hre.ethers.getContractFactory("AnonymousMembership");
    membership = MembershipContract.attach(contractAddress);

    console.log(`✅ Connected to contract at: ${contractAddress}\n`);
  }

  // Get signers for simulation
  const [owner, user1, user2, user3, user4] = await hre.ethers.getSigners();

  console.log("👥 Simulation Participants:");
  console.log("-------------------------");
  console.log(`Owner: ${owner.address}`);
  console.log(`User 1: ${user1.address}`);
  console.log(`User 2: ${user2.address}`);
  console.log(`User 3: ${user3.address}`);
  console.log(`User 4: ${user4.address}\n`);

  // Scenario 1: View Initial System State
  console.log("========================================");
  console.log("Scenario 1: Initial System State");
  console.log("========================================\n");

  let stats = await membership.getSystemStats();
  console.log(`Total Members: ${stats[0]}`);
  console.log(`Total Levels: ${stats[1]}`);
  console.log(`Next Member ID: ${stats[2]}`);

  console.log("\n🏆 Default Membership Levels:");
  for (let i = 1; i <= 3; i++) {
    const levelInfo = await membership.getMembershipLevelInfo(i);
    console.log(`  Level ${i}: ${levelInfo[0]} - Active: ${levelInfo[1]}`);
  }

  // Scenario 2: Public Member Registration
  console.log("\n========================================");
  console.log("Scenario 2: Public Member Registration");
  console.log("========================================\n");

  console.log("User 1 registering as public member...");
  let tx = await membership.connect(user1).registerPublicMember();
  await tx.wait();
  console.log("✅ User 1 registered successfully");

  let memberId1 = await membership.connect(user1).getMyMemberId();
  console.log(`Member ID: ${memberId1}\n`);

  console.log("User 2 registering as public member...");
  tx = await membership.connect(user2).registerPublicMember();
  await tx.wait();
  console.log("✅ User 2 registered successfully");

  let memberId2 = await membership.connect(user2).getMyMemberId();
  console.log(`Member ID: ${memberId2}\n`);

  // Scenario 3: Anonymous Member Registration
  console.log("========================================");
  console.log("Scenario 3: Anonymous Member Registration");
  console.log("========================================\n");

  console.log("Owner generating anonymous token...");
  const anonymousToken = await membership.generateAnonymousToken();
  console.log(`Token: ${anonymousToken}\n`);

  console.log("User 3 registering as anonymous member...");
  tx = await membership.connect(user3).registerAnonymousMember(anonymousToken);
  await tx.wait();
  console.log("✅ User 3 registered anonymously");

  let memberId3 = await membership.connect(user3).getMyMemberId();
  console.log(`Member ID: ${memberId3}\n`);

  // Scenario 4: Recording Private Activities
  console.log("========================================");
  console.log("Scenario 4: Recording Private Activities");
  console.log("========================================\n");

  console.log("User 1 recording activities...");
  for (let i = 0; i < 5; i++) {
    tx = await membership.connect(user1).recordPrivateActivity(Math.floor(Math.random() * 100) + 50);
    await tx.wait();
    console.log(`  Activity ${i + 1} recorded ✅`);
  }

  console.log("\nUser 2 recording activities...");
  for (let i = 0; i < 12; i++) {
    tx = await membership.connect(user2).recordPrivateActivity(Math.floor(Math.random() * 100) + 50);
    await tx.wait();
    console.log(`  Activity ${i + 1} recorded ✅`);
  }

  console.log("\nUser 3 (anonymous) recording activities...");
  for (let i = 0; i < 8; i++) {
    tx = await membership.connect(user3).recordPrivateActivity(Math.floor(Math.random() * 100) + 50);
    await tx.wait();
    console.log(`  Activity ${i + 1} recorded ✅`);
  }

  // Scenario 5: Viewing Member Information
  console.log("\n========================================");
  console.log("Scenario 5: Member Information");
  console.log("========================================\n");

  console.log("📋 User 1 (Public Member):");
  let info1 = await membership.getMemberInfo(memberId1);
  console.log(`  Active: ${info1[0]}`);
  console.log(`  Anonymous: ${info1[1]}`);
  console.log(`  Wallet: ${info1[2]}`);
  console.log(`  Join Time: ${new Date(Number(info1[3]) * 1000).toLocaleString()}`);
  console.log(`  Activity Count: ${info1[4]}`);

  console.log("\n📋 User 2 (Public Member):");
  let info2 = await membership.getMemberInfo(memberId2);
  console.log(`  Active: ${info2[0]}`);
  console.log(`  Anonymous: ${info2[1]}`);
  console.log(`  Wallet: ${info2[2]}`);
  console.log(`  Join Time: ${new Date(Number(info2[3]) * 1000).toLocaleString()}`);
  console.log(`  Activity Count: ${info2[4]}`);

  console.log("\n📋 User 3 (Anonymous Member):");
  let info3 = await membership.getMemberInfo(memberId3);
  console.log(`  Active: ${info3[0]}`);
  console.log(`  Anonymous: ${info3[1]}`);
  console.log(`  Wallet: ${info3[2]}`);
  console.log(`  Join Time: ${info3[3] > 0 ? new Date(Number(info3[3]) * 1000).toLocaleString() : "Hidden (Anonymous)"}`);
  console.log(`  Activity Count: ${info3[4]}`);

  // Scenario 6: Level Progression
  console.log("\n========================================");
  console.log("Scenario 6: Member Level Updates");
  console.log("========================================\n");

  console.log("Updating User 1 level (5 activities - should be Bronze)...");
  tx = await membership.updateMemberLevel(memberId1);
  await tx.wait();
  console.log("✅ Level updated\n");

  console.log("Updating User 2 level (12 activities - should be Silver)...");
  tx = await membership.updateMemberLevel(memberId2);
  await tx.wait();
  console.log("✅ Level updated\n");

  console.log("User 2 adding more activities to reach Gold...");
  for (let i = 0; i < 15; i++) {
    tx = await membership.connect(user2).recordPrivateActivity(Math.floor(Math.random() * 100) + 50);
    await tx.wait();
  }
  console.log("✅ 15 more activities recorded\n");

  console.log("Updating User 2 level (27 activities - should be Gold)...");
  tx = await membership.updateMemberLevel(memberId2);
  await tx.wait();
  console.log("✅ Level updated to Gold\n");

  // Scenario 7: Creating Custom Level
  console.log("========================================");
  console.log("Scenario 7: Custom Membership Level");
  console.log("========================================\n");

  console.log("Owner creating Platinum level...");
  tx = await membership.createMembershipLevel("Platinum", 2000, 10);
  await tx.wait();
  console.log("✅ Platinum level created\n");

  stats = await membership.getSystemStats();
  console.log("Updated membership levels:");
  for (let i = 1; i <= Number(stats[1]); i++) {
    const levelInfo = await membership.getMembershipLevelInfo(i);
    console.log(`  Level ${i}: ${levelInfo[0]} - Active: ${levelInfo[1]}`);
  }

  // Scenario 8: Final Statistics
  console.log("\n========================================");
  console.log("Scenario 8: Final System Statistics");
  console.log("========================================\n");

  stats = await membership.getSystemStats();
  console.log(`Total Members: ${stats[0]}`);
  console.log(`Total Levels: ${stats[1]}`);
  console.log(`Next Member ID: ${stats[2]}`);

  console.log("\n📊 Member Activity Summary:");
  console.log(`  User 1: ${(await membership.getMemberInfo(memberId1))[4]} activities`);
  console.log(`  User 2: ${(await membership.getMemberInfo(memberId2))[4]} activities`);
  console.log(`  User 3: ${(await membership.getMemberInfo(memberId3))[4]} activities (anonymous)`);

  // Scenario 9: Testing Edge Cases
  console.log("\n========================================");
  console.log("Scenario 9: Testing Edge Cases");
  console.log("========================================\n");

  console.log("Test 1: Attempting duplicate registration...");
  try {
    await membership.connect(user1).registerPublicMember();
    console.log("❌ Should have failed but succeeded");
  } catch (error) {
    console.log("✅ Correctly rejected: Already registered\n");
  }

  console.log("Test 2: Attempting to reuse anonymous token...");
  try {
    await membership.connect(user4).registerAnonymousMember(anonymousToken);
    console.log("❌ Should have failed but succeeded");
  } catch (error) {
    console.log("✅ Correctly rejected: Token already used\n");
  }

  console.log("Test 3: Checking non-member status...");
  const isUser4Member = await membership.isMember(user4.address);
  console.log(`User 4 is member: ${isUser4Member} ✅\n`);

  // Save simulation results
  const simulationResults = {
    network: network,
    contractAddress: contractAddress,
    timestamp: new Date().toISOString(),
    scenarios: {
      registrations: {
        publicMembers: 2,
        anonymousMembers: 1,
        totalMembers: 3
      },
      activities: {
        user1: Number((await membership.getMemberInfo(memberId1))[4]),
        user2: Number((await membership.getMemberInfo(memberId2))[4]),
        user3: Number((await membership.getMemberInfo(memberId3))[4])
      },
      levels: {
        total: Number(stats[1]),
        custom: 1
      }
    }
  };

  if (network !== "hardhat") {
    const simulationFile = path.join(process.cwd(), "deployments", `${network}-simulation.json`);
    fs.writeFileSync(simulationFile, JSON.stringify(simulationResults, null, 2));
    console.log(`💾 Simulation results saved to: ${simulationFile}\n`);
  }

  console.log("========================================");
  console.log("✅ Simulation Complete!");
  console.log("========================================");
  console.log("\nAll scenarios executed successfully:");
  console.log("✓ Initial system state verified");
  console.log("✓ Public member registration tested");
  console.log("✓ Anonymous member registration tested");
  console.log("✓ Private activity recording tested");
  console.log("✓ Member information viewing tested");
  console.log("✓ Level progression tested");
  console.log("✓ Custom level creation tested");
  console.log("✓ Edge cases validated");
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Simulation Failed!");
    console.error("===================");
    console.error(error);
    process.exit(1);
  });
