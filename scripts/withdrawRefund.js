import hre from "hardhat";
import { ethers } from "ethers";
import "dotenv/config";
import fs from "fs";

async function main() {
  const { AUC } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);

  const auctionArtifact = await hre.artifacts.readArtifact("Auction");
  const auction = new ethers.Contract(AUC, auctionArtifact.abi, wallet);

  const auctionId = 1;

  console.log("Withdrawing refund...");
  const tx = await auction.withdrawRefund(auctionId);
  const receipt = await tx.wait();
  console.log("Refund withdrawn ✅ tx:", receipt.hash);
}

main().catch(console.error);
