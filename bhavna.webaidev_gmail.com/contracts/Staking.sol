// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Staking {

    mapping(address => uint256) public balances;
    mapping(address => uint256) public stakingTime;

    uint256 public rewardRate = 10;

    function stake() public payable {

        require(
            msg.value > 0,
            "Send ETH"
        );

        balances[msg.sender] += msg.value;

        stakingTime[msg.sender] =
            block.timestamp;
    }

    function calculateReward(
        address user
    )
        public
        view
        returns(uint256)
    {
        uint256 duration =
            block.timestamp -
            stakingTime[user];

        uint256 reward =
            (
                balances[user] *
                duration *
                rewardRate
            ) /
            (365 days * 100);

        return reward;
    }

    function claimReward()
        public
    {
        uint256 reward =
            calculateReward(
                msg.sender
            );

        require(
            reward > 0,
            "No rewards"
        );

        stakingTime[msg.sender] =
            block.timestamp;

        payable(msg.sender)
            .transfer(reward);
    }

    function withdraw(
        uint256 amount
    )
        public
    {
        require(
            balances[msg.sender]
                >= amount,
            "Insufficient balance"
        );

        balances[msg.sender]
            -= amount;

        payable(msg.sender)
            .transfer(amount);
    }

    function getBalance(
        address user
    )
        public
        view
        returns(uint256)
    {
        return balances[user];
    }
}