module.exports = function (accounts, web3){
    return {
        farmName: "Yury's Farm",
        farmDescription: "Awesome wine farm in the middle of nowhere",
        locationName: "Middle of Nowhere",
        locationLong: "-38.239770",
        locationLat: "144.341490",
        farmOwner: accounts[1],
        contractOwner: accounts[0],
        farmIdThatDoesNotExists: 10000,
        grapeName: "Zinfandel",
        vintageYear: 2019,
        grapeNotes: "There was awesome weather in the Middle of Nowhere, so the grape has marvelous taste!",
        notOwnerOfThisFarm: accounts[9],
        grapeIdThatDoesNotExist: 10000,
        notOwnerOfThisGrape: accounts[8],
        nullAddress: "0x0000000000000000000000000000000000000000",
        notOwnerOfThisBottle: accounts[9],
        bottlePrice: 10,
        bottleUpcThatDoesNotExist: 10000,
        zeroPrice: 0,
        bottleBuyer: accounts[9],
        buyersBid: 20,
        insufficientBuyersBid: 9,
        zeroBuyersBid: 0
    }
};