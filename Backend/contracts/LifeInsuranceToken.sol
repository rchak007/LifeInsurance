// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LifeInsuranceToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}



// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
// import "@openzeppelin/contracts/access/AccessControl.sol";

// contract LifeInsuranceToken is ERC20, ERC20Burnable, AccessControl {
//     bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

//     // Arrays and mappings to manage holders
//     address[] private holders;
//     mapping(address => bool) private isHolder;
//     mapping(address => uint256) private holderIndex;

//     constructor(string memory name, string memory symbol) ERC20(name, symbol) {
//         _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
//         _grantRole(MINTER_ROLE, msg.sender);
//     }

//     function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
//         _mint(to, amount);
//         addHolder(to);
//     }

//     function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
//         super._beforeTokenTransfer(from, to, amount);  // Ensure this super call is valid with your version or remove it if causing issues

//         if (from != to) {
//             if (amount > 0 && balanceOf(to) == 0) {
//                 addHolder(to);
//             }
//             if (balanceOf(from) == amount) {
//                 removeHolder(from);
//             }
//         }
//     }

//     // Add a holder if not already in the array
//     function addHolder(address holder) private {
//         if (!isHolder[holder]) {
//             holders.push(holder);
//             holderIndex[holder] = holders.length - 1;
//             isHolder[holder] = true;
//         }
//     }

//     // Remove a holder if they no longer have tokens
//     function removeHolder(address holder) private {
//         if (isHolder[holder] && balanceOf(holder) == 0) {
//             address lastHolder = holders[holders.length - 1];
//             holders[holderIndex[holder]] = lastHolder;
//             holderIndex[lastHolder] = holderIndex[holder];
//             holders.pop();
//             isHolder[holder] = false;
//         }
//     }

//     // Accessor to get all token holders
//     function getAllTokenHolders() public view returns (address[] memory) {
//         return holders;
//     }
// }
