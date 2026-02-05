let provider;
let signer;
let auction;

const AUCTION_ADDRESS = "0xВАШ_АДРЕС";
const AUCTION_ABI = [
  "function getAuction() view returns (string,uint256,address,uint256,bool)",
  "function placeBid() payable",
  "function endAuction()"
];

const connectBtn = document.getElementById("connectBtn");
const refreshBtn = document.getElementById("refreshBtn");
const bidBtn = document.getElementById("bidBtn");
const endBtn = document.getElementById("endBtn");

connectBtn.onclick = connect;
refreshBtn.onclick = loadAuction;
bidBtn.onclick = placeBid;
endBtn.onclick = endAuction;

async function connect() {
  if (!window.ethereum) {
    alert("MetaMask not installed");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    alert("Please switch to Sepolia testnet");
    return;
  }

  auction = new ethers.Contract(
    AUCTION_ADDRESS,
    AUCTION_ABI,
    signer
  );

  document.getElementById("account").innerText =
    "Connected: " + await signer.getAddress();

  loadAuction();
}

async function loadAuction() {
  const data = await auction.getAuction();

  document.getElementById("item").innerText = data[0];
  document.getElementById("price").innerText =
    ethers.formatEther(data[1]);
  document.getElementById("leader").innerText = data[2];
  document.getElementById("deadline").innerText =
    new Date(Number(data[3]) * 1000).toLocaleString();
  document.getElementById("status").innerText =
    data[4] ? "Ended" : "Active";
}

async function placeBid() {
  try {
    const eth = document.getElementById("bidAmount").value;

    const tx = await auction.placeBid({
      value: ethers.parseEther(eth)
    });

    document.getElementById("message").innerText =
      "Transaction sent: " + tx.hash;

    await tx.wait();
    document.getElementById("message").innerText =
      "Bid placed successfully";

    loadAuction();
  } catch (e) {
    alert("Bid failed");
  }
}

async function endAuction() {
  try {
    const tx = await auction.endAuction();
    await tx.wait();
    alert("Auction ended");
    loadAuction();
  } catch (e) {
    alert("Only owner can end auction");
  }
}
