import { ethers } from "hardhat";

async function main() {

  const vault = await ethers.deployContract("Vault");

  await vault.waitForDeployment();

  console.log(
    `vault deployed to ${vault.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
