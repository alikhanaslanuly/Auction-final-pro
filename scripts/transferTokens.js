import hre from "hardhat";
import { ethers } from "ethers";
import "dotenv/config";
import fs from "fs";

const TO = "0x73CB059771B0ed33F2Ad5141B1779850168211Dc"; 

async function main() {
  const { TOKEN } = JSON.parse(fs.readFileSync("deployed.json", "utf8"));
  const rpc = process.env.SEPOLIA_RPC_URL;
  const provider = new ethers.JsonRpcProvider(rpc, 17000);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);

  const tokenArtifact = await hre.artifacts.readArtifact("AuctionToken");
  const token = new ethers.Contract(TOKEN, tokenArtifact.abi, wallet);

  const tx = await token.transfer(TO, ethers.parseEther("200"));
  await tx.wait();

  console.log("Sent 200 tokens to:", TO);
}
main().catch(console.error);
