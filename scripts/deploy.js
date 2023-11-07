const hre = require("hardhat");

async function main() {
  const dao = await hre.ethers.deployContract("DAO");

  await dao.waitForDeployment();

  const contractAddress = await dao.getAddress();

  console.log(
    `Deployed contract address: ${contractAddress}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
