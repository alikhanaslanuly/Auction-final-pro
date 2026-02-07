const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const { AUC } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
  const auction = await hre.ethers.getContractAt("Auction", AUC);

  console.log("Creating auction...");
  const tx = await auction.createAuction(
    "Test Item",
    hre.ethers.parseEther("10"),
    hre.ethers.parseEther("50"),
    300
  );
  const receipt = await tx.wait();

  console.log("CreateAuction ✅ tx:", receipt.hash);
  console.log("auctionCount =", (await auction.auctionCount()).toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
