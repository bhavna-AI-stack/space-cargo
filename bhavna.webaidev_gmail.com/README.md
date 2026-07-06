# 🔷 Decentralized ETH Staking Platform

A full-stack decentralized staking platform built using **Solidity**, **React.js**, **Ethers.js**, and **SecureChain AI Mainnet**.

EtherAuthority enables users to securely stake ETH, withdraw staked assets, calculate rewards, claim rewards, and manage their staking positions through a modern Web3 dashboard integrated with MetaMask.

---

# 🌟 Features

### Wallet Integration

* MetaMask Wallet Connection
* Automatic Wallet Detection
* Connected Wallet Display
* Secure Authentication

### Staking Protocol

* Stake ETH
* Withdraw Staked ETH
* Calculate Rewards
* Claim Rewards
* Real-Time Balance Updates

### Dashboard Features

* Wallet Balance Tracking
* Total Staked Balance Monitoring
* Pending Rewards Display
* Recent Activity Tracking
* Protocol Information Dashboard

### Blockchain Integration

* SecureChain AI Mainnet Support
* Smart Contract Interaction via Ethers.js
* On-Chain Transaction Execution
* Decentralized Asset Management

---

# 🏗️ Architecture

The platform consists of two major components:

## Smart Contract Layer

### Staking.sol

A Solidity smart contract deployed on SecureChain AI Mainnet responsible for:

* Accepting ETH deposits
* Managing staking balances
* Reward calculation
* Reward claiming
* Processing withdrawals

### Core Functions

#### stake()

Allows users to stake ETH into the protocol.

#### withdraw(uint256 amount)

Allows users to withdraw previously staked ETH.

#### getBalance(address user)

Returns the user's staked balance.

#### calculateReward(address user)

Calculates pending staking rewards.

#### claimReward()

Allows users to claim accumulated rewards.

---

## Frontend Layer

The frontend is built using React.js, Vite, and Ethers.js and provides:

* Wallet Connectivity
* Staking Dashboard
* Reward Tracking
* Activity Monitoring
* Smart Contract Interaction

---

# 🔄 Application Workflow

User ---> Connect MetaMask Wallet ---> Stake ETH ---> Balance Updated ---> Rewards Calculated ---> Claim Rewards ---> Withdraw ETH ---> Activity Updated

# 🛠️ Technology Stack

## Frontend

* React.js
* Vite
* JavaScript
* CSS3
* Ethers.js v6

## Smart Contracts

* Solidity ^0.8.x
* Remix IDE

## Blockchain

* SecureChain AI Mainnet
* Chain ID: 34

## Wallet

* MetaMask

## Deployment

* GitHub
* Vercel

---

# 🚀 Getting Started

## Prerequisites

Before running this project, ensure the following are installed:

* Node.js (v18 or higher)
* npm
* Git
* MetaMask Browser Extension

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/mummanavasanthi/DeFi_Staking_Platform.git
```

### 2. Navigate to Project Directory

```bash
cd DeFi_Staking_Platform
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

---

# 🔧 MetaMask Configuration

Add SecureChain AI Mainnet to MetaMask:

| Parameter       | Value                           |
| --------------- | ------------------------------- |
| Network Name    | SecureChain AI Mainnet          |
| Chain ID        | 34                              |
| Currency Symbol | SCAI                             |
| Explorer        | https://explorer.securechain.ai |

After configuration:

1. Open MetaMask
2. Select SecureChain AI Mainnet
3. Connect Wallet
4. Start Staking

---

# 📜 Smart Contract Deployment

## Deploy Using Remix IDE

### Step 1

Open Remix IDE:

https://remix.ethereum.org

### Step 2

Create a new file:

```text
Staking.sol
```

Paste the smart contract source code.

### Step 3

Compile Contract

* Open Solidity Compiler
* Select Solidity Version ^0.8.x
* Click Compile

### Step 4

Deploy Contract

* Open Deploy & Run Transactions
* Select Injected Provider - MetaMask
* Connect Wallet
* Select SecureChain AI Mainnet
* Click Deploy
* Confirm Transaction

### Step 5

Copy Contract Address

After deployment, copy the deployed contract address.

### Frontend Deployment

1. Push project to GitHub
2. Login to Vercel
3. Import Repository
4. Click Deploy

Vercel automatically builds and deploys the application.

---

# 🌐 Live Deployment

### Vercel

https://de-fi-staking-platform.vercel.app/

---

# 🌐 Deployed Smart Contract

### SecureChain AI Mainnet

**Chain ID:** 34

**Contract Address**

```text
0xa124542Ac0039E7288FD103fdd12efe8d4f35Da3
```

**Explorer**

https://explorer.securechain.ai

---

# 📸 Screenshots

## Dashboard

<img width="1446" height="712" alt="image" src="https://github.com/user-attachments/assets/e95caa29-1b0a-4f7f-8c46-00f6e15f0da9" />

## Wallet Connected
<img width="1918" height="911" alt="image" src="https://github.com/user-attachments/assets/ddcb0f3a-cad4-43a6-8485-71e538766169" />

## Stake ETH
<img width="1258" height="527" alt="image" src="https://github.com/user-attachments/assets/cbba188a-e430-4b98-95c0-7367912bf4e8" />

## Withdraw ETH
<img width="1217" height="530" alt="image" src="https://github.com/user-attachments/assets/2bef8d0b-f189-4883-b140-d96c04ec0451" />

## Claim Reward
<img width="1781" height="767" alt="image" src="https://github.com/user-attachments/assets/e69d9a01-6faf-4747-80bc-4c46c1770c24" />

## Recent Activity
<img width="1275" height="485" alt="image" src="https://github.com/user-attachments/assets/61eee334-93dd-4824-a955-2dea55a03fb5" />

---

# 🔐 Security Features

* Input Validation using require()
* Balance Verification before Withdrawals
* Reward Validation
* Solidity 0.8.x Overflow Protection
* MetaMask Authentication
* Secure Blockchain Transactions

---

# 🧪 Testing

The following functionalities were tested successfully:

* Wallet Connection
* SCAI Staking
* SCAI Withdrawal
* Reward Calculation
* Reward Claiming
* Balance Retrieval
* Activity Tracking
* Smart Contract Interaction

---

# 📈 Future Enhancements

* WalletConnect Integration
* Coinbase Wallet Support
* Multi-Token Staking
* Auto-Compounding Rewards
* Advanced Dashboard Analytics
* Explorer Transaction Integration
* Mobile Application Support
