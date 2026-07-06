# Frontend Integration (React + Web3)

## Project Title

DeFi Staking Platform

## Objective

The frontend was integrated with the deployed Solidity smart contract using React.js and Ethers.js. This integration enables users to interact with blockchain functionality through a web interface.

---

## Technologies Used

* React.js
* Vite
* Ethers.js
* JavaScript
* MetaMask

---

## Frontend Features

### Wallet Connection

Users can connect their MetaMask wallet to the application.

Function Used:

```javascript
connectWallet()
```

Purpose:

* Connect MetaMask
* Retrieve wallet address
* Display connected account

---

### Stake ETH

Users can enter an ETH amount and stake it into the smart contract.

Function Used:

```javascript
stakeETH()
```

Purpose:

* Send ETH to smart contract
* Execute stake() function
* Update staking balance

---

### Withdraw ETH

Users can withdraw previously staked ETH.

Function Used:

```javascript
withdrawETH()
```

Purpose:

* Execute withdraw() function
* Transfer ETH back to user wallet

---

### Check Balance

Users can view their current staking balance.

Function Used:

```javascript
checkBalance()
```

Purpose:

* Call getBalance()
* Display staked ETH

---

### Check Reward

Users can calculate staking rewards.

Function Used:

```javascript
checkReward()
```

Purpose:

* Call calculateReward()
* Display estimated rewards

---

## Smart Contract Integration

The frontend communicates with the deployed smart contract using Ethers.js.

Example:

```javascript
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  ABI,
  signer
);
```

This creates a connection between the React frontend and the deployed smart contract.

---

## Transaction Flow

User Action
↓
React Frontend
↓
Ethers.js
↓
MetaMask
↓
Smart Contract
↓
Blockchain
↓
Response Returned
↓
UI Updated

---

## User Interface Components

* Connect Wallet Button
* ETH Amount Input
* Stake Button
* Withdraw Button
* Check Balance Button
* Check Reward Button
* Balance Display
* Reward Display
* Contract Address Display

---

## Outcome

The React frontend was successfully integrated with the deployed Solidity smart contract using Ethers.js. Users can connect wallets, stake ETH, withdraw funds, check balances, and calculate rewards through a user-friendly interface.
