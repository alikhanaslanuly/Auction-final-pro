

const CONFIG = {
  CHAIN_ID: 11155111, 
  CHAIN_HEX: "0xaa36a7",
  CHAIN_NAME: "Sepolia",
  TOKEN_ADDRESS: "0x737a457bB4dc7D4AC464f70d54E93FfA20A9B058",
  AUCTION_ADDRESS: "0xD45E56b946c797d4B03046B147048Fb1D1b1E64b",
};


const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
];

const AUCTION_ABI = [
  "function auctionCount() view returns (uint256)",
  "function auctions(uint256) view returns (string item,uint256 startPrice,uint256 goal,uint256 endTime,bool ended,address seller,address highestBidder,uint256 highestBid)",
  "function pendingReturns(uint256,address) view returns (uint256)",
  "function createAuction(string item,uint256 startPrice,uint256 goal,uint256 durationSeconds) returns (uint256)",
  "function placeBid(uint256 auctionId,uint256 amount)",
  "function withdrawRefund(uint256 auctionId)",
  "function endAuction(uint256 auctionId)",
  "function isActive(uint256 auctionId) view returns (bool)",
];

let provider, signer, userAddress;
let token, auction;
let tokenDecimals = 18;

const el = (id) => document.getElementById(id);

function setStatus(msg) {
  el("status").textContent = msg;
}

function shortAddr(a) {
  if (!a) return "—";
  return a.slice(0, 6) + "…" + a.slice(-4);
}

function fmt(n, decimals = 18) {
  try {
    return ethers.formatUnits(n, decimals);
  } catch {
    return String(n);
  }
}

async function requireMetaMask() {
  if (!window.ethereum) {
    throw new Error("MetaMask не найден. Установи расширение MetaMask в браузер.");
  }
}

async function ensureSepolia() {
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  el("pillNetwork").textContent = `Network: ${chainId === CONFIG.CHAIN_HEX ? "Sepolia" : chainId}`;

  if (chainId !== CONFIG.CHAIN_HEX) {
    throw new Error(`Нужна сеть Sepolia. Переключись в MetaMask на Sepolia и нажми Refresh.`);
  }
}

async function connect() {
  await requireMetaMask();


  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  userAddress = accounts?.[0];
  if (!userAddress) throw new Error("Не удалось получить аккаунт из MetaMask.");

  await ensureSepolia();

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  token = new ethers.Contract(CONFIG.TOKEN_ADDRESS, TOKEN_ABI, signer);
  auction = new ethers.Contract(CONFIG.AUCTION_ADDRESS, AUCTION_ABI, signer);

  tokenDecimals = await token.decimals();

  el("pillAddress").textContent = shortAddr(userAddress);

  setStatus("Connected ✅");
  await refreshTokenPanel();
  await refreshAuctions();
}

async function refreshTokenPanel() {
  if (!token || !auction || !userAddress) return;

  el("tokenAddr").textContent = CONFIG.TOKEN_ADDRESS;
  el("auctionAddr").textContent = CONFIG.AUCTION_ADDRESS;

  const [bal, allow] = await Promise.all([
    token.balanceOf(userAddress),
    token.allowance(userAddress, CONFIG.AUCTION_ADDRESS),
  ]);

  el("tokenBal").textContent = `${fmt(bal, tokenDecimals)} ATK`;
  el("tokenAllow").textContent = `${fmt(allow, tokenDecimals)} ATK`;
}

async function approve() {
  if (!token) throw new Error("Сначала подключи MetaMask.");

  const raw = el("approveAmount").value.trim();
  if (!raw || Number(raw) <= 0) throw new Error("Введи сумму для approve (например 1000).");

  const amount = ethers.parseUnits(raw, tokenDecimals);

  setStatus("Approve: отправляю транзакцию…");
  const tx = await token.approve(CONFIG.AUCTION_ADDRESS, amount);
  setStatus(`Approve TX: ${tx.hash}`);
  await tx.wait();
  setStatus("Approve ✅");
  await refreshTokenPanel();
}

