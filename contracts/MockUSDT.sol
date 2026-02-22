// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Genuine Mainnet Tether (USDT) does NOT support EIP-2612 Permits. 
// We are deploying a legacy ERC-20 contract to perfectly emulate its limitations.
contract MockUSDT is ERC20, Ownable {
    constructor() ERC20("Tether USD", "USDT") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6; // Standard 6 decimals matching genuine USDT
    }
}