// Contract configuration
const CONTRACT_ADDRESS = '0xc0598599bFF9887467472DA268309fF8A9538b7A';
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // Chain ID for Sepolia testnet
const CONTRACT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint32", "name": "memberId", "type": "uint32"},
            {"indexed": false, "internalType": "address", "name": "wallet", "type": "address"},
            {"indexed": false, "internalType": "bool", "name": "isAnonymous", "type": "bool"}
        ],
        "name": "MemberRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint32", "name": "levelId", "type": "uint32"},
            {"indexed": false, "internalType": "string", "name": "name", "type": "string"}
        ],
        "name": "MembershipLevelCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint32", "name": "memberId", "type": "uint32"},
            {"indexed": false, "internalType": "uint32", "name": "newLevel", "type": "uint32"}
        ],
        "name": "MemberLevelUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint32", "name": "memberId", "type": "uint32"},
            {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "PrivateActivityRecorded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint32", "name": "memberId", "type": "uint32"}
        ],
        "name": "MemberDeactivated",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "registerPublicMember",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "anonymousToken", "type": "bytes32"}
        ],
        "name": "registerAnonymousMember",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint32", "name": "activityScore", "type": "uint32"}
        ],
        "name": "recordPrivateActivity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint32", "name": "memberId", "type": "uint32"}
        ],
        "name": "updateMemberLevel",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "name", "type": "string"},
            {"internalType": "uint32", "name": "requiredScore", "type": "uint32"},
            {"internalType": "uint64", "name": "benefits", "type": "uint64"}
        ],
        "name": "createMembershipLevel",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint32", "name": "memberId", "type": "uint32"}
        ],
        "name": "deactivateMember",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint32", "name": "memberId", "type": "uint32"}
        ],
        "name": "getMemberInfo",
        "outputs": [
            {"internalType": "bool", "name": "isActive", "type": "bool"},
            {"internalType": "bool", "name": "isAnonymous", "type": "bool"},
            {"internalType": "address", "name": "wallet", "type": "address"},
            {"internalType": "uint256", "name": "publicJoinTime", "type": "uint256"},
            {"internalType": "uint256", "name": "activityCount", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getMyMemberId",
        "outputs": [
            {"internalType": "uint32", "name": "", "type": "uint32"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "wallet", "type": "address"}
        ],
        "name": "isMember",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint32", "name": "levelId", "type": "uint32"}
        ],
        "name": "getMembershipLevelInfo",
        "outputs": [
            {"internalType": "string", "name": "name", "type": "string"},
            {"internalType": "bool", "name": "isActive", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getSystemStats",
        "outputs": [
            {"internalType": "uint32", "name": "totalMembersCount", "type": "uint32"},
            {"internalType": "uint32", "name": "totalLevels", "type": "uint32"},
            {"internalType": "uint32", "name": "nextMemberId", "type": "uint32"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "generateAnonymousToken",
        "outputs": [
            {"internalType": "bytes32", "name": "", "type": "bytes32"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {"internalType": "address", "name": "", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalMembers",
        "outputs": [
            {"internalType": "uint32", "name": "", "type": "uint32"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Global variables
let provider;
let signer;
let contract;
let userAddress;
let isOwner = false;

// DOM elements
const connectWalletBtn = document.getElementById('connectWallet');
const disconnectWalletBtn = document.getElementById('disconnectWallet');
const walletInfo = document.getElementById('walletInfo');
const walletAddress = document.getElementById('walletAddress');
const mainContent = document.getElementById('mainContent');
const loading = document.getElementById('loading');
const messageDiv = document.getElementById('message');

// Stats elements
const totalMembersEl = document.getElementById('totalMembers');
const totalLevelsEl = document.getElementById('totalLevels');
const myMemberIdEl = document.getElementById('myMemberId');

// Member info elements
const memberStatusEl = document.getElementById('memberStatus');
const membershipTypeEl = document.getElementById('membershipType');
const joinDateEl = document.getElementById('joinDate');
const activityCountEl = document.getElementById('activityCount');

// Action buttons
const registerPublicBtn = document.getElementById('registerPublic');
const registerAnonymousBtn = document.getElementById('registerAnonymous');
const recordActivityBtn = document.getElementById('recordActivity');
const updateLevelBtn = document.getElementById('updateLevel');
const generateTokenBtn = document.getElementById('generateToken');
const createLevelBtn = document.getElementById('createLevel');
const deactivateMemberBtn = document.getElementById('deactivateMember');

// Admin section
const adminSection = document.querySelector('.admin-section');
const tokenDisplay = document.querySelector('.token-display');
const generatedTokenEl = document.getElementById('generatedToken');

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

// Make init function globally available for fallback CDN
window.initApp = init;

function init() {
    // Check if ethers is available
    if (typeof ethers === 'undefined') {
        console.warn('Ethers not yet loaded, waiting...');
        setTimeout(init, 100);
        return;
    }

    console.log('Initializing application...');

    // Hide loading screen initially
    showLoading(false);

    connectWalletBtn.addEventListener('click', connectWallet);
    disconnectWalletBtn.addEventListener('click', disconnectWallet);
    registerPublicBtn.addEventListener('click', registerPublicMember);
    registerAnonymousBtn.addEventListener('click', registerAnonymousMember);
    recordActivityBtn.addEventListener('click', recordPrivateActivity);
    updateLevelBtn.addEventListener('click', updateMemberLevel);
    generateTokenBtn.addEventListener('click', generateAnonymousToken);
    createLevelBtn.addEventListener('click', createMembershipLevel);
    deactivateMemberBtn.addEventListener('click', deactivateMember);

    // Check if wallet is already connected
    checkWalletConnection();

    console.log('Application initialized successfully');
}

async function checkWalletConnection() {
    console.log('Checking wallet connection...');

    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            console.log('Found accounts:', accounts.length);

            if (accounts.length > 0) {
                console.log('Auto-connecting to wallet...');
                await connectWallet();
            } else {
                console.log('No connected accounts found');
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    } else {
        console.log('MetaMask not detected');
    }
}

async function connectWallet() {
    // 1. Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
        showMessage('Please install MetaMask to use this application', 'error');
        return;
    }

    try {
        showLoading(true);

        // 2. Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        if (accounts.length === 0) {
            showMessage('No accounts found. Please connect your MetaMask wallet.', 'error');
            return;
        }

        // 3. Check current network
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

        // 4. Switch to Sepolia network if needed
        if (currentChainId !== SEPOLIA_CHAIN_ID) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID }],
                });
            } catch (switchError) {
                // If the chain is not added to MetaMask, add it
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: SEPOLIA_CHAIN_ID,
                                    chainName: 'Sepolia Testnet',
                                    nativeCurrency: {
                                        name: 'SepoliaETH',
                                        symbol: 'ETH',
                                        decimals: 18,
                                    },
                                    rpcUrls: ['https://sepolia.infura.io/v3/'],
                                    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
                                },
                            ],
                        });
                    } catch (addError) {
                        showMessage('Failed to add Sepolia network to MetaMask', 'error');
                        return;
                    }
                } else {
                    showMessage('Failed to switch to Sepolia network', 'error');
                    return;
                }
            }
        }

        // 5. Initialize provider and signer (ethers v6 syntax)
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        // 6. Initialize contract
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // 7. Verify contract connection
        try {
            console.log('Testing contract connection...');
            const totalMembers = await contract.totalMembers();
            console.log('Contract connected successfully, total members:', totalMembers.toString());
        } catch (contractError) {
            console.error('Contract connection failed:', contractError);
            showMessage('Failed to connect to contract. Please check the contract address.', 'error');
            showLoading(false);
            return;
        }

        // Check if user is owner
        try {
            const ownerAddress = await contract.owner();
            isOwner = ownerAddress.toLowerCase() === userAddress.toLowerCase();

            if (isOwner) {
                adminSection.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error checking owner status:', error);
        }

        // 8. Update UI state
        walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        connectWalletBtn.classList.add('hidden');
        walletInfo.classList.remove('hidden');
        mainContent.classList.remove('hidden');

        // 9. Load initial data
        console.log('Loading initial data...');
        await loadData();

        showMessage('Connected to Sepolia! ✅', 'success');
        console.log('Wallet connection completed successfully');

        // Listen for account and network changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

    } catch (error) {
        console.error('Error connecting wallet:', error);
        showMessage('Failed to connect wallet: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function disconnectWallet() {
    provider = null;
    signer = null;
    contract = null;
    userAddress = null;
    isOwner = false;

    connectWalletBtn.classList.remove('hidden');
    walletInfo.classList.add('hidden');
    mainContent.classList.add('hidden');
    adminSection.classList.add('hidden');

    // Remove event listeners
    if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
    }

    showMessage('Wallet disconnected', 'info');
}

