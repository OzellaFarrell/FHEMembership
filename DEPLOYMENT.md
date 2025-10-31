# Deployment Guide

This guide provides comprehensive instructions for deploying the Privacy Membership Platform smart contracts to the Ethereum Sepolia testnet.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Process](#deployment-process)
- [Post-Deployment](#post-deployment)
- [Contract Verification](#contract-verification)
- [Contract Interaction](#contract-interaction)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

1. **Node.js and npm**
   - Node.js v18 or higher
   - npm v9 or higher
   - Check versions: `node --version && npm --version`

2. **Wallet Setup**
   - MetaMask or similar Web3 wallet
   - Export private key from MetaMask (Settings > Security & Privacy > Show Private Key)
   - **⚠️ Never share or commit your private key**

3. **Sepolia ETH**
   - Minimum recommended: 0.1 ETH
   - Get testnet ETH from faucets:
     - [Sepolia Faucet](https://sepoliafaucet.com/)
     - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
     - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

4. **Etherscan API Key**
   - Create account at [Etherscan.io](https://etherscan.io/)
   - Navigate to [API Keys](https://etherscan.io/myapikey)
   - Generate new API key

## Environment Setup

### 1. Install Dependencies

```bash
cd privacy-membership-platform
npm install
```

### 2. Configure Environment Variables

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Wallet Configuration
PRIVATE_KEY=your_wallet_private_key_without_0x_prefix

# Network RPC URLs
SEPOLIA_RPC_URL=https://rpc.sepolia.org
# Alternative RPC providers:
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID

# Etherscan Configuration
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Gas Reporter Configuration
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

### 3. Verify Configuration

Test your environment setup:

```bash
# Check wallet balance
npm run node -- --network sepolia

# Compile contracts
npm run compile
```

## Pre-Deployment Checklist

Before deploying, verify:

- [ ] All dependencies installed (`node_modules/` exists)
- [ ] `.env` file configured with valid credentials
- [ ] Private key corresponds to wallet with Sepolia ETH
- [ ] Contract compiles without errors (`npm run compile`)
- [ ] All tests pass (`npm test`)
- [ ] Network connectivity to Sepolia RPC
- [ ] Etherscan API key is valid

### Check Wallet Balance

```bash
# Using Node.js
node -e "console.log(require('ethers').Wallet.fromPrivateKey('0x' + process.env.PRIVATE_KEY).address)"
```

Or check on Sepolia Etherscan: `https://sepolia.etherscan.io/address/YOUR_ADDRESS`

## Deployment Process

### Step 1: Compile Contracts

```bash
npm run compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### Step 2: Run Tests (Optional but Recommended)

```bash
npm test
```

Ensure all tests pass before deploying.

### Step 3: Deploy to Sepolia

```bash
npm run deploy
```

### Deployment Script Output

The deployment script will:

1. **Display Configuration**
   ```
   ========================================
   Starting Privacy Membership Deployment
   ========================================

   Deployment Configuration:
   ------------------------
   Network: sepolia
   Deployer Address: 0x...
   Deployer Balance: 0.5 ETH
   ```

2. **Deploy Contract**
   ```
   Deploying Privacy Membership Contract...
   ---------------------------------------
   Sending deployment transaction...
   ```

3. **Confirm Deployment**
   ```
   ✅ Deployment Successful!
   ========================
   Contract Address: 0xABC123...
   Deployment Time: 45.32s
   Transaction Hash: 0xDEF456...
   Block Number: 4567890
   ```

4. **Display Initial State**
   ```
   Initial Contract State:
   ----------------------
   Owner: 0x...
   Total Members: 0
   Total Levels: 3
   Next Member ID: 1

   Default Membership Levels:
   -------------------------
   Level 1: Bronze - Active: true
   Level 2: Silver - Active: true
   Level 3: Gold - Active: true
   ```

5. **Save Deployment Info**
   ```
   💾 Deployment info saved to: deployments/sepolia-deployment.json
   ```

### Deployment Information File

After deployment, a JSON file is created at `deployments/sepolia-deployment.json`:

```json
{
  "network": "sepolia",
  "contractAddress": "0x...",
  "deployerAddress": "0x...",
  "transactionHash": "0x...",
  "blockNumber": 4567890,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "deploymentTime": "45.32",
  "owner": "0x...",
  "etherscanUrl": "https://sepolia.etherscan.io/address/0x...",
  "contractABI": "artifacts/contracts/AnonymousMembership.sol/AnonymousMembership.json"
}
```

## Post-Deployment

### Verify Deployment

1. **Check Transaction on Etherscan**
   - Navigate to transaction hash on Sepolia Etherscan
   - Verify status is "Success"
   - Check gas used and deployment cost

2. **View Contract on Etherscan**
   - Navigate to contract address
   - Verify contract code is deployed
   - Check contract balance (should be 0)

3. **Test Contract Interaction**
   ```bash
   npm run interact
   ```

   Select option 1 to view system statistics and verify initial state.

## Contract Verification

Verifying your contract on Etherscan allows users to interact with it directly through the Etherscan interface and provides transparency.

### Step 1: Verify Contract

```bash
npm run verify
```

### Verification Process

```
========================================
Contract Verification on Etherscan
========================================

Verification Details:
--------------------
Network: sepolia
Contract Address: 0x...
Etherscan URL: https://sepolia.etherscan.io/address/0x...

Starting verification process...

✅ Contract Verified Successfully!
==================================
Contract: AnonymousMembership
Address: 0x...
Network: sepolia

🔗 View verified contract:
https://sepolia.etherscan.io/address/0x...

💾 Verification status updated in deployment file
```

### After Verification

1. **Visit Etherscan Contract Page**
   - Click "Contract" tab
   - View source code
   - See "✓" verified checkmark

2. **Interact via Etherscan**
   - Use "Read Contract" section for view functions
   - Use "Write Contract" section for state-changing functions
   - Connect MetaMask to execute transactions

## Contract Interaction

### Interactive CLI

Start the interactive interface:

```bash
npm run interact
```

### Available Actions

```
========================================
Available Actions:
========================================
1. View System Statistics
2. View Membership Levels
3. Check My Membership Status
4. Register as Public Member
5. Register as Anonymous Member
6. Record Private Activity
7. Update Member Level
8. View Member Information
9. Generate Anonymous Token (Owner Only)
10. Create Custom Membership Level (Owner Only)
11. Deactivate Member (Owner Only)
0. Exit
========================================
```

### Example Workflow

1. **Register as Public Member**
   ```
   Select action: 4

   📝 Registering as Public Member...
   Transaction sent: 0x...
   ✅ Registration successful!
   Your Member ID: 1
   ```

2. **Record Activities**
   ```
   Select action: 6

   📈 Enter activity score: 75

   📝 Recording activity...
   Transaction sent: 0x...
   ✅ Activity recorded successfully!
   ```

3. **Check Membership Status**
   ```
   Select action: 3

   👤 My Membership Status:
   ----------------------
   Is Member: true
   Member ID: 1
   Active: true
   Anonymous: false
   Wallet: 0x...
   Join Time: 2024-01-01 12:00:00
   Activity Count: 1
   ```

## Simulation Testing

Run comprehensive simulation on deployed contract:

```bash
npm run simulate
```

This executes multiple test scenarios:
- Public and anonymous member registrations
- Activity recording and tracking
- Level progression updates
- Custom level creation
- Edge case validation

### Simulation Output

```
========================================
Privacy Membership Simulation
========================================

✅ Connected to contract at: 0x...

Scenario 1: Initial System State
Scenario 2: Public Member Registration
Scenario 3: Anonymous Member Registration
Scenario 4: Recording Private Activities
Scenario 5: Member Information
Scenario 6: Member Level Updates
Scenario 7: Custom Membership Level
Scenario 8: Final System Statistics
Scenario 9: Testing Edge Cases

========================================
✅ Simulation Complete!
========================================
```

## Deployment to Mainnet

**⚠️ WARNING**: Deploying to mainnet requires real ETH and has financial implications.

### Mainnet Deployment Steps

1. **Update Configuration**

   Add mainnet configuration to `hardhat.config.js`:
   ```javascript
   mainnet: {
     url: process.env.MAINNET_RPC_URL,
     accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
     chainId: 1,
     gasPrice: "auto"
   }
   ```

2. **Add Environment Variables**
   ```env
   MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
   ```

3. **Audit and Security Review**
   - Complete professional security audit
   - Test exhaustively on testnet
   - Review all edge cases
   - Verify gas optimization

4. **Deploy**
   ```bash
   npm run deploy -- --network mainnet
   ```

5. **Verify**
   ```bash
   npm run verify -- --network mainnet
   ```

## Troubleshooting

### Common Issues

#### 1. Insufficient Funds

**Error:**
```
Error: insufficient funds for intrinsic transaction cost
```

**Solution:**
- Check wallet balance on Sepolia Etherscan
- Get more Sepolia ETH from faucets
- Ensure you're using correct wallet address

#### 2. Network Connection Issues

**Error:**
```
Error: could not detect network
```

**Solution:**
- Verify RPC URL in `.env`
- Try alternative RPC providers:
  - Alchemy: `https://eth-sepolia.g.alchemy.com/v2/API-KEY`
  - Infura: `https://sepolia.infura.io/v3/PROJECT-ID`
- Check internet connectivity

#### 3. Private Key Issues

**Error:**
```
Error: invalid private key
```

**Solution:**
- Ensure private key is correct (64 hex characters)
- Remove "0x" prefix from private key in `.env`
- Verify you copied the complete key from MetaMask

#### 4. Compilation Errors

**Error:**
```
Error: Solidity compilation failed
```

**Solution:**
- Run `npm run clean` to clear cache
- Run `npm install` to ensure dependencies are installed
- Check Solidity version compatibility
- Verify contract imports are correct

#### 5. Verification Failures

**Error:**
```
Error: Failed to verify contract
```

**Solution:**
- Wait 1-2 minutes after deployment before verifying
- Ensure Etherscan API key is valid
- Check that constructor arguments match deployment
- Verify network selection is correct

#### 6. Gas Estimation Errors

**Error:**
```
Error: cannot estimate gas
```

**Solution:**
- Check contract logic for reverts
- Ensure wallet has sufficient balance
- Verify contract state allows the operation
- Review function requirements and modifiers

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**
   - Review complete error messages
   - Check transaction hash on Etherscan
   - Examine contract events

2. **Review Documentation**
   - Read [README.md](README.md)
   - Check Hardhat docs: https://hardhat.org/docs
   - Review Ethers.js docs: https://docs.ethers.org

3. **Test Locally**
   ```bash
   # Start local node
   npm run node

   # Deploy locally (in another terminal)
   npm run deploy:local
   ```

4. **Community Support**
   - Open GitHub issue with detailed error information
   - Include deployment logs
   - Provide network and transaction details

## Gas Optimization

### Deployment Costs

Typical deployment costs on Sepolia:
- Contract Deployment: ~0.01-0.05 ETH (testnet)
- Gas Price: Varies by network congestion

### Optimize Gas Usage

1. **Enable Optimizer in hardhat.config.js**
   ```javascript
   optimizer: {
     enabled: true,
     runs: 200  // Increase for frequent calls, decrease for deployment
   }
   ```

2. **Monitor Gas Usage**
   ```bash
   REPORT_GAS=true npm test
   ```

3. **Review Gas Report**
   - Check `gas-report.txt`
   - Identify expensive operations
   - Optimize contract logic if needed

## Security Considerations

### Before Deployment

- [ ] Complete security audit (for mainnet)
- [ ] Test all functions thoroughly
- [ ] Review access controls
- [ ] Verify modifier logic
- [ ] Check for reentrancy vulnerabilities
- [ ] Test edge cases
- [ ] Review upgrade mechanisms (if applicable)

### After Deployment

- [ ] Verify contract on Etherscan
- [ ] Test ownership functions
- [ ] Document admin procedures
- [ ] Set up monitoring
- [ ] Prepare incident response plan
- [ ] Back up private keys securely

## Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment
- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Contracts compiled successfully
- [ ] All tests passing
- [ ] Wallet funded with sufficient ETH
- [ ] RPC connection verified

### Deployment
- [ ] Deploy command executed
- [ ] Transaction confirmed on-chain
- [ ] Contract address recorded
- [ ] Deployment info saved
- [ ] Initial state verified

### Post-Deployment
- [ ] Contract verified on Etherscan
- [ ] Interaction testing completed
- [ ] Simulation tests passed
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring configured

## Additional Resources

### Documentation
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

### Tools
- [Remix IDE](https://remix.ethereum.org/) - Online Solidity IDE
- [Tenderly](https://tenderly.co/) - Smart contract monitoring
- [Hardhat Network](https://hardhat.org/hardhat-network/) - Local blockchain

### Sepolia Faucets
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

---

**Need Help?** Open an issue on GitHub or contact the development team.

**Security Notice**: Never commit private keys or sensitive credentials to version control. Always use environment variables and keep `.env` files secure.
