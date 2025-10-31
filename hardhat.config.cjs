require("dotenv").config();
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-network-helpers");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-contract-sizer");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },

  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },

    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto",
      gas: "auto"
    }
  },

  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || ""
    }
  },

  sourcify: {
    enabled: true
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  mocha: {
    timeout: 120000
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    outputFile: "gas-report.txt",
    noColors: true,
    showTimeSpent: true,
    showMethodSig: true,
    excludeContracts: [],
    src: "./contracts",
    gasPriceApi: process.env.GAS_PRICE_API || "",
    token: process.env.GAS_PRICE_TOKEN || "ETH",
    coinmarketcapBaseUrl: "https://pro-api.coinmarketcap.com",
    L1: "ethereum",
    L2: "sepolia",
    reportPureAndViewMethods: true,
    darkMode: false,
    rst: false,
    rstTitle: "Gas Usage Report",
    fast: false,
    maxMethodDiff: 10,
    maxDeploymentDiff: 10,
    remoteContracts: []
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: process.env.REPORT_CONTRACT_SIZE !== "false",
    strict: true,
    only: [],
    except: [],
    outputFile: "./contract-size-report.txt"
  }
};
