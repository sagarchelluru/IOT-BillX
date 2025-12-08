// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PowerBilling {
    struct Device {
        address owner;
        uint256 energyConsumed;
        uint256 lastReading;
        bool isActive;
    }

    mapping(address => Device) public devices;
    mapping(address => uint256) public balances;

    address public owner;
    uint256 public ratePerUnit = 1 ether; // 1 ETH per unit

    event DeviceRegistered(address indexed device, address indexed owner);
    event EnergyConsumed(address indexed device, uint256 amount);
    event PaymentMade(address indexed payer, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    function registerDevice(address _device, address _owner) public onlyOwner {
        devices[_device] = Device(_owner, 0, block.timestamp, true);
        emit DeviceRegistered(_device, _owner);
    }

    function recordConsumption(address _device, uint256 _energy) public {
        require(devices[_device].isActive, "Device not active");
        devices[_device].energyConsumed += _energy;
        devices[_device].lastReading = block.timestamp;
        uint256 cost = _energy * ratePerUnit;
        balances[devices[_device].owner] += cost;
        emit EnergyConsumed(_device, _energy);
    }

    function payBill() public payable {
        require(balances[msg.sender] > 0, "No outstanding balance");
        require(msg.value >= balances[msg.sender], "Insufficient payment");
        balances[msg.sender] = 0;
        payable(owner).transfer(msg.value);
        emit PaymentMade(msg.sender, msg.value);
    }

    function getBalance(address _user) public view returns (uint256) {
        return balances[_user];
    }

    function getDevice(address _device) public view returns (address, uint256, uint256, bool) {
        Device memory d = devices[_device];
        return (d.owner, d.energyConsumed, d.lastReading, d.isActive);
    }
}
