# Blockchain Network & API Integration

## Project Title

DeFi Staking Platform

## Objective

The objective of blockchain integration is to connect the frontend application with the deployed smart contract and enable users to perform blockchain transactions securely.

## Blockchain Network

### Network Used

* SCAI Mainnet

### Purpose

The blockchain network is responsible for:

* Executing smart contracts
* Validating transactions
* Maintaining staking balances
* Recording staking history
* Managing blockchain state
  
## Smart Contract Deployment

The staking smart contract was deployed using Remix IDE.

### Deployment Tools

* Remix IDE
* MetaMask
* SCAI Mainnet

### Contract Features

* Stake ETH
* Withdraw ETH
* Check Balance
* Calculate Rewards

## API Integration

The project uses Ethers.js as the blockchain API layer.

### Technology Used

* Ethers.js v6

Purpose:

* Connect frontend to blockchain
* Read smart contract data
* Send blockchain transactions
* Retrieve account information

## Provider Integration

The application connects to MetaMask using BrowserProvider.

Example:

```javascript
const provider =
  new ethers.BrowserProvider(window.ethereum);
```

Purpose:

* Access blockchain network
* Retrieve wallet information
* Send requests to smart contracts

## Contract Integration

The frontend creates a contract instance using the deployed contract address and ABI.

Example:

```javascript
const contract =
  new ethers.Contract(
    CONTRACT_ADDRESS,
    ABI,
    signer
  );
```

Purpose:

* Call smart contract functions
* Execute transactions
* Read blockchain data

## Transaction Flow

User Action
↓
React Frontend
↓
Ethers.js
↓
MetaMask
↓
Blockchain Network
↓
Smart Contract Execution
↓
Transaction Confirmation
↓
Frontend Updated

## Integrated Functions

### stake()

Allows users to stake ETH.

### withdraw()

Allows users to withdraw staked ETH.

### getBalance()

Retrieves the user's staking balance.

### calculateReward()

Calculates staking rewards.

## Data Retrieval

The application retrieves data directly from the blockchain.

Retrieved Information:

* Wallet Address
* Staked Balance
* Reward Balance
* Transaction Status

## Security Measures

* Wallet authentication through MetaMask
* Transaction approval required for all state-changing operations
* Smart contract validation using require()
* Immutable blockchain transaction records

---

## Outcome

The React frontend was successfully integrated with the SCAI blockchain network using Ethers.js and MetaMask. Users can securely interact with the deployed staking smart contract and perform staking operations through a decentralized interface.
