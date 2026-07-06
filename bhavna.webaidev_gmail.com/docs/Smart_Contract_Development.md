# Smart Contract Development

## Project Title

DeFi Staking Platform

## Objective

The objective of the smart contract is to provide decentralized staking functionality where users can stake ETH, track balances, calculate rewards, and withdraw funds securely through blockchain technology.

## Development Environment

### Tools Used

* Solidity 0.8.x
* Remix IDE
* MetaMask
* SCAI Mainnet
* Ethers.js

## Smart Contract Source Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Staking {

    mapping(address => uint256) public balances;

    function stake() public payable {
        require(msg.value > 0, "Send ETH");
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(
            balances[msg.sender] >= amount,
            "Insufficient balance"
        );

        balances[msg.sender] -= amount;

        payable(msg.sender).transfer(amount);
    }

    function getBalance(address user)
        public
        view
        returns(uint256)
    {
        return balances[user];
    }

    function calculateReward(address user)
        public
        view
        returns(uint256)
    {
        return balances[user] / 10;
    }

    function claimReward()
        public
        view
        returns(uint256)
    {
        return balances[msg.sender] / 10;
    }
}
```

## Smart Contract Features

### Stake ETH

Users can stake ETH into the smart contract.

Function:

```solidity
stake()
```
### Withdraw ETH

Users can withdraw previously staked ETH.

Function:

```solidity
withdraw(uint256 amount)
```

### Check Balance

Users can view their staking balance.

Function:

```solidity
getBalance(address user)
```

### Calculate Reward

Rewards are calculated as 10% of the staked balance.

Function:

```solidity
calculateReward(address user)
```

Example:

* Stake = 1 ETH
* Reward = 0.1 ETH

### Claim Reward

Returns the estimated reward amount.

Function:

```solidity
claimReward()
```

## Contract Workflow

```text
User
 ↓
Connect Wallet
 ↓
Stake ETH
 ↓
Balance Stored
 ↓
Reward Calculated
 ↓
Withdraw ETH
 ↓
Balance Updated
```

## Security Measures

* Input validation using require()
* Balance verification before withdrawal
* Solidity 0.8.x overflow protection
* Wallet-based ownership using msg.sender

## Deployment Details

### Network

SCAI Mainnet

### Deployment Tool

Remix IDE

### Contract Name

Staking

## Outcome

The smart contract was successfully developed, tested, and deployed on SCAI Mainnet. It provides staking, withdrawal, balance tracking, and reward calculation functionality for the DeFi Staking Platform.
