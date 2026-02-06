import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const BID_REWARD_PERCENT = 5; // 5% от ставки
  const WINNER_BONUS = ethers.parseUnits("50", 18); // 50 токенов (если decimals=18)

  const AuctionToken = await ethers.getContractFactory("AuctionToken");
  const token = await AuctionToken.deploy(deployer.address);
  await token.waitForDeployment();
  console.log("AuctionToken:", token.target);

  const Auction = await ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(token.target, BID_REWARD_PERCENT, WINNER_BONUS);
  await auction.waitForDeployment();
  console.log("Auction:", auction.target);

  const tx = await token.setMinter(auction.target, true);
  await tx.wait();
  console.log("setMinter(Auction, true) done:", tx.hash);

  console.log("TOKEN_ADDRESS =", token.target);
  console.log("AUCTION_ADDRESS =", auction.target);
  console.log("BID_REWARD_PERCENT =", BID_REWARD_PERCENT);
  console.log("WINNER_BONUS =", WINNER_BONUS.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
