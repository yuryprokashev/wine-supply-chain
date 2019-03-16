const Wine = artifacts.require('Wine');

contract("Wine Supply Chain Contract. Farm Resource", async accounts => {
    const Test = require("./TestConstants")(accounts, web3);

    let wineContract;
    beforeEach(async ()=> {
        wineContract = await Wine.new({from: Test.contractOwner});
    });

    describe("1. <Farm Resource> Transactions (change the state)", async function() {
        describe("<1> <registerFarm> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Does not have access restrictions", async function () {

                });
            });

            describe("Successful Case", async function () {
                it("<registerFarm> Transaction successful + <getFarm> Call successful", async function () {
                    let newFarmId;

                    wineContract.FarmRegistered().on("data", async (event)=> {
                        assert.equal(event.event, "FarmRegistered", `Wrong event name = ${event.event} emitted`);

                        newFarmId = event.returnValues.farmId;

                        let newFarm = await wineContract.getFarm(newFarmId);
                        assert.equal(newFarm.farmId, newFarmId, "Unexpected farmId returned");
                        assert.equal(newFarm.name, Test.farmName, "Unexpected name returned");
                        assert.equal(newFarm.locationName, Test.locationName, "Unexpected Test.locationName returned");
                        assert.equal(newFarm.longitude, Test.locationLong, "Unexpected longitude returned");
                        assert.equal(newFarm.latitude, Test.locationLat, "Unexpected latitude returned");
                        assert.equal(newFarm.description, Test.farmDescription, "Unexpected description returned");
                        assert.equal(newFarm.owner, Test.farmOwner, "Unexpected owner returned");
                    }).on("error", err => {
                        assert.fail(err.message);
                    });

                    await wineContract.registerFarm(
                        Test.farmName,
                        Test.locationName,
                        Test.locationLong,
                        Test.locationLat,
                        Test.farmDescription,
                        {from: Test.farmOwner});
                });
            });

            describe("Invalid Input Errors", async function () {
                it("Does not check input", async function () {

                });
            });
        });
    });


    describe("2. <Farm Resource> Calls (read the state)", async function() {
        describe("<1> <getFarm> Call.", async function () {
            describe("Access Control Errors", async function() {
                it("Calls do not have access restrictions", async function () {

                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when farmId does not exist", async function () {
                    try {
                        await wineContract.getFarm(Test.farmIdThatDoesNotExists);
                        assert.fail("Farm with provided id does not exists, but error was not thrown.");
                    } catch (e) {
                        assert.equal(e.message.includes("Farm with this id does not exist."), true);
                    }
                });
            });
        });
    });
});

