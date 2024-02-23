// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract Vault {
    struct Allocation {
        uint timestamp;
        uint amount;
    }

    mapping(address => mapping(address => Allocation)) allocations;

    function allocate(address _to, uint _timestamp) external payable {
        require(msg.sender != address(0), "Address zero detected");
        require(msg.value > 0, "Cannot send zero amount");
        Allocation storage allocation = allocations[msg.sender][_to];
        allocation.amount += msg.value;
        allocation.timestamp = _timestamp;
    }

    function claimAllocation(address _from) external {
        require(msg.sender != address(0), "Address zero detected");

        Allocation storage allocation = allocations[_from][msg.sender];
        uint balance = allocation.amount;
        require(block.timestamp > allocation.timestamp, "Not yet");
        require(balance > 0, "You don't have any allocation");

        allocation.amount = 0;
        allocation.timestamp = 0;
        (bool callSuccess, ) = payable(msg.sender).call{value: balance}("");
        require(callSuccess, "Error");
    }
}