async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        await disconnectWallet();
    } else {
        location.reload();
    }
}

function handleChainChanged(chainId) {
    location.reload();
}

async function loadData() {
    console.log('Loading system data...');

    try {
        // Load system stats
        console.log('Loading system stats...');
        const stats = await contract.getSystemStats();
        console.log('System stats loaded:', {
            totalMembers: stats.totalMembersCount.toString(),
            totalLevels: stats.totalLevels.toString()
        });

        totalMembersEl.textContent = stats.totalMembersCount.toString();
        totalLevelsEl.textContent = stats.totalLevels.toString();

        // Load member info
        console.log('Loading member info...');
        try {
            const memberId = await contract.getMyMemberId();
            console.log('Member ID:', memberId.toString());

            if (memberId > 0) {
                myMemberIdEl.textContent = memberId.toString();

                const memberInfo = await contract.getMemberInfo(memberId);
                console.log('Member info loaded:', {
                    isActive: memberInfo.isActive,
                    isAnonymous: memberInfo.isAnonymous,
                    activityCount: memberInfo.activityCount.toString()
                });

                memberStatusEl.textContent = memberInfo.isActive ? 'Active' : 'Inactive';
                membershipTypeEl.textContent = memberInfo.isAnonymous ? 'Anonymous' : 'Public';

                if (!memberInfo.isAnonymous && memberInfo.publicJoinTime > 0) {
                    const joinDate = new Date(memberInfo.publicJoinTime * 1000);
                    joinDateEl.textContent = joinDate.toLocaleDateString();
                } else {
                    joinDateEl.textContent = 'Private';
                }

                activityCountEl.textContent = memberInfo.activityCount.toString();
            } else {
                console.log('User not registered as member');
                myMemberIdEl.textContent = 'Not registered';
                memberStatusEl.textContent = 'Not registered';
            }
        } catch (error) {
            console.error('Error loading member info:', error);
            // Don't show error for member info, user might not be registered
        }

        console.log('Data loading completed');

    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Failed to load data: ' + error.message, 'error');
    }
}

