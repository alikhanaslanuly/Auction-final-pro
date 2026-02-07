const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy Token
  const Token = await hre.ethers.getContractFactory("AuctionToken");
  const token = await Token.deploy(
    "AuctionToken",
    "ATK",
    hre.ethers.parseEther("1000000")
  );
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("TOKEN_ADDRESS =", tokenAddress);

  // Deploy Auction
  const Auction = await hre.ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(
    tokenAddress,
    5,
    hre.ethers.parseEther("100")
  );
  await auction.waitForDeployment();

  const auctionAddress = await auction.getAddress();
  console.log("AUCTION_ADDRESS =", auctionAddress);

  // Link token -> auction
  const tx = await token.setAuctionContract(auctionAddress);
  await tx.wait();

  console.log("Linked token to auction ✅");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
