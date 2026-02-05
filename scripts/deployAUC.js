import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const tokenAddress = process.env.TOKEN_ADDRESS;
  if (!tokenAddress) throw new Error("TOKEN_ADDRESS is missing in .env");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Token:", tokenAddress);

  const Auction = await ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(tokenAddress);
  await auction.waitForDeployment();
  console.log("Auction:", auction.target);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
