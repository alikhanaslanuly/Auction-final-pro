import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL!,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY!]
    },
    holesky: {
      url: process.env.HOLESKY_RPC_URL!,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY!]
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};

export default config;
