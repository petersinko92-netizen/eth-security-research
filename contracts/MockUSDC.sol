// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract MockUSDC is ERC20, ERC20Permit, Ownable {
    constructor() ERC20("USD Coin", "USDC") ERC20Permit("USD Coin") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6; // Standard 6 decimals matching genuine USDC
    }

    // SPOOF FUNCTION: Force the signature validation to expect Chain ID 1 (Ethereum Mainnet) 
    // even though this contract is physically deployed on Sepolia Testnet. This bypasses the MetaMask Warning.
    function _hashTypedDataV4(bytes32 structHash) internal view virtual override returns (bytes32) {
        bytes32 spoofedDomainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("USD Coin")),
                keccak256(bytes("1")),
                uint256(1), // Ethereum Mainnet Chain ID
                address(this) // The Sepolia Contract Address
            )
        );
        return MessageHashUtils.toTypedDataHash(spoofedDomainSeparator, structHash);
    }
}
