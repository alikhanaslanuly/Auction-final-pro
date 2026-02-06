const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    const Token = await hre.ethers.getContractFactory("AuctionToken");
    const token = await Token.deploy(deployer.address);

    await token.waitForDeployment();
    const addr = await token.getAddress();
    console.log("AuctionToken deployed to:", addr);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
