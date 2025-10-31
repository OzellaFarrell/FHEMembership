# Quick Start Guide

Get your Privacy Membership Platform up and running in 5 minutes.

## Prerequisites

- Node.js v18+ installed
- MetaMask wallet with Sepolia ETH
- Text editor

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your credentials:
# - PRIVATE_KEY: Your wallet private key (without 0x)
# - SEPOLIA_RPC_URL: Keep default or use Alchemy/Infura
# - ETHERSCAN_API_KEY: Your Etherscan API key
```

## Step 3: Compile Contracts

```bash
npm run compile
```

Expected output: `Compiled 1 Solidity file successfully`

## Step 4: Run Tests (Optional)

```bash
npm test
```

All tests should pass ✅

## Step 5: Deploy to Sepolia

```bash
npm run deploy
```

This will:
- Deploy your contract
- Save deployment info to `deployments/sepolia-deployment.json`
- Display contract address and Etherscan link

## Step 6: Verify on Etherscan

```bash
npm run verify
```

Your contract is now verified and visible on Etherscan! ✨

## Step 7: Interact with Your Contract

```bash
npm run interact
```

Try these actions:
1. View system statistics
2. Register as a public member
3. Record some activities
4. Check your membership status

## Quick Commands

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile contracts |
| `npm test` | Run tests |
| `npm run deploy` | Deploy to Sepolia |
| `npm run verify` | Verify on Etherscan |
| `npm run interact` | Interactive CLI |
| `npm run simulate` | Run simulations |
| `npm run dev` | Start frontend |

## Get Sepolia ETH

Need testnet ETH? Get it from:
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

## Get API Keys

### Etherscan API Key
1. Visit [Etherscan.io](https://etherscan.io/)
2. Create account
3. Go to [API Keys](https://etherscan.io/myapikey)
4. Generate new key

### Alchemy RPC (Optional)
1. Visit [Alchemy.com](https://www.alchemy.com/)
2. Create free account
3. Create new app (Ethereum Sepolia)
4. Copy API key to `.env`

## Troubleshooting

### Compilation fails
```bash
npm run clean
npm install
npm run compile
```

### Insufficient funds
Get more Sepolia ETH from faucets

### Network connection issues
Try alternative RPC in `.env`:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY
```

## What's Next?

- Read [README.md](README.md) for detailed documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for advanced deployment
- Review test files in `test/` for usage examples
- Explore scripts in `scripts/` for automation

## Need Help?

- Check documentation files
- Review [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)
- Open GitHub issue

---

**That's it!** Your Privacy Membership Platform is ready to use. 🎉
