const Wine = artifacts.require('Wine');

contract("Wine Contract. Grape Resource", async (accounts) => {
    const Test = require("./TestConstants")(accounts, web3);

    let wineContract, testFarmId;
    beforeEach(async ()=> {
        wineContract = await Wine.new({from: Test.contractOwner});
        wineContract.FarmRegistered().on("data", event => {
            testFarmId = event.returnValues.farmId;
        });
        await wineContract.registerFarm(
            Test.farmName,
            Test.locationName,
            Test.locationLong,
            Test.locationLat,
            Test.farmDescription,
            {from: Test.farmOwner}
            );
    });



    describe("1. <Grape Resource> Transactions (change the state)", async function() {
        describe("<1> <harvestGrape> Transaction.", async function () {
            describe("Access Control Errors", async function() {
                it("Throws an Error, when transaction sender <is not a farm owner>", async function () {
                    try {
                        await wineContract.harvestGrape(
                            Test.grapeName,
                            Test.vintageYear,
                            Test.grapeNotes,
                            testFarmId,
                            {from: Test.notOwnerOfThisFarm}
                        );
                        assert.fail("The sender was not the owner of the farm, but he was able to harvest grape.")
                    } catch (e) {
                        assert.equal(e.message.includes("Current caller can not invoke this operation."), true);
                    }
                });
            });

            describe("Successful Case", async function () {
                it("<harvestGrape> Transaction successful", async function () {
                    wineContract.GrapeHarvested().on("data", async event => {
                        let newGrapeId = event.returnValues.grapeId;

                        let newGrape = await wineContract.getGrape(newGrapeId);

                        assert.equal(newGrape.name, Test.grapeName, "Unexpected grape name");
                        assert.equal(newGrape.vintageYear, Test.vintageYear, "Unexpected vintage year");
                        assert.equal(newGrape.notes, Test.grapeNotes, "Unexpected grape notes");
                        assert.equal(newGrape.farmId, testFarmId, "Unexpected farm id");
                        assert.equal(newGrape.owner, Test.farmOwner, "Unexpected grape owner");
                        assert.equal(newGrape.state, "Harvested", "Unexpected grape state");
                        console.log("success must be");
                    }).on("error", err => {
                        console.log("FAIL");
                        assert.fail(err.message);
                    });

                    try {
                        await wineContract.harvestGrape(
                            Test.grapeName,
                            Test.vintageYear,
                            Test.grapeNotes,
                            testFarmId,
                            {from: Test.farmOwner}
                        );
                    } catch (err) {
                        assert.fail(err.message);
                    }

                });
            });

            describe("Invalid Input Errors", async function () {
                it("Does not check input", async function () {

                });
            });
        });
        describe("<2> <pressGrape> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Throws an Error, when transaction sender <is not an owner of this grape>", async function () {
                    let grapeId;
                    wineContract.GrapeHarvested().on("data", event => {
                        grapeId = event.returnValues.grapeId;
                    });
                    try {
                        await wineContract.harvestGrape(
                            Test.grapeName,
                            Test.vintageYear,
                            Test.grapeNotes,
                            testFarmId,
                            {from: Test.farmOwner}
                        );
                        await wineContract.pressGrape(grapeId, {from: Test.notOwnerOfThisFarm});
                        assert.fail("The sender was not the owner of the grape, but he was able to press the grape");
                    } catch (err) {
                        assert.equal(err.message.includes("Current caller can not invoke this operation."), true);
                    }
                });
            });

            describe("Successful Case", async function () {
                it("<pressGrape> Transaction successful", async function () {
                    let grapeId;
                    wineContract.GrapeHarvested().on("data", event => {
                        grapeId = event.returnValues.grapeId;
                    });
                    wineContract.GrapePressed().on("data", async event => {
                        let grape = await wineContract.getGrape(grapeId);

                        assert.equal(grape.state, "Pressed", "Unexpected grape state");
                    });
                    try {
                        await wineContract.harvestGrape(
                            Test.grapeName,
                            Test.vintageYear,
                            Test.grapeNotes,
                            testFarmId,
                            {from: Test.farmOwner}
                        );
                        await wineContract.pressGrape(grapeId, {from: Test.farmOwner});
                    } catch (err) {
                        assert.fail(err.message);
                    }
                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when <current grape state is not Harvested>", async function () {
                    let grapeId;
                    wineContract.GrapeHarvested().on("data", event => {
                        grapeId = event.returnValues.grapeId;
                    });

                    try {
                        await wineContract.harvestGrape(
                            Test.grapeName,
                            Test.vintageYear,
                            Test.grapeNotes,
                            testFarmId,
                            {from: Test.farmOwner}
                        );
                        await wineContract.pressGrape(grapeId, {from: Test.farmOwner});
                        await wineContract.pressGrape(grapeId, {from: Test.farmOwner});
                        assert.fail("Grape can not be pressed twice, but it happened.")
                    } catch (err) {
                        console.log(err.message);
                        assert.equal(err.message.includes("Current grape state forbids this operation."), true)
                    }
                });
            });
        });
        describe("<3> <fermentGrape> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Throws an Error, when transaction sender <is not an owner of this grape>", async function () {
                    let grapeId;
                    wineContract.GrapeHarvested().on("data", event => {
                        grapeId = event.returnValues.grapeId;
                    });
                    try {
                        await wineContract.harvestGrape(
                            Test.grapeName,
                            Test.vintageYear,
                            Test.grapeNotes,
                            testFarmId,
                            {from: Test.farmOwner}
                        );
                        await wineContract.pressGrape(grapeId, {from: Test.farmOwner});
                        await wineContract.fermentGrape(grapeId, {from: Test.notOwnerOfThisFarm});
                        assert.fail("The sender was not the owner of the grape, but he was able to press the grape");
                    } catch (err) {
                        assert.equal(err.message.includes("Current caller can not invoke this operation."), true);
                    }
                });
            });

            describe("Successful Case", async function () {
                it("<fermentGrape> Transaction successful", async function () {
                    let grapeId;
                    wineContract.GrapeHarvested().on("data", event => {
                        grapeId = event.returnValues.grapeId;
                    });
                    wineContract.GrapeFermented().on("data", async event => {
                        let grape = await wineContract.getGrape(grapeId);

                        assert.equal(grape.state, "Fermented", "Unexpected grape state");
                    });
                    try {
                        await wineContract.harvestGrape(
                            Test.grapeName,
                            Test.vintageYear,
                            Test.grapeNotes,
                            testFarmId,
                            {from: Test.farmOwner}
                        );
                        await wineContract.pressGrape(grapeId, {from: Test.farmOwner});
                        await wineContract.fermentGrape(grapeId, {from: Test.farmOwner});
                    } catch (err) {
                        assert.fail(err.message);
                    }
                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when <current grape state is not Pressed>", async function () {
                    let grapeId;
                    wineContract.GrapeHarvested().on("data", event => {
                        grapeId = event.returnValues.grapeId;
                    });

                    try {
                        await wineContract.harvestGrape(
                            Test.grapeName,
                            Test.vintageYear,
                            Test.grapeNotes,
                            testFarmId,
                            {from: Test.farmOwner}
                        );
                        await wineContract.pressGrape(grapeId, {from: Test.farmOwner});
                        await wineContract.fermentGrape(grapeId, {from: Test.farmOwner});
                        await wineContract.fermentGrape(grapeId, {from: Test.farmOwner});
                        assert.fail("Grape can not be fermented twice, but it happened.")
                    } catch (err) {
                        console.log(err.message);
                        assert.equal(err.message.includes("Current grape state forbids this operation."), true)
                    }
                });
            });
        });
    });


    describe("2. Transactions that read the contract state", async function() {
        describe("<1> <getGrape> Transaction.", async function () {

            describe("Access Control Errors", async function() {
                it("Does not have access restrictions", async function () {

                });
            });

            describe("Invalid Input Errors", async function () {
                it("Throws an Error, when <grape with given id does not exist>", async function () {
                    try {
                        await wineContract.getGrape(Test.grapeIdThatDoesNotExist);
                        assert.fail("Grape with provided id does not exists, but error was not thrown.");
                    } catch (e) {
                        assert.equal(e.message.includes("Grape with this id does not exist."), true);
                    }
                });
            });
        });
    });

});
