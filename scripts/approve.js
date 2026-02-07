const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const { TOKEN, AUC } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));

  const token = await hre.ethers.getContractAt("AuctionToken", TOKEN);
  const amount = hre.ethers.parseEther("1000");

  console.log("Approving auction to spend tokens...");
  const tx = await token.approve(AUC, amount);
  await tx.wait();
  console.log("Approve ✅");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
