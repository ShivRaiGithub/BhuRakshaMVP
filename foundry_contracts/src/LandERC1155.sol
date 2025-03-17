// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract LandERC1155 is ERC1155, Ownable(msg.sender) {
    uint256 public constant LAND = 1;

    constructor(string memory uri, address owner) ERC1155(uri) {
        transferOwnership(owner);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, LAND, amount, "");
    }
}
