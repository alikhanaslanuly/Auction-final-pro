// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAuctionToken is IERC20 {
    function mintReward(address to, uint256 amount) external;
}

contract Auction is ReentrancyGuard {
    IAuctionToken public immutable token;

    uint256 public auctionCount;
    uint256 public immutable bidRewardPercent; 
    uint256 public immutable winnerBonus;

    struct AuctionData {
        string item;
        uint256 startPrice;     
        uint256 endTime;        
        bool ended;

        address seller;

        address highestBidder;
        uint256 highestBid;
    }

    mapping(uint256 => AuctionData) public auctions;

    mapping(uint256 => mapping(address => uint256)) public pendingReturns;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        string item,
        uint256 startPrice,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid,
        address indexed seller,
        uint256 bonusMinted
    );

    event RefundWithdrawn(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "Token address is zero");
        require(bidRewardPercent <= 2000, "Reward too high");
        token = IAuctionToken(tokenAddress);
    }

    function createAuction(
        string calldata item,
        uint256 startPrice,
        uint256 durationSeconds
    ) external returns (uint256 auctionId) {
        require(bytes(item).length > 0, "Item is empty");
        require(startPrice > 0, "Start price must be > 0");
        require(durationSeconds > 0, "Duration must be > 0");

        auctionId = ++auctionCount;

        AuctionData storage a = auctions[auctionId];
        a.item = item;
        a.startPrice = startPrice;
        a.endTime = block.timestamp + durationSeconds;
        a.ended = false;
        a.seller = msg.sender;

        emit AuctionCreated(auctionId, msg.sender, item, startPrice, a.endTime);
    }

    function placeBid(uint256 auctionId, uint256 amount) external nonReentrant {
        AuctionData storage a = auctions[auctionId];

        require(auctionId > 0 && auctionId <= auctionCount, "Auction not found");
        require(!a.ended, "Auction already ended");
        require(block.timestamp < a.endTime, "Auction deadline passed");
        require(amount >= a.startPrice, "Bid below start price");
        require(amount > a.highestBid, "Bid not high enough");

        bool ok = token.transferFrom(msg.sender, address(this), amount);
        require(ok, "transferFrom failed");

        if (a.highestBidder != address(0)) {
            pendingReturns[auctionId][a.highestBidder] += a.highestBid;
        }

        a.highestBidder = msg.sender;
        a.highestBid = amount;

        uint256 rewardMinted = 0;
        if (bidRewardPercent > 0) {
            rewardMinted = (amount * bidRewardPercent) / 10000;
            token.mintReward(msg.sender, rewardMinted);
        }

        emit BidPlaced(auctionId, msg.sender, amount);
    }

    function endAuction(uint256 auctionId) external nonReentrant {
        AuctionData storage a = auctions[auctionId];

        require(auctionId > 0 && auctionId <= auctionCount, "Auction not found");
        require(!a.ended, "Auction already ended");
        require(block.timestamp >= a.endTime, "Auction not yet ended");

        a.ended = true;

        if (a.highestBidder != address(0) && a.highestBid > 0) {
            bool ok = token.transfer(a.seller, a.highestBid);
            require(ok, "transfer to seller failed");
        }

        uint256 bonusMinted = 0;
        if (a.highestBidder != address(0) && winnerBonus > 0) {
            bonusMinted = winnerBonus;
            token.mintReward(a.highestBidder, bonusMinted);
        }

        emit AuctionEnded(auctionId, a.highestBidder, a.highestBid, a.seller, bonusMinted);
    }

    function withdrawRefund(uint256 auctionId) external nonReentrant {
        uint256 amount = pendingReturns[auctionId][msg.sender];
        require(amount > 0, "No refund available");

        pendingReturns[auctionId][msg.sender] = 0;

        bool ok = token.transfer(msg.sender, amount);
        require(ok, "refund transfer failed");

        emit RefundWithdrawn(auctionId, msg.sender, amount);
    }

    function isActive(uint256 auctionId) external view returns (bool) {
        AuctionData storage a = auctions[auctionId];
        if (auctionId == 0 || auctionId > auctionCount) return false;
        if (a.ended) return false;
        return block.timestamp < a.endTime;
    }
}
