const hre = require("hardhat");

async function main() {

  const RPS = await hre.ethers.getContractFactory("RPSMinusOne");

  // Constructor parameters
  const minimumBet = hre.ethers.parseEther("0.01");
  const withdrawThreshold = hre.ethers.parseEther("0.02");
  const withdrawFee = 2; // percent

  const contract = await RPS.deploy(
    minimumBet,
    withdrawThreshold,
    withdrawFee
  );

  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
