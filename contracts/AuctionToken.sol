// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuctionToken is ERC20, Ownable {
    uint256 public constant FEE_PERCENT = 1; 
    uint256 public constant FEE_DIVIDER = 1000;
    event TokensBought(address indexed buyer, uint256 ethSent, uint256 fee, uint256 tokensMinted);
    event WithdrawnFee(address indexed owner, uint256 amount);
    event MinterUpdated(address indexed minter, bool isMinter);
    event RewardMinted(address indexed to, uint256 amount);

    mapping(address => bool) public minters;

    constructor(address initialOwner) 
        ERC20("Auction Token", "AUC")
        Ownable(initialOwner) 
    {}

    function setMinter(address minter, bool isMinter) external onlyOwner {
        minters[minter] = isMinter;
        emit MinterUpdated(minter, isMinter);
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "Not authorized");
        _;
    }

    function mintReward(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
        emit RewardMinted(to, amount);
    }

    function buyTokens() external payable {
        require(msg.value > 0, "Send ETH to buy tokens");

        uint256 fee = (msg.value * FEE_PERCENT) / FEE_DIVIDER;
        uint256 tokensToMint = (msg.value - fee) * 1000;

        _mint(msg.sender, tokensToMint);

        emit TokensBought(msg.sender, msg.value, fee, tokensToMint);
    }

    function withdrawFee() external onlyOwner {
        uint256 amount = address(this).balance;
        emit WithdrawnFee(msg.sender, amount);
        payable(owner()).transfer(amount);
    }
}
