# Auction Final (Solidity Part)

Auction smart contract:
- createAuction
- placeBid (ERC20 transferFrom)
- endAuction
- withdrawRefund (pull payments)
- reentrancy-safe (ReentrancyGuard)

## Setup
npm i
npx hardhat compile

## Deploy (Sepolia)
Create .env using .env.example and set:
SEPOLIA_RPC_URL=
SEPOLIA_PRIVATE_KEY=
TOKEN_ADDRESS=

Then:
npx hardhat run scripts/deployAUC.js --network sepolia
