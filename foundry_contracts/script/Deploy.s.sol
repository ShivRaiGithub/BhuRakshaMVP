// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import "../src/LandRegistry.sol";

contract DeployAndInitializeProduction is Script {
    LandRegistry landRegistry;
    function run() external returns(LandRegistry) {
        vm.startBroadcast(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);
        
        landRegistry = new LandRegistry();
        landRegistry.registerUser(
            "Main User",
            "main.user@example.com",
            "+1-555-123-4567",
            "111122223333"
        );
        
        landRegistry.updateUser(
            "Main User Updated",
            "updated.main@example.com",
            "+1-555-999-8888",
            "111122223333"
        );
        
        landRegistry.registerLand("123 Main St, Anytown", 1000);
        landRegistry.registerLand("456 Oak Ave, Somewhere", 1500);
        landRegistry.registerLand("789 Pine Rd, Nowhere", 2000);
        landRegistry.registerLand("101 River Dr, Riverside", 1200);
        landRegistry.registerLand("202 Mountain Rd, Hillside", 1800);
        
        landRegistry.listLandForSale(1, 5 ether);
        landRegistry.listLandForSale(2, 7.5 ether);
        landRegistry.listLandForSale(3, 6.2 ether);
        
        landRegistry.cancelLandSale(2);
        
        landRegistry.getLandsForSale();
        
        vm.stopBroadcast();
        return landRegistry;
    }
}

// forge script script/Deploy.s.sol --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url 127.0.0.1:8545 --broadcast