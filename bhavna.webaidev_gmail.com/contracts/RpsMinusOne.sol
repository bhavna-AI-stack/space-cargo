// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RPSMinusOne {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    uint256 public withdrawThreshold;
    uint256 public minimumBet;
    uint256 public withdrawFee; // in percentage(%)

    constructor(
        uint256 _minimumBet,
        uint256 _withdrawThreshold,
        uint256 _withdrawFee
    ) {
        owner = msg.sender;
        minimumBet = _minimumBet;
        withdrawThreshold = _withdrawThreshold;
        withdrawFee = _withdrawFee;
    }

    // ---------------- GAME STRUCT ----------------
    struct Game {
        uint256 betAmount;
        uint8[2] playerMoves;
        uint8[2] contractMoves;
        bool active;
    }

    struct GameResult {
        uint8 playerMove;
        uint8 opponentMove;
        uint8 result; // 0 = lose, 1 = win, 2 = tie
        uint256 betAmount;
    }

    // ---------------- OWNER SETTINGS ----------------

    function setMinimumBet(uint256 _newMinimumBet) external onlyOwner {
    require(_newMinimumBet > 0, "Invalid minimum bet");
    minimumBet = _newMinimumBet;
    emit MinimumBetUpdated(_newMinimumBet);
    }

    function setWithdrawThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold > 0, "Invalid threshold");
        withdrawThreshold = _newThreshold;
        emit WithdrawThresholdUpdated(_newThreshold);
    }

    function setWithdrawFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 20, "Fee too high"); // fee range from 0-20%
        withdrawFee = _newFee;
        emit WithdrawFeeUpdated(_newFee);
    }

    // ---------------- MAPPING FOR STORAGE ----------------
    mapping(address => Game) public games;
    mapping(address => uint256) public rewards;

    mapping(address => GameResult[5]) public recentGames;
    mapping(address => uint8) public gameCounts;

    // ---------------- EVENTS ----------------
    event GameStarted(address player, uint8[2] playerMoves, uint8[2] contractMoves);
    event GameFinished(address player, uint8 playerFinalMove, uint8 opponentFinalMove, uint8 result);
    event Withdrawal(address player, uint256 payout, uint256 fee);
    event TreasuryFunded(address from, uint256 amount);
    event TreasuryWithdrawal(uint256 amount);
    event MinimumBetUpdated(uint256 newMinimumBet);
    event WithdrawThresholdUpdated(uint256 newWithdrawThreshold);
    event WithdrawFeeUpdated(uint256 newWithdrawFee);

    // ---------------- RANDOM FUNCTION ----------------
    function random(uint256 seed) internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    address(this),
                    seed
                )
            )
        );
    }

    function generateOpponentMoves() internal view returns (uint8[2] memory) {
        uint8 move1 = uint8(random(1) % 3);
        uint8 move2 = uint8(random(2) % 3);

        if (move1 == move2) {
            move2 = (move2 + 1) % 3;
        }

        return [move1, move2];
    }

    // ---------------- START GAME ----------------
    function startGame(uint8 move1, uint8 move2) external payable {

        require(move1 <= 2 && move2 <= 2, "Invalid move");
        require(move1 != move2, "Moves must be different");
        require(msg.value >= minimumBet, "Bet too small");
        require(!games[msg.sender].active, "Finish current game first");

        uint8[2] memory contractMoves = generateOpponentMoves();

        games[msg.sender] = Game({
            betAmount: msg.value,
            playerMoves: [move1, move2],
            contractMoves: contractMoves,
            active: true
        });

        emit GameStarted(msg.sender, [move1, move2], contractMoves);
    }

    // ---------------- FINISH GAME ----------------
    function finishGame(uint8 finalMoveIndex) external {

        Game storage game = games[msg.sender];

        require(game.active, "No active game");
        require(finalMoveIndex < 2, "Invalid move index");

        uint8 playerFinalMove = game.playerMoves[finalMoveIndex];
        uint8 opponentFinalMove = game.contractMoves[random(3) % 2];

        uint8 result = getResult(playerFinalMove, opponentFinalMove);

        // WIN
        if (result == 1) {
            uint256 reward = game.betAmount * 2;
            require(address(this).balance >= reward, "Treasury insufficient");
            rewards[msg.sender] += reward;
        }

        // TIE
        else if (result == 2) {
            uint256 tieAmount = (game.betAmount * 80) / 100;
            require(address(this).balance >= tieAmount, "Treasury insufficient");
            rewards[msg.sender] += tieAmount;
        }

        // Store last 5 games
        uint8 index = gameCounts[msg.sender] % 5;

        recentGames[msg.sender][index] = GameResult({
            playerMove: playerFinalMove,
            opponentMove: opponentFinalMove,
            result: result,
            betAmount: game.betAmount
        });

        gameCounts[msg.sender]++;

        emit GameFinished(msg.sender, playerFinalMove, opponentFinalMove, result);

        delete games[msg.sender];
    }

    // ---------------- WITHDRAW ----------------
    function withdraw() external {

        uint256 amount = rewards[msg.sender];
        require(amount >= withdrawThreshold, "Below withdraw threshold");

        rewards[msg.sender] = 0;

        uint256 fee = (amount * withdrawFee) / 100;
        uint256 payout = amount - fee;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");

        // Fee remains in treasury

        emit Withdrawal(msg.sender, payout, fee);
    }

    // ---------------- FUND TREASURY ----------------
    function fundTreasury() external payable {
        emit TreasuryFunded(msg.sender, msg.value);
    }

    // ---------------- OWNER TREASURY WITHDRAW ----------------
    function withdrawTreasury(uint256 amount) external onlyOwner {

        require(amount <= address(this).balance, "Insufficient treasury");

        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Treasury transfer failed");

        emit TreasuryWithdrawal(amount);
    }

    // ---------------- RESULT LOGIC ----------------
    function getResult(uint8 player, uint8 opponent) internal pure returns (uint8) {
        if (player == opponent) return 2;

        if (
            (player == 0 && opponent == 2) ||
            (player == 1 && opponent == 0) ||
            (player == 2 && opponent == 1)
        ) return 1;

        return 0;
    }
}
