# 🎮 Rock Paper Scissors - Minus One DApp

A decentralized Rock Paper Scissors - Minus One betting game.

## 📖 Overview

This project demonstrates:

- Smart contract-based betting logic
- Treasury-controlled payout system
- On-chain game state tracking
- Owner-configurable economic parameters
- React + Ethers integration
- MetaMask support

Players place ETH bets, select two moves, and finish the game with one final move. Rewards are stored in-contract and can be withdrawn after reaching a threshold.

## 🚀 Features

- Wallet connection (MetaMask)
- ETH betting system
- Minus One game logic
- Treasury-backed payouts
- Last 5 games history per player
- Withdrawal system with configurable fee
- Owner-controlled game parameters

## 🧠 Game Rules

1. Player selects two different moves from:
   - Rock
   - Paper
   - Scissors
2. Contract randomly generates two opponent moves.
3. Player chooses one of their two moves to finish the game.
4. Outcome:
   - Win -> 2x bet
   - Tie -> 0.8x bet
   - Lose -> Bet lost
5. Rewards accumulate in contract until withdrawal threshold is reached.

## 📜 Contract Details

- **Contract Name:** `RPSMinusOne.sol`
- **Network:** `Sepolia Test Network`
- **Chain ID:** `11155111`
- **Deployed Address:** `0xF555C1Da60aC81051162098a7389927bb9b2AAdd`
- **Explorer Link:** `https://sepolia.etherscan.io/address/0xF555C1Da60aC81051162098a7389927bb9b2AAdd`

## 🏗️ Smart Contract Architecture

### 🔧 Core Variables

```solidity
uint256 public minimumBet;
uint256 public withdrawThreshold;
uint256 public withdrawFee;
```

### 🗂️ Key Mappings

```solidity
mapping(address => Game) public games;
mapping(address => uint256) public rewards;
mapping(address => GameResult[5]) public recentGames;
```

### 👑 Owner Controls

- `setMinimumBet()`
- `setWithdrawThreshold()`
- `setWithdrawFee()`
- `withdrawTreasury()`

## 📦 Tech Stack

- Solidity `0.8.20` (Smart Contract compiler target)
- Hardhat `2.22.3` + `@nomicfoundation/hardhat-toolbox` `5.0.0`
- React `19.2.0` + React DOM `19.2.0`
- Vite `7.3.1`
- Ethers.js `6.16.0`
- HTML5 + CSS3
- MetaMask
- Sepolia Test Network
- Remix / Hardhat compatible


## ⚙️ Installation & Setup

### 1. 📥 Clone Repo

```bash
git clone https://github.com/ShankarSinghKelawat/RpsMinusOne_Game
cd RpsMinusOne_Game
```

### 2. 📦 Install Dependencies

```bash
npm install
```
## 🛡️ Security Notes

- Reentrancy-safe reward reset before payout
- Treasury balance checks before reward allocation
- Only one active game per user enforced
- Owner-restricted setter functions

## ⚠️ Important Notes

- Randomness uses block variables (not secure for production).
- This is suitable for testnet or demo environments.
- Not audited.

For a better option, use:

- Chainlink VRF
- Secure randomness oracle
- Formal audit

## License
- MIT
