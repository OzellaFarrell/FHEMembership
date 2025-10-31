import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("========================================");
  console.log("Contract Verification on Etherscan");
  console.log("========================================\n");

  const network = hre.network.name;

  // Load deployment info
  const deploymentFile = path.join(process.cwd(), "deployments", `${network}-deployment.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.error("Please deploy the contract first using: npm run deploy\n");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("Verification Details:");
  console.log("--------------------");
  console.log(`Network: ${network}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Etherscan URL: ${deploymentInfo.etherscanUrl}\n`);

  // Check if API key is configured
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ Error: ETHERSCAN_API_KEY not found in environment variables");
    console.error("Please add your Etherscan API key to .env file\n");
    console.error("Get your API key from: https://etherscan.io/myapikey\n");
    process.exit(1);
  }

  console.log("Starting verification process...\n");

  try {
    // Verify the contract
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
      contract: "contracts/AnonymousMembership.sol:AnonymousMembership"
    });

    console.log("\n✅ Contract Verified Successfully!");
    console.log("==================================");
    console.log(`Contract: AnonymousMembership`);
    console.log(`Address: ${contractAddress}`);
    console.log(`Network: ${network}`);
    console.log(`\n🔗 View verified contract:`);
    console.log(deploymentInfo.etherscanUrl);

    // Update deployment info with verification status
    deploymentInfo.verified = true;
    deploymentInfo.verifiedAt = new Date().toISOString();
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n💾 Verification status updated in deployment file");

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified on Etherscan!");
      console.log(`🔗 View contract: ${deploymentInfo.etherscanUrl}`);

      // Update deployment info
      deploymentInfo.verified = true;
      deploymentInfo.verifiedAt = new Date().toISOString();
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    } else {
      console.error("\n❌ Verification Failed!");
      console.error("=====================");
      console.error(error.message);

      console.error("\n🔧 Troubleshooting:");
      console.error("-------------------");
      console.error("1. Ensure ETHERSCAN_API_KEY is correct in .env file");
      console.error("2. Wait a few blocks after deployment before verifying");
      console.error("3. Check if contract source matches deployment");
      console.error("4. Verify network configuration is correct\n");

      process.exit(1);
    }
  }

  console.log("\n📝 Next Steps:");
  console.log("--------------");
  console.log("1. Interact with verified contract:");
  console.log(`   npm run interact`);
  console.log("\n2. Run simulation tests:");
  console.log(`   npm run simulate`);

  console.log("\n========================================");
  console.log("Verification Complete!");
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification Process Failed!");
    console.error("=============================");
    console.error(error);
    process.exit(1);
  });
