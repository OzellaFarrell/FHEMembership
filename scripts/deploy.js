import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("========================================");
  console.log("Starting Privacy Membership Deployment");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  console.log("Deployment Configuration:");
  console.log("------------------------");
  console.log(`Network: ${network}`);
  console.log(`Deployer Address: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Verify sufficient balance
  if (balance < hre.ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Deployer balance is low. Deployment may fail.");
  }

  console.log("Deploying Privacy Membership Contract...");
  console.log("---------------------------------------");

  const MembershipContract = await hre.ethers.getContractFactory("AnonymousMembership");

  console.log("Sending deployment transaction...");
  const startTime = Date.now();

  const membership = await MembershipContract.deploy();
  await membership.waitForDeployment();

  const deploymentTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const contractAddress = await membership.getAddress();

  console.log("\n✅ Deployment Successful!");
  console.log("========================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployment Time: ${deploymentTime}s`);
  console.log(`Transaction Hash: ${membership.deploymentTransaction().hash}`);
  console.log(`Block Number: ${membership.deploymentTransaction().blockNumber || "pending"}`);

  // Get initial contract state
  console.log("\nInitial Contract State:");
  console.log("----------------------");

  const owner = await membership.owner();
  const stats = await membership.getSystemStats();

  console.log(`Owner: ${owner}`);
  console.log(`Total Members: ${stats[0]}`);
  console.log(`Total Levels: ${stats[1]}`);
  console.log(`Next Member ID: ${stats[2]}`);

  // Check default membership levels
  console.log("\nDefault Membership Levels:");
  console.log("-------------------------");

  for (let i = 1; i <= 3; i++) {
    const levelInfo = await membership.getMembershipLevelInfo(i);
    console.log(`Level ${i}: ${levelInfo[0]} - Active: ${levelInfo[1]}`);
  }

  // Save deployment information
  const deploymentInfo = {
    network: network,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    transactionHash: membership.deploymentTransaction().hash,
    blockNumber: membership.deploymentTransaction().blockNumber,
    timestamp: new Date().toISOString(),
    deploymentTime: deploymentTime,
    owner: owner,
    etherscanUrl: network === "sepolia"
      ? `https://sepolia.etherscan.io/address/${contractAddress}`
      : `https://etherscan.io/address/${contractAddress}`,
    contractABI: "artifacts/contracts/AnonymousMembership.sol/AnonymousMembership.json"
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Display verification instructions
  console.log("\n📝 Next Steps:");
  console.log("--------------");
  console.log("1. Verify contract on Etherscan:");
  console.log(`   npm run verify`);
  console.log("\n2. Interact with contract:");
  console.log(`   npm run interact`);
  console.log("\n3. Run simulation:");
  console.log(`   npm run simulate`);

  console.log(`\n🔗 View on Etherscan:`);
  console.log(deploymentInfo.etherscanUrl);

  console.log("\n========================================");
  console.log("Deployment Complete!");
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed!");
    console.error("===================");
    console.error(error);
    process.exit(1);
  });
