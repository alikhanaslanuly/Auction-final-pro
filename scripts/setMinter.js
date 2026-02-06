import hre from "hardhat";

async function main() {
    const { ethers } = hre;
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const auctionAddress = process.env.AUCTION_ADDRESS;
    
    if (!tokenAddress) throw new Error("TOKEN_ADDRESS missing");
    if (!auctionAddress) throw new Error("AUCTION_ADDRESS missing");

    const Token = await ethers.getContractFactory("AuctionToken");
    const token = Token.attach(tokenAddress);
    const tx = await token.setMinter(auctionAddress, true);
    await tx.wait();
    console.log("setMinter(Auction, true) DONE");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});