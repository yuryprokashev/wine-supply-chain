const Wine = artifacts.require('Wine');

contract("", async function(accounts){
    const Test = require("./TestConstants")(accounts, web3);

    let wineContract, testFarmId, testGrapeId;
    beforeEach(async ()=> {
        wineContract = await Wine.new({from: Test.contractOwner});
        wineContract.FarmRegistered().on("data", event => {
            testFarmId = event.returnValues.farmId;
        });
        wineContract.GrapeHarvested().on("data", event => {
            testGrapeId = event.returnValues.grapeId;
        });
        await wineContract.registerFarm(
            Test.farmName,
            Test.locationName,
            Test.locationLong,
            Test.locationLat,
            Test.farmDescription,
            {from: Test.farmOwner}
        );
        await wineContract.harvestGrape(
            Test.grapeName,
            Test.vintageYear,
            Test.grapeNotes,
            testFarmId,
            {from: Test.farmOwner}
        );
        await wineContract.pressGrape(testGrapeId, {from: Test.farmOwner});
    });
    describe("1. Transactions that mutate the contract state", async function() {
        describe("<1> <createBottle> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Throws an Error, when transaction sender <is not an owner of the grape provided for bottle>", async function () {
                   try {
                       await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                       await wineContract.createBottle(testGrapeId, {from: Test.notOwnerOfThisGrape});
                       assert.fail("The sender is not the owner of the grape, but he was able to create a bottle from it");
                   } catch (e) {
                       assert.equal(e.message.includes("Current caller can not invoke this operation."), true);
                   }

                });
            });

            describe("Successful Case", async function () {
                it("<createBottle> Transaction successful", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", async event => {
                        bottleUpc = event.returnValues.upc;

                        let newBottle = await wineContract.getBottle(bottleUpc);
                        assert.equal(newBottle.upc, bottleUpc, "Unexpected bottle id");
                        assert.equal(newBottle.sku, true, "Unexpected bottle sku");
                        assert.equal(newBottle.productId, parseInt(newBottle.upc) + parseInt(newBottle.sku), "Unexpected bottle product id");
                        assert.equal(newBottle.price, 0, "Unexpected bottle price");
                        assert.equal(newBottle.owner, Test.farmOwner, "Unexpected bottle owner");
                        assert.equal(newBottle.buyer, Test.nullAddress, "Unexpected bottle buyer");
                        assert.equal(newBottle.grapeId, testGrapeId, "Unexpected grape id of the bottle");
                        assert.equal(newBottle.state, "Owned", "Unexpected bottle state");
                    }).on("error", err =>{
                        assert.fail(err.message);
                    });

                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                    } catch (e) {
                        assert.fail(e.message);
                    }
                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when <grape with provided id does not exist>", async function () {
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(Test.grapeIdThatDoesNotExist, {from: Test.farmOwner});
                        assert.fail("The grape id does not exists, but bottle has just been created from this grape");
                    } catch (e) {
                        assert.equal(e.message.includes("Grape with this id does not exist."), true);
                    }
                });
                it("Throws an Error, when <state of provided grape is not Fermented>", async function () {

                    try {
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        assert.fail("The grape is just pressed, but bottle has just been created from it");
                    } catch(e) {
                        assert.equal(e.message.includes("Current grape state forbids this operation."), true);
                    }
                });
            });
        });
        describe("<2> <addBottleForSale> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Throws an Error, when transaction sender <is not an owner of the bottle>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.notOwnerOfThisBottle});
                        assert.fail("The sender is not the owner of the bottle, but he was able to put it for sale.");
                    } catch (e) {
                        assert.equal(e.message.includes("Current caller can not invoke this operation."), true);
                    }
                });
            });

            describe("Successful Case", async function () {
                it("<addBottleForSale> Transaction successful", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    wineContract.BottleForSale().on("data", async event => {
                        let bottle = await wineContract.getBottle(event.returnValues.upc);
                        assert.equal(bottle.state, "For Sale", "Unexpected bottle state");
                        assert.equal(bottle.price, Test.bottlePrice, "Unexpected bottle price");
                    });
                    try{
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                    } catch (e) {
                        assert.fail(e.message);
                    }
                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when <bottle with provided id does not exist>", async function () {
                    try {
                        await wineContract.addBottleForSale(
                            Test.bottleUpcThatDoesNotExist,
                            Test.bottlePrice,
                            {from: Test.farmOwner});
                        assert.fail("Bottle with given UPC does not exist, but sender was able to put it for sale.")
                    } catch (e) {
                        assert.equal(e.message.includes("Bottle with given UPC does not exist."), true);
                    }
                });
                it("Throws an Error, when <state of provided bottle is not Owned>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        assert.fail("The bottle can not be put on sale, when it is for sale, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Current bottle state forbids this operation"), true);
                    }
                });
                it("Throws an Error, when <price of provided bottle is 0>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.zeroPrice, {from: Test.farmOwner});
                        assert.fail("The bottle can not be put for sale for zero price, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Price can not be zero."), true);
                    }
                });
            });
        });
        describe("<3> <buyBottle> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Throws an Error, when transaction sender <is owner of the bottle>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.farmOwner, value: Test.buyersBid});
                        assert.fail("The bottle for sale can not be purchased by the one, who owns it, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Current caller can not invoke this operation."), true);
                    }
                });
            });

            describe("Successful Case", async function () {
                it("<buyBottle> Transaction successful", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    let ownerBalanceBefore, buyerBalanceBefore, ownerBalanceAfter, buyerBalanceAfter;



                    wineContract.BottleSold().on("data", async event => {
                        let bottle = await wineContract.getBottle(bottleUpc);

                        assert.equal(bottle.state, "Sold", "Unexpected bottle state");
                        assert.equal(bottle.buyer, Test.bottleBuyer, "Unexpected bottle buyer");

                        ownerBalanceAfter = web3.utils.toBN(await web3.eth.getBalance(Test.farmOwner));
                        assert.equal(ownerBalanceAfter.sub(ownerBalanceBefore).toNumber(), Test.bottlePrice, "Unexpected bottle owner balance");
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        ownerBalanceBefore = web3.utils.toBN(await web3.eth.getBalance(Test.farmOwner));
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                    } catch (e) {
                        assert.fail(e.message);
                    }
                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when <bottle with provided id does not exist>", async function () {
                    try {
                        await wineContract.buyBottle(
                            Test.bottleUpcThatDoesNotExist,
                            {from: Test.bottleBuyer, value: Test.buyersBid});
                        assert.fail("Bottle with given UPC does not exist, but sender was able to buy it.")
                    } catch (e) {
                        assert.equal(e.message.includes("Bottle with given UPC does not exist."), true);
                    }
                });
                it("Throws an Error, when <state of provided bottle is not ForSale>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        assert.fail("The bottle can not be bought, when it is sold, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Current bottle state forbids this operation"), true);
                    }
                });
                it("Throws an Error, when <provided transaction value is less than price of the provided bottle>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.insufficientBuyersBid});
                        assert.fail("The bottle can not be bought, when the offered bid is less than bottle price, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Bid price must be more or equal to bottle's price"), true);
                    }
                });
            });
        });
        describe("<4> <shipBottle> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Throws an Error, when transaction sender <is not an owner of the bottle>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        await wineContract.shipBottle(bottleUpc, {from: Test.bottleBuyer});
                        assert.fail("The bottle sold can not be shipped by the one, who bought it it, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Current caller can not invoke this operation."), true);
                    }
                });
            });

            describe("Successful Case", async function () {
                it("<shipBottle> Transaction successful", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });

                    wineContract.BottleShipped().on("data", async event => {
                        let bottle = await wineContract.getBottle(bottleUpc);

                        assert.equal(bottle.state, "Shipped", "Unexpected bottle state");

                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        await wineContract.shipBottle(bottleUpc, {from: Test.farmOwner});
                    } catch (e) {
                        assert.fail(e.message);
                    }
                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when <bottle with provided id does not exist>", async function () {
                    try {
                        await wineContract.shipBottle(
                            Test.bottleUpcThatDoesNotExist,
                            {from: Test.farmOwner});
                        assert.fail("Bottle with given UPC does not exist, but sender was able to ship it.")
                    } catch (e) {
                        assert.equal(e.message.includes("Bottle with given UPC does not exist."), true);
                    }
                });
                it("Throws an Error, when <state of provided bottle is not Sold>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        await wineContract.shipBottle(bottleUpc, {from: Test.farmOwner});
                        await wineContract.shipBottle(bottleUpc, {from: Test.farmOwner});
                        assert.fail("The bottle can not be shipped, when it is shipped, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Current bottle state forbids this operation"), true);
                    }
                });
            });
        });
        describe("<5> <receiveBottle> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Throws an Error, when transaction sender <is not buyer of the bottle>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        await wineContract.shipBottle(bottleUpc, {from: Test.farmOwner});
                        await wineContract.receiveBottle(bottleUpc, {from: Test.farmOwner});
                        assert.fail("The bottle sold can not be received by the one, who sold it it, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Current caller can not invoke this operation."), true);
                    }
                });
            });

            describe("Successful Case", async function () {
                it("<receiveBottle> Transaction successful", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", async event => {
                        bottleUpc = event.returnValues.upc;
                        let bottle = await wineContract.getBottle(bottleUpc);

                        if(bottle.owner !== Test.farmOwner) {
                            assert.equal(bottle.state, "Owned", "Unexpected bottle state");
                            assert.equal(bottle.owner, Test.bottleBuyer, "Unexpected bottle owner");
                            assert.equal(bottle.buyer, Test.nullAddress, "Unexpected bottle buyer")
                        }
                    });

                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        await wineContract.shipBottle(bottleUpc, {from: Test.farmOwner});
                        await wineContract.receiveBottle(bottleUpc, {from: Test.bottleBuyer});
                    } catch (e) {
                        assert.fail(e.message);
                    }
                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when <bottle with provided id does not exist>", async function () {
                    try {
                        await wineContract.receiveBottle(
                            Test.bottleUpcThatDoesNotExist,
                            {from: Test.bottleBuyer});
                        assert.fail("Bottle with given UPC does not exist, but sender was able to receive it.")
                    } catch (e) {
                        assert.equal(e.message.includes("Bottle with given UPC does not exist."), true);
                    }
                });
                it("Throws an Error, when <state of provided bottle is not Shipped>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        await wineContract.shipBottle(bottleUpc, {from: Test.farmOwner});
                        await wineContract.receiveBottle(bottleUpc, {from: Test.bottleBuyer});
                        await wineContract.receiveBottle(bottleUpc, {from: Test.bottleBuyer});
                        assert.fail("The bottle can not be shipped, when it is already shipped, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Current bottle state forbids this operation"), true);
                    }
                });
            });
        });
        describe("<6> <consumeBottle> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Throws an Error, when transaction sender <is not an owner of the bottle>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        await wineContract.shipBottle(bottleUpc, {from: Test.farmOwner});
                        await wineContract.receiveBottle(bottleUpc, {from: Test.bottleBuyer});
                        await wineContract.consumeBottle(bottleUpc, {from: Test.farmOwner});
                        assert.fail("The bottle can not be consumed by the one, who does not own it, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Current caller can not invoke this operation."), true);
                    }
                });
            });

            describe("Successful Case", async function () {
                it("<consumeBottle> Transaction successful", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });

                    wineContract.BottleConsumed().on("data", async event => {
                        let bottle = await wineContract.getBottle(bottleUpc);
                        assert.equal(bottle.state, "Consumed", "Unexpected bottle state");
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        await wineContract.shipBottle(bottleUpc, {from: Test.farmOwner});
                        await wineContract.receiveBottle(bottleUpc, {from: Test.bottleBuyer});
                        await wineContract.consumeBottle(bottleUpc, {from: Test.bottleBuyer});
                    } catch (e) {
                        assert.fail(e.message);
                    }
                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when <bottle with provided id does not exist>", async function () {
                    try {
                        await wineContract.consumeBottle(
                            Test.bottleUpcThatDoesNotExist,
                            {from: Test.farmOwner});
                        assert.fail("Bottle with given UPC does not exist, but sender was able to consume it.")
                    } catch (e) {
                        assert.equal(e.message.includes("Bottle with given UPC does not exist."), true);
                    }
                });
                it("Throws an Error, when <state of provided bottle is not Owned>", async function () {
                    let bottleUpc;
                    wineContract.BottleOwned().on("data", event => {
                        bottleUpc = event.returnValues.upc;
                    });
                    try {
                        await wineContract.fermentGrape(testGrapeId, {from: Test.farmOwner});
                        await wineContract.createBottle(testGrapeId, {from: Test.farmOwner});
                        await wineContract.addBottleForSale(bottleUpc, Test.bottlePrice, {from: Test.farmOwner});
                        await wineContract.buyBottle(bottleUpc, {from: Test.bottleBuyer, value: Test.buyersBid});
                        await wineContract.shipBottle(bottleUpc, {from: Test.farmOwner});
                        await wineContract.receiveBottle(bottleUpc, {from: Test.bottleBuyer});
                        await wineContract.consumeBottle(bottleUpc, {from: Test.bottleBuyer});
                        await wineContract.consumeBottle(bottleUpc, {from: Test.bottleBuyer});
                        assert.fail("The bottle can not be consumed, when it is already consumed, but it has just happened");
                    } catch (e) {
                        assert.equal(e.message.includes("Current bottle state forbids this operation"), true);
                    }
                });
            });
        });
    });

    describe("2. Transactions that read the contract state", async function() {
        describe("<1> <getBottle> Transaction.", async function () {
            describe("Access Control Errors", async function() {
                it("Does not have access restrictions", async function () {

                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when <bottle with provided id does not exist>", async function () {
                    try {
                        await wineContract.getBottle(
                            Test.bottleUpcThatDoesNotExist,
                            {from: Test.farmOwner});
                        assert.fail("Bottle with given UPC does not exist, but sender was able to get it.")
                    } catch (e) {
                        assert.equal(e.message.includes("Bottle with given UPC does not exist."), true);
                    }
                });
            });
        });
    });
});

