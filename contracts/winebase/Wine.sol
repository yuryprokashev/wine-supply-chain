pragma solidity ^0.5.0;

contract Wine {
    address contractOwner;
    uint lastGrapeId;
    uint lastBottleUpc;
    uint lastBottleSku;
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
        address payable owner;
        string description;
        Location location;
    }
    mapping (uint => Farm) farms;
    event FarmRegistered(uint farmId);

    enum GrapeState {Harvested, Pressed, Fermented}
    struct WineGrape {
        uint grapeId; // id of the Wine Grape vintage
        string name;
        uint vintageYear;
        address payable owner;
        string notes;
        GrapeState state;
        Farm farm;
    }
    mapping (uint => WineGrape) grapes;
    event GrapeHarvested(uint grapeId);
    event GrapePressed(uint grapeId);
    event GrapeFermented(uint grapeId);

    enum BottleState {Owned, ForSale, Sold, Shipped, Consumed}
    struct BottleOfWine {
        uint upc; // universal product code of the Bottle - the primary key
        uint sku; // stock keeping id - I have no idea, why do we have it, if contract does not use it
        uint productId; // product id is upc + sku - again, I have no idea, why do we have it, if contract does not use it
        WineGrape grape;
        uint price;
        BottleState state;
        address payable buyer;
        address payable owner; // it will replace odd seller and buyer properties of the Bottle
    }
    mapping (uint => BottleOfWine) bottles;
    event BottleOwned(uint upc);
    event BottleForSale(uint upc);
    event BottleSold(uint upc);
    event BottleShipped(uint upc);
    event BottleConsumed(uint upc);

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
        require(grapes[_grapeId].grapeId > 0, "Grape with this id does not exist.");
        _;
    }

    modifier verifyGrapeState(uint _grapeId, GrapeState _state) {
        require(grapes[_grapeId].state == _state, "Current grape state forbids this operation.");
        _;
    }

    modifier bottleExists(uint _upc) {
        require(bottles[_upc].upc > 0, "Bottle with given UPC does not exist.");
        _;
    }

    modifier verifyBottleState(uint _upc, BottleState _state) {
        require(bottles[_upc].state == _state, "Current bottle state forbids this operation");
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

    modifier returnChangeForExcess(uint _upc) {
        _;
        uint _price = bottles[_upc].price;
        uint change = msg.value - _price;
        bottles[_upc].buyer.transfer(change);
    }

    constructor() public {
        contractOwner = msg.sender;
        lastGrapeId = 0;
        lastBottleUpc = 0;
        lastFarmId = 0;
    }

    // Farm Transactions
    function registerFarm(string memory _farmName, string memory _locationName, string memory _locationLong, string memory _locationLat, string memory _farmDescription) public
    {
        lastFarmId = lastFarmId + 1;
        Location memory location = Location({name: _locationName, longitude: _locationLong, latitude: _locationLat});
        farms[lastFarmId] = Farm(
            {farmId: lastFarmId,
            name: _farmName,
            location: location,
            owner: msg.sender,
            description: _farmDescription});
        emit FarmRegistered(lastFarmId);
    }
    function getFarm(uint _farmId) public view
    farmExists(_farmId)
    returns (uint farmId, string memory name, string memory locationName, string memory longitude, string memory latitude, address owner, string memory description){
        farmId = farms[_farmId].farmId;
        name = farms[_farmId].name;
        locationName = farms[_farmId].location.name;
        longitude = farms[_farmId].location.longitude;
        latitude = farms[_farmId].location.latitude;
        owner = farms[_farmId].owner;
        description = farms[_farmId].description;
    }

    // Grapes Transactions
    function harvestGrape(string memory _name, uint _vintageYear, string memory _notes, uint _farmId) public
    verifyCallerIs(farms[_farmId].owner) {
        lastGrapeId = lastGrapeId + 1;
        grapes[lastGrapeId] = WineGrape(
            {grapeId: lastGrapeId,
            name: _name,
            vintageYear: _vintageYear,
            owner: msg.sender,
            notes: _notes,
            state: GrapeState.Harvested,
            farm: farms[_farmId]});
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
    returns (uint grapeId, string memory name, uint vintageYear, string memory state, string memory notes, uint farmId, address owner){
        grapeId = _grapeId;
        name = grapes[_grapeId].name;
        vintageYear = grapes[_grapeId].vintageYear;
        farmId = grapes[_grapeId].farm.farmId;
        notes = grapes[_grapeId].notes;
        owner = grapes[_grapeId].owner;

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
        lastBottleUpc = lastBottleUpc + 1;
        lastBottleSku = lastBottleSku + 1;
        bottles[lastBottleUpc] = BottleOfWine(
            {grape: grapes[_grapeId],
            upc: lastBottleUpc,
            sku: lastBottleSku,
            productId: lastBottleSku + lastBottleUpc, // it's odd, but i have to return productId b/c of project requirements
            price: 0,
            state: BottleState.Owned,
            owner: msg.sender,
            buyer: address(0)}
        );
        emit BottleOwned(bottles[lastBottleUpc].upc);
    }

    function addBottleForSale(uint _upc, uint _price) public
    bottleExists(_upc)
    verifyBottleState(_upc, BottleState.Owned)
    priceNotZero(_price)
    verifyCallerIs(bottles[_upc].owner)  {
        bottles[_upc].price = _price;
        bottles[_upc].state = BottleState.ForSale;
        emit BottleForSale(_upc);
    }

    function buyBottle(uint _upc) public payable
    bottleExists(_upc)
    verifyBottleState(_upc, BottleState.ForSale)
    verifyCallerIsNot(bottles[_upc].owner)
    isPaidEnough(bottles[_upc].price)
    returnChangeForExcess(_upc) {
        bottles[_upc].buyer = msg.sender;
        bottles[_upc].state = BottleState.Sold;
        bottles[_upc].owner.transfer(bottles[_upc].price);
        emit BottleSold(_upc);
    }

    function shipBottle(uint _upc) public
    bottleExists(_upc)
    verifyBottleState(_upc, BottleState.Sold)
    verifyCallerIs(bottles[_upc].owner) {
        bottles[_upc].state = BottleState.Shipped;
        emit BottleShipped(_upc);
    }

    function receiveBottle(uint _upc) public
    bottleExists(_upc)
    verifyBottleState(_upc, BottleState.Shipped)
    verifyCallerIs(bottles[_upc].buyer) {
        bottles[_upc].owner = bottles[_upc].buyer;
        bottles[_upc].buyer = address(0);
        bottles[_upc].state = BottleState.Owned;
        emit BottleOwned(_upc);
    }

    function consumeBottle(uint _upc) public
    bottleExists(_upc)
    verifyBottleState(_upc, BottleState.Owned)
    verifyCallerIs(bottles[_upc].owner) {
        bottles[_upc].state = BottleState.Consumed;
        emit BottleConsumed(_upc);
    }

    function getBottle(uint _upc) public view
    bottleExists(_upc)
    returns (uint upc, uint sku, uint productId, uint price, address owner, address buyer, string memory state, uint grapeId) {
        upc = _upc;
        sku = bottles[_upc].sku;
        productId = bottles[_upc].productId;
        price = bottles[_upc].price;
        owner = bottles[_upc].owner;
        buyer = bottles[_upc].buyer;
        grapeId = bottles[_upc].grape.grapeId;

        if(uint(bottles[_upc].state) == 0) {
            state = "Owned";
        }
        if(uint(bottles[_upc].state) == 1) {
            state = "For Sale";
        }
        if(uint(bottles[_upc].state) == 2) {
            state = "Sold";
        }
        if(uint(bottles[_upc].state) == 3) {
            state = "Shipped";
        }
        if(uint(bottles[_upc].state) == 4) {
            state = "Consumed";
        }
    }
}