async function createAuction() {
  if (!auction) throw new Error("Сначала подключи MetaMask.");

  const item = el("item").value.trim();
  const startPriceRaw = el("startPrice").value.trim();
  const goalRaw = el("goal").value.trim();
  const durationRaw = el("duration").value.trim();

  if (!item) throw new Error("Item пустой.");
  if (!startPriceRaw || Number(startPriceRaw) <= 0) throw new Error("Start price должен быть > 0.");
  if (!goalRaw || Number(goalRaw) <= 0) throw new Error("Goal должен быть > 0.");
  if (!durationRaw || Number(durationRaw) <= 0) throw new Error("Duration должен быть > 0.");

  const startPrice = ethers.parseUnits(startPriceRaw, tokenDecimals);
  const goal = ethers.parseUnits(goalRaw, tokenDecimals);
  const duration = BigInt(durationRaw);

  setStatus("CreateAuction: отправляю транзакцию…");
  const tx = await auction.createAuction(item, startPrice, goal, duration);
  setStatus(`Create TX: ${tx.hash}`);
  await tx.wait();
  setStatus("Auction created ✅");
  await refreshAuctions();
}

function tsToClock(ts) {
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleString();
}

async function refreshAuctions() {
  if (!auction) return;

  setStatus("Refreshing auctions…");

  const count = await auction.auctionCount();
  const n = Number(count);

  const list = el("auctionList");
  list.innerHTML = "";

  if (n === 0) {
    list.innerHTML = `<div class="empty">No auctions yet. Create one.</div>`;
    setStatus("Ready.");
    return;
  }

  // грузим все аукционы
  const cards = [];
  for (let id = 1; id <= n; id++) {
    // read struct
    const a = await auction.auctions(id);

    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(a.endTime);
    const active = !a.ended && now < endTime;

    const pending = userAddress
      ? await auction.pendingReturns(id, userAddress)
      : 0n;

    cards.push(renderAuctionCard({
      id,
      item: a.item,
      startPrice: fmt(a.startPrice, tokenDecimals),
      goal: fmt(a.goal, tokenDecimals),
      endTime,
      ended: a.ended,
      active,
      seller: a.seller,
      highestBidder: a.highestBidder,
      highestBid: fmt(a.highestBid, tokenDecimals),
      pending: fmt(pending, tokenDecimals),
    }));
  }

  list.append(...cards);
  setStatus("Ready.");
}

function renderAuctionCard(a) {
  const root = document.createElement("div");
  root.className = "auctionCard";

  const badge = a.ended ? `<span class="badge ended">ENDED</span>` : (a.active ? `<span class="badge live">LIVE</span>` : `<span class="badge">WAIT</span>`);

  root.innerHTML = `
    <div>
      <div class="auctionTitle">
        <h3>#${a.id} · ${escapeHtml(a.item)}</h3>
        ${badge}
      </div>

      <div class="auctionMeta">
        <div class="k">Start price</div><div class="v mono">${a.startPrice} ATK</div>
        <div class="k">Goal</div><div class="v mono">${a.goal} ATK</div>
        <div class="k">Highest bid</div><div class="v mono">${a.highestBid} ATK</div>
        <div class="k">Highest bidder</div><div class="v mono">${shortAddr(a.highestBidder)}</div>
        <div class="k">End time</div><div class="v mono">${tsToClock(a.endTime)}</div>
        <div class="k">Refund for you</div><div class="v mono">${a.pending} ATK</div>
      </div>

      <div class="small">
        Seller: <span class="mono">${shortAddr(a.seller)}</span>
      </div>
    </div>

    <div class="auctionActions">
      <div class="inline">
        <input id="bid_${a.id}" type="number" min="0" step="0.0001" placeholder="Bid amount (ATK)" />
        <button class="btn primary" data-action="bid" data-id="${a.id}">Bid</button>
      </div>

      <div class="inline">
        <button class="btn" data-action="refund" data-id="${a.id}">Withdraw refund</button>
        <button class="btn" data-action="end" data-id="${a.id}">End</button>
      </div>

      <div class="small">
        Bid требует: allowance ≥ bid и bid > highestBid, bid ≥ startPrice, до endTime.
      </div>
    </div>
  `;

  // actions
  root.addEventListener("click", async (e) => {
    const btn = e.target?.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);

    try {
      if (action === "bid") await onBid(id);
      if (action === "refund") await onRefund(id);
      if (action === "end") await onEnd(id);
    } catch (err) {
      setStatus(`Error: ${friendlyError(err)}`);
    }
  });

  return root;
}

