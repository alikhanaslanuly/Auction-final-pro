const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const { AUC } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
  const auction = await hre.ethers.getContractAt("Auction", AUC);

  const auctionId = 1;
  const bidAmount = hre.ethers.parseEther("12");

  console.log("Placing bid...");
  const tx = await auction.placeBid(auctionId, bidAmount);
  const receipt = await tx.wait();

  console.log("Bid ✅ tx:", receipt.hash);

  const a = await auction.auctions(auctionId);
  console.log("HighestBid:", hre.ethers.formatEther(a.highestBid));
  console.log("HighestBidder:", a.highestBidder);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
