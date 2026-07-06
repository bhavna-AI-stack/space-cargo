export const CONTRACT_ADDRESS =
"0xa124542Ac0039E7288FD103fdd12efe8d4f35Da3";

export const ABI = [
  "function stake() payable",
  "function withdraw(uint256 amount)",
  "function getBalance(address user) view returns(uint256)",
  "function calculateReward(address user) view returns(uint256)",
  "function claimReward()"
];