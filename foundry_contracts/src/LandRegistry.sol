// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LandRegistry {
    struct Land {
        User owner;
        string addressOfLand;
        User registeredBy;
        uint256 registryDateAndTime;
        uint256 area;
        uint256 landId;
        bool isForSale;
        uint256 price;
    }

    struct User {
        address userAddress;
        string name;
        string email;
        string phone;
        string aadhar;
        bool isRegistered;
    }

    mapping(string => uint256) private landExists;
    mapping(uint256 => Land) public lands;
    mapping(address => User) public users;
    mapping(address => bool) public userExists;
    uint256 public landCount;

    event LandRegistered(
        uint256 indexed landId,
        address owner,
        string addressOfLand,
        address registeredBy,
        uint256 registryDateAndTime,
        uint256 area
    );

    event UserRegistered(
        address indexed userAddress,
        string name,
        string email,
        string phone,
        string aadhar
    );

    event UserUpdated(
        address indexed userAddress,
        string name,
        string email,
        string phone,
        string aadhar
    );

    event LandListedForSale(
        uint256 indexed landId,
        address owner,
        uint256 price
    );

    event LandSaleCancelled(
        uint256 indexed landId,
        address owner
    );

    event LandPurchased(
        uint256 indexed landId,
        address oldOwner,
        address newOwner,
        uint256 price,
        uint256 timestamp
    );

    function registerUser(
        string memory _name,
        string memory _email,
        string memory _phone,
        string memory _aadhar
    ) external {
        require(!userExists[msg.sender], "User already registered");
        
        User memory newUser = User({
            userAddress: msg.sender,
            name: _name,
            email: _email,
            phone: _phone,
            aadhar: _aadhar,
            isRegistered: true
        });
        
        users[msg.sender] = newUser;
        userExists[msg.sender] = true;
        
        emit UserRegistered(msg.sender, _name, _email, _phone, _aadhar);
    }
    
    function updateUser(
        string memory _name,
        string memory _email,
        string memory _phone,
        string memory _aadhar
    ) external {
        require(userExists[msg.sender], "User not registered");
        
        User storage user = users[msg.sender];
        user.name = _name;
        user.email = _email;
        user.phone = _phone;
        user.aadhar = _aadhar;
        
        emit UserUpdated(msg.sender, _name, _email, _phone, _aadhar);
    }

    function registerLand(string memory addressOfLand, uint256 _area) external {
        require(landExists[addressOfLand] == 0, "Land with this address already exists");
        require(userExists[msg.sender], "User not registered");
        
        landCount++;
        uint256 landId = landCount;
        
        lands[landId] = Land({
            owner: users[msg.sender],
            addressOfLand: addressOfLand,
            registeredBy: users[msg.sender],
            registryDateAndTime: block.timestamp,
            area: _area,
            landId: landId,
            isForSale: false,
            price: 0
        });
        
        landExists[addressOfLand] = landId;
        
        emit LandRegistered(landId, msg.sender, addressOfLand, msg.sender, block.timestamp, _area);
    }

    function listLandForSale(uint256 _landId, uint256 _price) external {
        require(_landId > 0 && _landId <= landCount, "Invalid land ID");
        require(_price > 0, "Price must be greater than 0");
        require(lands[_landId].owner.userAddress == msg.sender, "Only the owner can list land for sale");
        require(!lands[_landId].isForSale, "Land is already for sale");
        
        lands[_landId].isForSale = true;
        lands[_landId].price = _price;
        
        emit LandListedForSale(_landId, msg.sender, _price);
    }
    
    function cancelLandSale(uint256 _landId) external {
        require(_landId > 0 && _landId <= landCount, "Invalid land ID");
        require(lands[_landId].owner.userAddress == msg.sender, "Only the owner can cancel the sale");
        require(lands[_landId].isForSale, "Land is not for sale");
        
        lands[_landId].isForSale = false;
        lands[_landId].price = 0;
        
        emit LandSaleCancelled(_landId, msg.sender);
    }
    
    function buyLand(uint256 _landId) external payable {
        require(_landId > 0 && _landId <= landCount, "Invalid land ID");
        require(userExists[msg.sender], "User not registered");
        require(lands[_landId].isForSale, "Land is not for sale");
        require(lands[_landId].owner.userAddress != msg.sender, "Owner cannot buy their own land");
        require(msg.value >= lands[_landId].price, "Insufficient funds sent");
        
        address payable seller = payable(lands[_landId].owner.userAddress);
        uint256 price = lands[_landId].price;
        
        // Update land ownership
        Land storage land = lands[_landId];
        address oldOwner = land.owner.userAddress;
        land.owner = users[msg.sender];
        land.isForSale = false;
        land.price = 0;
        
        // Transfer funds to seller
        seller.transfer(price);
        
        // Refund excess payment if any
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit LandPurchased(_landId, oldOwner, msg.sender, price, block.timestamp);
    }
    
    function getLandsForSale() external view returns (uint256[] memory) {
        uint256 forSaleCount = 0;
        
        // Count lands for sale
        for (uint256 i = 1; i <= landCount; i++) {
            if (lands[i].isForSale) {
                forSaleCount++;
            }
        }
        
        // Create array of land IDs that are for sale
        uint256[] memory forSaleLands = new uint256[](forSaleCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= landCount; i++) {
            if (lands[i].isForSale) {
                forSaleLands[index] = i;
                index++;
            }
        }
        
        return forSaleLands;
    }
}