pragma solidity ^0.5.0;

// Import the library 'Roles'
import "../Roles.sol";

// Define a contract 'ConsumerRole' to manage this role - add, remove, check
contract GrapeOwner {
    using Roles for Roles.Role;

    // Define 2 events, one for Adding, and other for Removing
    event GrapeOwnerAdded(address _address);
    event GrapeOwnerRemoved(address _address);

    // Define a struct 'grape owners' by inheriting from 'Roles' library, struct Role
    Roles.Role private grapeOwners;

    // In the constructor make the address that deploys this contract the 1st grape owner
    constructor() public {
        _addGrapeOwner(msg.sender);
    }

    // Define a modifier that checks to see if msg.sender has the appropriate role
    modifier onlyGrapeOwner() {
        require(isGrapeOwner(msg.sender));
        _;
    }

    // Define a function 'isGrapeOwner' to check this role
    function isGrapeOwner(address _address) public view returns (bool) {
        return grapeOwners.has(_address);
    }

    // Define a function 'addGrapeOwner' that adds this role
    function addGrapeOwner(address _address) public onlyGrapeOwner {
        _addGrapeOwner(_address);
    }

    // Define a function 'renounceGrapeOwner' to renounce this role
    function renounceGrapeOwner() public {
        _removeGrapeOwner(msg.sender);
    }

    // Define an internal function '_addGrapeOwner' to add this role, called by 'addConsumer'
    function _addGrapeOwner(address _address) internal {
        grapeOwners.add(_address);
        emit GrapeOwnerAdded(_address);
    }

    // Define an internal function '_removeConsumer' to remove this role, called by 'removeConsumer'
    function _removeGrapeOwner(address _address) internal {
        grapeOwners.remove(_address);
        emit GrapeOwnerRemoved(_address);
    }
}