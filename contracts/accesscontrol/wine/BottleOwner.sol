pragma solidity ^0.5.0;

// Import the library 'Roles'
import "../Roles.sol";

// Define a contract 'ConsumerRole' to manage this role - add, remove, check
contract BottleOwner {
    using Roles for Roles.Role;

    // Define 2 events, one for Adding, and other for Removing
    event BottleOwnerAdded(address _address);
    event BottleOwnerRemoved(address _address);

    // Define a struct 'bottle owners' by inheriting from 'Roles' library, struct Role
    Roles.Role private bottleOwners;

    // In the constructor make the address that deploys this contract the 1st grape owner
    constructor() public {
        _addBottleOwner(msg.sender);
    }

    // Define a modifier that checks to see if msg.sender has the appropriate role
    modifier onlyBottleOwner() {
        require(isBottleOwner(msg.sender));
        _;
    }

    // Define a function 'isBottleOwner' to check this role
    function isBottleOwner(address _address) public view returns (bool) {
        return bottleOwners.has(_address);
    }

    // Define a function 'addBottleOwner' that adds this role
    function addBottleOwner(address _address) public onlyBottleOwner {
        _addBottleOwner(_address);
    }

    // Define a function 'renounceBottleOwner' to renounce this role
    function renounceBottleOwner() public {
        _removeBottleOwner(msg.sender);
    }

    // Define an internal function '_addBottleOwner' to add this role, called by 'addConsumer'
    function _addBottleOwner(address _address) internal {
        bottleOwners.add(_address);
        emit BottleOwnerAdded(_address);
    }

    // Define an internal function '_removeConsumer' to remove this role, called by 'removeConsumer'
    function _removeBottleOwner(address _address) internal {
        bottleOwners.remove(_address);
        emit BottleOwnerRemoved(_address);
    }
}