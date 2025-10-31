import hre from "hardhat";
import fs from "fs";
import path from "path";
import readline from "readline";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log("========================================");
  console.log("Privacy Membership Contract Interaction");
  console.log("========================================\n");

  const network = hre.network.name;
  const [signer] = await hre.ethers.getSigners();

  console.log(`Network: ${network}`);
  console.log(`Signer Address: ${signer.address}`);

  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Load deployment info
  const deploymentFile = path.join(process.cwd(), "deployments", `${network}-deployment.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.error("Please deploy the contract first using: npm run deploy\n");
    rl.close();
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;

  console.log(`Contract Address: ${contractAddress}\n`);

  // Connect to deployed contract
  const Membership = await hre.ethers.getContractFactory("AnonymousMembership");
  const membership = Membership.attach(contractAddress);

  // Display menu
  while (true) {
    console.log("\n========================================");
    console.log("Available Actions:");
    console.log("========================================");
    console.log("1. View System Statistics");
    console.log("2. View Membership Levels");
    console.log("3. Check My Membership Status");
    console.log("4. Register as Public Member");
    console.log("5. Register as Anonymous Member");
    console.log("6. Record Private Activity");
    console.log("7. Update Member Level");
    console.log("8. View Member Information");
    console.log("9. Generate Anonymous Token (Owner Only)");
    console.log("10. Create Custom Membership Level (Owner Only)");
    console.log("11. Deactivate Member (Owner Only)");
    console.log("0. Exit");
    console.log("========================================\n");

    const choice = await question("Select an action (0-11): ");

    try {
      switch (choice) {
        case "1":
          await viewSystemStats(membership);
          break;

        case "2":
          await viewMembershipLevels(membership);
          break;

        case "3":
          await checkMyMembership(membership, signer.address);
          break;

        case "4":
          await registerPublicMember(membership);
          break;

        case "5":
          await registerAnonymousMember(membership);
          break;

        case "6":
          await recordActivity(membership);
          break;

        case "7":
          await updateMemberLevel(membership);
          break;

        case "8":
          await viewMemberInfo(membership);
          break;

        case "9":
          await generateToken(membership);
          break;

        case "10":
          await createLevel(membership);
          break;

        case "11":
          await deactivateMember(membership);
          break;

        case "0":
          console.log("\n👋 Goodbye!\n");
          rl.close();
          process.exit(0);

        default:
          console.log("❌ Invalid choice. Please try again.");
      }
    } catch (error) {
      console.error("\n❌ Error:", error.message);
    }

    await question("\nPress Enter to continue...");
  }
}

async function viewSystemStats(membership) {
  console.log("\n📊 System Statistics:");
  console.log("-------------------");

  const stats = await membership.getSystemStats();
  console.log(`Total Members: ${stats[0]}`);
  console.log(`Total Levels: ${stats[1]}`);
  console.log(`Next Member ID: ${stats[2]}`);

  const owner = await membership.owner();
  console.log(`Contract Owner: ${owner}`);
}

async function viewMembershipLevels(membership) {
  console.log("\n🏆 Membership Levels:");
  console.log("-------------------");

  const stats = await membership.getSystemStats();
  const totalLevels = Number(stats[1]);

  for (let i = 1; i <= totalLevels; i++) {
    const levelInfo = await membership.getMembershipLevelInfo(i);
    console.log(`Level ${i}: ${levelInfo[0]} - Active: ${levelInfo[1]}`);
  }
}

async function checkMyMembership(membership, address) {
  console.log("\n👤 My Membership Status:");
  console.log("----------------------");

  const isMember = await membership.isMember(address);
  console.log(`Is Member: ${isMember}`);

  if (isMember) {
    const memberId = await membership.getMyMemberId();
    console.log(`Member ID: ${memberId}`);

    const memberInfo = await membership.getMemberInfo(memberId);
    console.log(`Active: ${memberInfo[0]}`);
    console.log(`Anonymous: ${memberInfo[1]}`);
    console.log(`Wallet: ${memberInfo[2]}`);
    console.log(`Join Time: ${memberInfo[3] > 0 ? new Date(Number(memberInfo[3]) * 1000).toLocaleString() : "Hidden"}`);
    console.log(`Activity Count: ${memberInfo[4]}`);
  }
}

async function registerPublicMember(membership) {
  console.log("\n📝 Registering as Public Member...");

  const tx = await membership.registerPublicMember();
  console.log(`Transaction sent: ${tx.hash}`);

  await tx.wait();
  console.log("✅ Registration successful!");

  const memberId = await membership.getMyMemberId();
  console.log(`Your Member ID: ${memberId}`);
}

async function registerAnonymousMember(membership) {
  const token = await question("\n🔐 Enter anonymous token: ");

  console.log("\n📝 Registering as Anonymous Member...");

  const tx = await membership.registerAnonymousMember(token);
  console.log(`Transaction sent: ${tx.hash}`);

  await tx.wait();
  console.log("✅ Anonymous registration successful!");

  const memberId = await membership.getMyMemberId();
  console.log(`Your Member ID: ${memberId}`);
}

async function recordActivity(membership) {
  const score = await question("\n📈 Enter activity score: ");

  console.log("\n📝 Recording activity...");

  const tx = await membership.recordPrivateActivity(Number(score));
  console.log(`Transaction sent: ${tx.hash}`);

  await tx.wait();
  console.log("✅ Activity recorded successfully!");
}

async function updateMemberLevel(membership) {
  const memberId = await question("\n🔄 Enter member ID to update: ");

  console.log("\n📝 Updating member level...");

  const tx = await membership.updateMemberLevel(Number(memberId));
  console.log(`Transaction sent: ${tx.hash}`);

  await tx.wait();
  console.log("✅ Member level updated successfully!");
}

async function viewMemberInfo(membership) {
  const memberId = await question("\n🔍 Enter member ID: ");

  console.log("\n👤 Member Information:");
  console.log("--------------------");

  const info = await membership.getMemberInfo(Number(memberId));
  console.log(`Active: ${info[0]}`);
  console.log(`Anonymous: ${info[1]}`);
  console.log(`Wallet: ${info[2]}`);
  console.log(`Join Time: ${info[3] > 0 ? new Date(Number(info[3]) * 1000).toLocaleString() : "Hidden"}`);
  console.log(`Activity Count: ${info[4]}`);
}

async function generateToken(membership) {
  console.log("\n🔑 Generating anonymous token...");

  const token = await membership.generateAnonymousToken();
  console.log(`\n✅ Anonymous Token Generated:`);
  console.log(token);
  console.log("\n⚠️  Save this token securely - it can be used once for anonymous registration");
}

async function createLevel(membership) {
  const name = await question("\n🏆 Enter level name: ");
  const score = await question("Enter required score: ");
  const benefits = await question("Enter benefits value: ");

  console.log("\n📝 Creating membership level...");

  const tx = await membership.createMembershipLevel(name, Number(score), Number(benefits));
  console.log(`Transaction sent: ${tx.hash}`);

  await tx.wait();
  console.log("✅ Membership level created successfully!");
}

async function deactivateMember(membership) {
  const memberId = await question("\n⚠️  Enter member ID to deactivate: ");

  console.log("\n📝 Deactivating member...");

  const tx = await membership.deactivateMember(Number(memberId));
  console.log(`Transaction sent: ${tx.hash}`);

  await tx.wait();
  console.log("✅ Member deactivated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Interaction Failed!");
    console.error(error);
    rl.close();
    process.exit(1);
  });
