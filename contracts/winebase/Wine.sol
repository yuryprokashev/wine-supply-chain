pragma solidity ^0.4.24;

contract Wine {
    address contractOwner;
    uint lastGrapeId;
    uint lastBottleId;
    uint lastFarmId;

    // Location will be simple value object, that encapsulates location related info
    struct Location {
        string longitude;
        string latitude;
        string name;
    }

    // We are in wine business, so we have the Farm
    struct Farm {
        uint farmId;
        string name;
        address owner;
        Location location;
    }
    mapping (uint => Farm) farms;
    event FarmCreated(uint farmId);

    enum GrapeState {Harvested, Pressed, Fermented}
    struct WineGrape {
        uint grapeId; // id of the Wine Grape vintage
        string name;
        uint vintageYear;
        address owner;
        GrapeState state;
        Farm farm;
    }
    mapping (uint => WineGrape) grapes;
    event GrapeHarvested(uint grapeId);
    event GrapePressed(uint grapeId);
    event GrapeFermented(uint grapeId);

    enum BottleState {Owned, ForSale, Sold, Shipped, Consumed}
    struct BottleOfWine {
        uint sku; // id of the Bottle
        WineGrape grape;
        uint price;
        BottleState state;
        address buyer;
        address owner; // it will replace odd seller and buyer properties of the Bottle
    }
    mapping (uint => BottleOfWine) bottles;
    event BottleOwned(uint sku);
    event BottleForSale(uint sku);
    event BottleSold(uint sku);
    event BottleShipped(uint sku);
    event BottleConsumed(uint sku);

    modifier verifyCallerIs(address _address){
        require(msg.sender == _address, "Current caller can not invoke this operation.");
        _;
    }

    modifier verifyCallerIsNot(address _address) {
        require(msg.sender != _address, "Current caller can not invoke this operation.");
        _;
    }

    modifier farmExists(uint _farmId) {
        require(farms[_farmId].farmId > 0, "Farm with this id does not exist.");
        _;
    }

    modifier grapeExists(uint _grapeId) {
        require(grapes[_grapeId].grapeId > 0, "Grape with this id does not exists.");
        _;
    }

    modifier verifyGrapeState(uint _grapeId, GrapeState _state) {
        require(grapes[_grapeId].state == _state, "Current grape state forbids this operation.");
        _;
    }

    modifier bottleExists(uint _sku) {
        require(bottles[_sku].sku > 0, "Bottle with given SKU does not exists.");
        _;
    }

    modifier verifyBottleState(uint _sku, BottleState _state) {
        require(bottles[_sku].state == _state, "Current bottle state forbids this operation");
        _;
    }

    modifier priceNotZero(uint _price) {
        require(_price > 0, "Price can not be zero.");
        _;
    }

    modifier isPaidEnough(uint _price) {
        require(msg.value >= _price, "Bid price must be more or equal to bottle's price");
        _;
    }

    modifier returnChangeForExcess(uint _sku) {
        _;
        uint _price = bottles[_sku].price;
        uint change = msg.value - _price;
        bottles[_sku].buyer.transfer(change);
    }

    constructor() public {
        contractOwner = msg.sender;
        lastGrapeId = 0;
        lastBottleId = 0;
        lastFarmId = 0;
    }

    // Farm Transactions
    function registerFarm(string _farmName, string _locationName, string _locationLong, string _locationLat) public
    {
        lastFarmId = lastFarmId + 1;
        location = Location({name: _locationName, longitude: _locationLong, latitude: _locationLat});
        farms[lastFarmId] = Farm({farmId: lastFarmId, name: _farmName, location: location, owner: msg.sender});
        emit FarmCreated(lastFarmId);
    }
    function getFarm(uint _farmId) public view
    farmExists(_farmId)
    returns (uint farmId, string name, string locationName, string longitude, string latidude, address owner){
        farmId = farms[_farmId].farmId;
        name = farms[_farmId].name;
        locationName = farms[_farmId].location.name;
        longitude = farms[_farmId].location.longitude;
        latitude = farms[_farmId].location.latitude;
        owner = farms[_farmId].owner;
    }

    // Grapes Transactions
    function harvestGrape(string _name, uint _vintageYear, uint farmId) public
    verifyCallerIs(contractOwner) {
        lastGrapeId = lastGrapeId + 1;
        grapes[lastGrapeId] = WineGrape(
            {grapeId: lastGrapeId,
            name: _name,
            vintageYear: _vintageYear,
            owner: msg.sender,
            state: GrapeState.Harvested});
        emit GrapeHarvested(lastGrapeId);
    }

    function pressGrape(uint _grapeId) public
    grapeExists(_grapeId)
    verifyGrapeState(_grapeId, GrapeState.Harvested)
    verifyCallerIs(grapes[_grapeId].owner) {
        grapes[_grapeId].state = GrapeState.Pressed;
        emit GrapePressed(_grapeId);
    }

    function fermentGrape(uint _grapeId) public
    grapeExists(_grapeId)
    verifyGrapeState(_grapeId, GrapeState.Pressed)
    verifyCallerIs(grapes[_grapeId].owner) {
        grapes[_grapeId].state = GrapeState.Fermented;
        emit GrapeFermented(_grapeId);
    }

    function getGrape(uint _grapeId) public view
    grapeExists(_grapeId)
    returns (uint grapeId, string name, uint vintageYear, string state){
        grapeId = _grapeId;
        name = grapes[_grapeId].name;
        vintageYear = grapes[_grapeId].vintageYear;
        if(uint(grapes[_grapeId].state) == 0) {
            state = "Harvested";
        }
        if(uint(grapes[_grapeId].state) == 1) {
            state = "Pressed";
        }
        if(uint(grapes[_grapeId].state) == 2) {
            state = "Fermented";
        }
    }

    // Bottle Transactions
    function createBottle(uint _grapeId) public
    grapeExists(_grapeId)
    verifyGrapeState(_grapeId, GrapeState.Fermented)
    verifyCallerIs(grapes[_grapeId].owner)   {
        lastBottleId = lastBottleId + 1;
        bottles[lastBottleId] = BottleOfWine(
            {grape: grapes[_grapeId], sku: lastBottleId, price: 0, state: BottleState.Owned, owner: msg.sender, buyer: 0}
        );
        emit BottleOwned(bottles[lastBottleId].sku);
    }

    function addBottleForSale(uint _sku, uint _price) public
    bottleExists(_sku)
    verifyBottleState(_sku, BottleState.Owned)
    priceNotZero(_price)
    verifyCallerIs(bottles[_sku].owner)  {
        bottles[_sku].price = _price;
        bottles[_sku].state = BottleState.ForSale;
        emit BottleForSale(_sku);
    }

    function buyBottle(uint _sku) public payable
    bottleExists(_sku)
    verifyBottleState(_sku, BottleState.ForSale)
    verifyCallerIsNot(bottles[_sku].owner)
    isPaidEnough(bottles[_sku].price)
    returnChangeForExcess(_sku) {
        bottles[_sku].buyer = msg.sender;
        bottles[_sku].state = BottleState.Sold;
        bottles[_sku].owner.transfer(bottles[_sku].price);
        emit BottleSold(_sku);
    }

    function shipBottle(uint _sku) public
    bottleExists(_sku)
    verifyBottleState(_sku, BottleState.Sold)
    verifyCallerIs(bottles[_sku].owner) {
        bottles[_sku].state = BottleState.Shipped;
        emit BottleShipped(_sku);
    }

    function receiveBottle(uint _sku) public
    bottleExists(_sku)
    verifyBottleState(_sku, BottleState.Shipped)
    verifyCallerIs(bottles[_sku].buyer) {
        bottles[_sku].owner = bottles[_sku].buyer;
        bottles[_sku].buyer = 0;
        bottles[_sku].state = BottleState.Owned;
        emit BottleOwned(_sku);
    }

    function consumeBottle(uint _sku) public
    bottleExists(_sku)
    verifyBottleState(_sku, BottleState.Owned)
    verifyCallerIs(bottles[_sku].owner) {
        bottles[_sku].state = BottleState.Consumed;
        emit BottleConsumed(_sku);
    }

    function getBottle(uint _sku) public view
    bottleExists(_sku)
    returns (uint sku, uint price, address owner, address buyer, string state, uint grapeId) {
        sku = _sku;
        price = bottles[_sku].price;
        owner = bottles[_sku].owner;
        buyer = bottles[_sku].buyer;
        grapeId = bottles[_sku].grape.grapeId;

        if(uint(bottles[_sku].state) == 0) {
            state = "Owned";
        }
        if(uint(bottles[_sku].state) == 1) {
            state = "For Sale";
        }
        if(uint(bottles[_sku].state) == 2) {
            state = "Sold";
        }
        if(uint(bottles[_sku].state) == 3) {
            state = "Shipped";
        }
        if(uint(bottles[_sku].state) == 4) {
            state = "Consumed";
        }
    }
}