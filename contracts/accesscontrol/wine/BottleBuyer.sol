pragma solidity ^0.5.0;

// Import the library 'Roles'
import "../Roles.sol";

// Define a contract 'ConsumerRole' to manage this role - add, remove, check
contract BottleBuyer {
    using Roles for Roles.Role;

    // Define 2 events, one for Adding, and other for Removing
    event BottleBuyerAdded(address _address);
    event BottleBuyerRemoved(address _address);

    // Define a struct 'bottle owners' by inheriting from 'Roles' library, struct Role
    Roles.Role private bottleBuyers;

    // In the constructor make the address that deploys this contract the 1st grape owner
    constructor() public {
        _addBottleBuyer(msg.sender);
    }

    // Define a modifier that checks to see if msg.sender has the appropriate role
    modifier onlyBottleBuyer() {
        require(isBottleBuyer(msg.sender));
        _;
    }

    // Define a function 'isBottleBuyer' to check this role
    function isBottleBuyer(address _address) public view returns (bool) {
        return bottleBuyers.has(_address);
    }

    // Define a function 'addBottleBuyer' that adds this role
    function addBottleBuyer(address _address) public onlyBottleBuyer {
        _addBottleBuyer(_address);
    }

    // Define a function 'renounceBottleBuyer' to renounce this role
    function renounceBottleBuyer() public {
        _removeBottleBuyer(msg.sender);
    }

    // Define an internal function '_addBottleBuyer' to add this role, called by 'addConsumer'
    function _addBottleBuyer(address _address) internal {
        bottleBuyers.add(_address);
        emit BottleBuyerAdded(_address);
    }

    // Define an internal function '_removeConsumer' to remove this role, called by 'removeConsumer'
    function _removeBottleBuyer(address _address) internal {
        bottleBuyers.remove(_address);
        emit BottleBuyerRemoved(_address);
    }
}