async function onBid(auctionId) {
  if (!auction || !token) throw new Error("Сначала подключи MetaMask.");

  const raw = el(`bid_${auctionId}`).value.trim();
  if (!raw || Number(raw) <= 0) throw new Error("Введи сумму ставки (ATK).");

  const bid = ethers.parseUnits(raw, tokenDecimals);

  // проверка allowance
  const allow = await token.allowance(userAddress, CONFIG.AUCTION_ADDRESS);
  if (allow < bid) {
    throw new Error("Недостаточно allowance. Нажми Approve и повтори.");
  }

  setStatus(`Bid #${auctionId}: отправляю транзакцию…`);
  const tx = await auction.placeBid(auctionId, bid);
  setStatus(`Bid TX: ${tx.hash}`);
  await tx.wait();

  setStatus("Bid ✅");
  await refreshTokenPanel();
  await refreshAuctions();
}

async function onRefund(auctionId) {
  if (!auction) throw new Error("Сначала подключи MetaMask.");

  setStatus(`Withdraw refund #${auctionId}: отправляю транзакцию…`);
  const tx = await auction.withdrawRefund(auctionId);
  setStatus(`Refund TX: ${tx.hash}`);
  await tx.wait();

  setStatus("Refund ✅");
  await refreshTokenPanel();
  await refreshAuctions();
}

async function onEnd(auctionId) {
  if (!auction) throw new Error("Сначала подключи MetaMask.");

  setStatus(`End #${auctionId}: отправляю транзакцию…`);
  const tx = await auction.endAuction(auctionId);
  setStatus(`End TX: ${tx.hash}`);
  await tx.wait();

  setStatus("Ended ✅");
  await refreshTokenPanel();
  await refreshAuctions();
}

function friendlyError(err) {
  const msg = err?.shortMessage || err?.message || String(err);
  // частые случаи
  if (msg.includes("user rejected")) return "Ты отменил транзакцию в MetaMask.";
  if (msg.includes("insufficient funds")) return "Не хватает SepoliaETH на газ.";
  return msg;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#039;",
  }[m]));
}

// UI wiring
el("btnConnect").addEventListener("click", async () => {
  try {
    setStatus("Connecting…");
    await connect();
  } catch (err) {
    setStatus(`Error: ${friendlyError(err)}`);
  }
});

el("btnApprove").addEventListener("click", async () => {
  try {
    await ensureSepolia();
    await approve();
  } catch (err) {
    setStatus(`Error: ${friendlyError(err)}`);
  }
});

el("btnCreate").addEventListener("click", async () => {
  try {
    await ensureSepolia();
    await createAuction();
  } catch (err) {
    setStatus(`Error: ${friendlyError(err)}`);
  }
});

el("btnRefresh").addEventListener("click", async () => {
  try {
    await ensureSepolia();
    await refreshTokenPanel();
    await refreshAuctions();
  } catch (err) {
    setStatus(`Error: ${friendlyError(err)}`);
  }
});

// auto update on account/network change
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
}

// init static labels
el("tokenAddr").textContent = CONFIG.TOKEN_ADDRESS;
el("auctionAddr").textContent = CONFIG.AUCTION_ADDRESS;
