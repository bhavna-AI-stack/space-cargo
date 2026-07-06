# Smart Contract Unit Testing

## Project Title

DeFi Staking Platform

## Objective

The purpose of unit testing is to verify that all smart contract functions behave correctly under normal and edge-case conditions.

## Testing Environment

### Tools

* Remix IDE
* MetaMask
* SCAI Mainnet
* Solidity 0.8.x

## Functions Tested

### 1. stake()

Purpose:
Allows users to stake ETH.

#### Test Case 1

Input:
0.1 ETH

Expected Result:
Balance increases by 0.1 ETH

Actual Result:
Passed 

#### Test Case 2

Input:
0 ETH

Expected Result:
Transaction rejected

Actual Result:
Passed 

Reason:
require(msg.value > 0)

### 2. withdraw()

Purpose:
Allows users to withdraw staked ETH.

#### Test Case 1

Input:
Withdraw 0.05 ETH from 0.1 ETH balance

Expected Result:
Withdrawal successful

Actual Result:
Passed 

#### Test Case 2

Input:
Withdraw more than balance

Expected Result:
Transaction rejected

Actual Result:
Passed 

Reason:
Insufficient balance validation

### 3. getBalance()

Purpose:
Returns user staking balance.

#### Test Case

Input:
User address

Expected Result:
Correct balance returned

Actual Result:
Passed 

### 4. calculateReward()

Purpose:
Calculates staking reward.

Reward Formula:

Reward = Balance ÷ 10

#### Test Case

Stake:
0.2 ETH

Expected Reward:
0.02 ETH

Actual Result:
0.02 ETH

Status:
Passed 

## Edge Case Testing

### Invalid Stake Amount

Input:
0 ETH

Expected:
Revert transaction

Result:
Passed 

### Excess Withdrawal

Input:
Amount greater than staked balance

Expected:
Revert transaction

Result:
Passed 

### Multiple Stakes

Input:
Stake ETH multiple times

Expected:
Balances accumulate correctly

Result:
Passed 

## Test Summary

| Function          | Status |
| ----------------- | ------ |
| stake()           | Passed |
| withdraw()        | Passed |
| getBalance()      | Passed |
| calculateReward() | Passed |

## Conclusion

All major smart contract functions were tested successfully. The staking contract correctly handles staking, withdrawals, balance tracking, reward calculation, and validation of invalid transactions.
