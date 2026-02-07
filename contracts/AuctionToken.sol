// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuctionToken is ERC20, Ownable {
    address public auctionContract;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    )
        ERC20(name_, symbol_)
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
    }
    function setAuctionContract(address _auction) external onlyOwner {
        require(_auction != address(0), "Auction address is zero");
        auctionContract = _auction;
    }
    function mintReward(address to, uint256 amount) external {
        require(msg.sender == auctionContract, "Only auction can mint");
        _mint(to, amount);
    }
}
