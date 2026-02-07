const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const { AUC } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
  const auction = await hre.ethers.getContractAt("Auction", AUC);

  const auctionId = 1;

  console.log("Ending auction...");
  const tx = await auction.endAuction(auctionId);
  const receipt = await tx.wait();

  console.log("Ended ✅ tx:", receipt.hash);

  const a = await auction.auctions(auctionId);
  console.log("ended =", a.ended);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