async function registerPublicMember() {
    if (!contract) {
        showMessage('Please connect your wallet first', 'error');
        return;
    }

    try {
        showLoading(true);

        const tx = await contract.registerPublicMember();
        await tx.wait();

        showMessage('Successfully registered as public member!', 'success');
        await loadData();

    } catch (error) {
        console.error('Error registering public member:', error);
        if (error.reason) {
            showMessage('Registration failed: ' + error.reason, 'error');
        } else {
            showMessage('Registration failed: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

async function registerAnonymousMember() {
    if (!contract) {
        showMessage('Please connect your wallet first', 'error');
        return;
    }

    const tokenInput = document.getElementById('anonymousToken');
    const token = tokenInput.value.trim();

    if (!token) {
        showMessage('Please enter an anonymous token', 'error');
        return;
    }

    try {
        showLoading(true);

        // Convert token to bytes32 (ethers v6 syntax)
        const bytes32Token = ethers.encodeBytes32String(token);

        const tx = await contract.registerAnonymousMember(bytes32Token);
        await tx.wait();

        showMessage('Successfully registered as anonymous member!', 'success');
        tokenInput.value = '';
        await loadData();

    } catch (error) {
        console.error('Error registering anonymous member:', error);
        if (error.reason) {
            showMessage('Registration failed: ' + error.reason, 'error');
        } else {
            showMessage('Registration failed: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

async function recordPrivateActivity() {
    if (!contract) {
        showMessage('Please connect your wallet first', 'error');
        return;
    }

    const scoreInput = document.getElementById('activityScore');
    const score = parseInt(scoreInput.value);

    if (!score || score < 1 || score > 1000) {
        showMessage('Please enter a valid activity score (1-1000)', 'error');
        return;
    }

    try {
        showLoading(true);

        const tx = await contract.recordPrivateActivity(score);
        await tx.wait();

        showMessage('Activity recorded successfully!', 'success');
        scoreInput.value = '';
        await loadData();

    } catch (error) {
        console.error('Error recording activity:', error);
        if (error.reason) {
            showMessage('Failed to record activity: ' + error.reason, 'error');
        } else {
            showMessage('Failed to record activity: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

async function updateMemberLevel() {
    if (!contract) {
        showMessage('Please connect your wallet first', 'error');
        return;
    }

    const memberIdInput = document.getElementById('memberIdToUpdate');
    const memberId = parseInt(memberIdInput.value);

    if (!memberId || memberId < 1) {
        showMessage('Please enter a valid member ID', 'error');
        return;
    }

    try {
        showLoading(true);

        const tx = await contract.updateMemberLevel(memberId);
        await tx.wait();

        showMessage('Member level updated successfully!', 'success');
        memberIdInput.value = '';
        await loadData();

    } catch (error) {
        console.error('Error updating member level:', error);
        if (error.reason) {
            showMessage('Failed to update level: ' + error.reason, 'error');
        } else {
            showMessage('Failed to update level: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

async function generateAnonymousToken() {
    if (!contract || !isOwner) {
        showMessage('Only the owner can generate tokens', 'error');
        return;
    }

    try {
        showLoading(true);

        const token = await contract.generateAnonymousToken();

        generatedTokenEl.value = token;
        tokenDisplay.classList.remove('hidden');

        showMessage('Anonymous token generated!', 'success');

    } catch (error) {
        console.error('Error generating token:', error);
        showMessage('Failed to generate token: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function createMembershipLevel() {
    if (!contract || !isOwner) {
        showMessage('Only the owner can create membership levels', 'error');
        return;
    }

    const nameInput = document.getElementById('levelName');
    const scoreInput = document.getElementById('requiredScore');
    const benefitsInput = document.getElementById('benefits');

    const name = nameInput.value.trim();
    const score = parseInt(scoreInput.value);
    const benefits = parseInt(benefitsInput.value);

    if (!name || !score || !benefits) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        showLoading(true);

        const tx = await contract.createMembershipLevel(name, score, benefits);
        await tx.wait();

        showMessage('Membership level created successfully!', 'success');
        nameInput.value = '';
        scoreInput.value = '';
        benefitsInput.value = '';
        await loadData();

    } catch (error) {
        console.error('Error creating level:', error);
        if (error.reason) {
            showMessage('Failed to create level: ' + error.reason, 'error');
        } else {
            showMessage('Failed to create level: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

async function deactivateMember() {
    if (!contract || !isOwner) {
        showMessage('Only the owner can deactivate members', 'error');
        return;
    }

    const memberIdInput = document.getElementById('memberIdToDeactivate');
    const memberId = parseInt(memberIdInput.value);

    if (!memberId || memberId < 1) {
        showMessage('Please enter a valid member ID', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to deactivate member ${memberId}?`)) {
        return;
    }

    try {
        showLoading(true);

        const tx = await contract.deactivateMember(memberId);
        await tx.wait();

        showMessage('Member deactivated successfully!', 'success');
        memberIdInput.value = '';
        await loadData();

    } catch (error) {
        console.error('Error deactivating member:', error);
        if (error.reason) {
            showMessage('Failed to deactivate member: ' + error.reason, 'error');
        } else {
            showMessage('Failed to deactivate member: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

// Utility functions
function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');

    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}

// Format address for display
function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format date
function formatDate(timestamp) {
    if (timestamp === 0) return 'Private';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
}