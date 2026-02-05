let provider, signer, auction;

const AUCTION_ADDRESS = "0xВАШ_АДРЕС";
const ABI = [
  "function getAuction() view returns (string,uint256,address,uint256,bool)",
  "function placeBid() payable",
  "function endAuction()"
];

document.getElementById("connectBtn").onclick = connect;
document.getElementById("bidBtn").onclick = bid;
document.getElementById("endBtn").onclick = end;

async function connect() {
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  auction = new ethers.Contract(AUCTION_ADDRESS, ABI, signer);
  load();
}

async function load() {
  const [item, price, leader, deadline] = await auction.getAuction();

  document.getElementById("item").innerText = item;
  document.getElementById("price").innerText = ethers.formatEther(price);
  document.getElementById("leader").innerText = leader;
  document.getElementById("deadline").innerText =
    new Date(Number(deadline) * 1000).toLocaleString();
}

async function bid() {
  const eth = document.getElementById("bidInput").value;
  const tx = await auction.placeBid({
    value: ethers.parseEther(eth)
  });
  document.getElementById("status").innerText = "Tx sent...";
  await tx.wait();
  load();
}

async function end() {
  const tx = await auction.endAuction();
  await tx.wait();
  alert("Auction ended");
}
