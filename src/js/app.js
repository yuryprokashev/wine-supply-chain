var App = {
    web3Provider: null,
    contracts: {},
    grape: {
        name: "",
        vintageYear: 0,
        notes: "",
        owner: "0x0000000000000000000000000000000000000000",
        farmId: 0
    },
    bottle: {
        sku: 0,
        upc: 0,
        grapeId: 0,
        owner: "0x0000000000000000000000000000000000000000",
        buyer: "0x0000000000000000000000000000000000000000",
        price: 0

    },
    metamaskAccountID: "0x0000000000000000000000000000000000000000",
    contractAddressAtRinkeby: "0xBA4624e4eaeCBa37F6625e5718d7db8aD27c6E67",
    contractAddressAtLocalNetwork: "0x354b554dd3481169471f2762Dba66416522520e3",

    init: async function () {
        /// Setup access to blockchain
        return await App.initWeb3();
    },

    readFarmForm: function () {
        return {
            name: $("#farm-name").val(),
            owner: $("#farm-owner").val(),
            description: $("#farm-description").val(),
            location: {
                name: $("#farm-location-name").val(),
                longitude: $("#farm-location-longitude").val(),
                latitude: $("#farm-location-latitude").val()
            }
        };
    },

    readGetFarmForm: function(){
        return $("#farm-id").val();
    },

    readGrapeForm: function () {
        return {
            name: $("#grape-name").val(),
            vintageYear: $("#grape-vintageYear").val(),
            notes: $("#grape-notes").val(),
            farmId: $("#grape-farmId").val()
        };
    },

    readGetGrapeForm: function(){
        return $("#grape-id").val();
    },

    readCreateBottleForm: function () {
        return {
            grapeId: $("#bottle-grapeId").val(),
        };
    },

    readGetBottleForOwnerForm: function(){
        return $("#owner-search-bottle-upc").val();
    },

    readGetBottleForBuyerForm: function(){
        return $("#buyer-search-bottle-upc").val();
    },

    readSellBottleForm: function(){
        return {
            upc: $("#owner-sell-bottle-upc").val(),
            price: $("#owner-sell-bottle-price").val()
        }
    },

    readBuyBottleForm: function(){
        return {
            upc: $("#buyer-buy-bottle-upc").val(),
            bid: $("#buyer-bid").val()
        }
    },

    readReceiveBottleForm: function(){
        return{
            upc: $("#buyer-receive-bottle-upc").val()
        }
    },

    readManageBottleForm: function(){
        return {
            upc: $("#owner-manage-bottle-upc").val()
        }
    },

    initWeb3: async function () {
        /// Find or Inject Web3 Provider
        /// Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
        }
        App.web3 = new Web3(App.web3Provider);
        App.getMetaskAccountID();

        return App.initSupplyChain();
    },

    getMetaskAccountID: function () {
        App.web3.eth.getAccounts(function(err, res) {
            if (err) {
                console.log('Error:',err);
                return;
            }
            console.log('getMetaskID:',res);
            App.metamaskAccountID = res[0];
        })
    },

    initSupplyChain: function () {
        /// Source the truffle compiled smart contracts
        var jsonSupplyChain='./build/contracts/Wine.json';

        /// JSONfy the smart contracts
        $.getJSON(jsonSupplyChain, function(data) {
            // console.log('data',data);
            var SupplyChainArtifact = data;
            App.contracts.SupplyChain = TruffleContract(SupplyChainArtifact);
            App.contracts.SupplyChain.setProvider(App.web3Provider);
            console.log(App.web3.version);
            if(App.web3.version.network === "4") {
                console.log("Rinkeby network detected");
                App.contracts.SupplyChain.at(App.contractAddressAtRinkeby);
            } else {
                console.log("Local network detected");
                App.contracts.SupplyChain.at(App.contractAddressAtLocalNetwork);
            }
            App.fetchEvents();
        });
        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', App.handleButtonClick);
    },

    handleButtonClick: async function(event) {
        event.preventDefault();

        App.getMetaskAccountID();

        var processId = parseInt($(event.target).data('id'));
        console.log('processId',processId);

        switch(processId) {
            case 1:
                return await App.registerFarm(event);
                break;
            case 2:
                return await App.getFarm(event);
                break;
            case 3:
                return await App.harvestGrape(event);
                break;
            case 4:
                return await App.pressGrape(event);
                break;
            case 5:
                return await App.fermentGrape(event);
                break;
            case 6:
                return await App.getGrape(event);
                break;
            case 7:
                return await App.createBottle(event);
                break;
            case 8:
                return await App.addBottleForSale(event);
                break;
            case 9:
                return await App.buyBottle(event);
                break;
            case 10:
                return await App.shipBottle(event);
                break;
            case 11:
                return await App.receiveBottle(event);
                break;
            case 12:
                return await App.consumeBottle(event);
                break;
            case 13:
                return await App.getBottleForOwner(event);
                break;
            case 14:
                return await App.getBottleForBuyer(event);
                break;
        }
    },

    showStatusMessage: function(elementId, messageType, messageText, secondsToShow) {
        let statusClass;
        switch (messageType) {
            case "success":
                statusClass = "success";
                break;
            case "warning":
                statusClass = "warning";
                break;
            case "error":
                statusClass = "error";
                break;
            default:
                statusClass = "";
        }
        $(elementId).show();
        $(elementId).addClass(statusClass);
        $(elementId).text(messageText);
        setTimeout(()=>{
            $(elementId).text("");
            $(elementId).removeClass(statusClass);
            $(elementId).hide();
        }, secondsToShow * 1000);

    },

    clearElement: function(elementId) {
        $(elementId).empty();
    },

    displayObjectDetails: function(elementId, objectType, objValues) {
        let objLabels;
        switch (objectType) {
            case "farm":
                objLabels = [
                    "Id",
                    "Name",
                    "Location Name",
                    "Location Latitude",
                    "Location Longitude",
                    "Owner Address",
                    "Description"];
                break;
            case "grape":
                objLabels = [
                    "Id",
                    "Name",
                    "Vintage Year",
                    "Status",
                    "Notes",
                    "Farm Id",
                    "Owner Address",
                ];
                break;
            case "bottle":
                objLabels = [
                    "UPC",
                    "SKU",
                    "Product Id",
                    "Price",
                    "Owner Address",
                    "Buyer Address",
                    "State",
                    "Grape Id"
                ];
                break;
            default:
                throw new Error(`Can not display: Unsupported object type - ${objectType}`);
        }
        App.clearElement(elementId);
        let iter = objValues.values();
        let i = 0;
        let currentObjectValue = iter.next();
        let value;
        while(!currentObjectValue.done) {
            // THE DIRTIEST HACK EVER. HERE I IDENTIFY IF VALUE IS BIG NUMBER BY RELYING ON 'c' PROPERTY OF THE VALUE
            if(currentObjectValue.value.c) {
                value = currentObjectValue.value.toNumber();
            } else {
                value = currentObjectValue.value;
            }
            $(elementId).append(App.createPropertyDisplay(objectType, objLabels[i], value));
            i++;
            currentObjectValue = iter.next();
        }
    },

    createPropertyDisplay: function(objType, objLabel, objValue) {
        let elementId = `${objType}-${objLabel.toLowerCase().replace(" ", "-")}`;
        let propertyDisplayLabel = $(`<div class="label">${objLabel}</div>`);
        let propertyDisplayValue = $(`<div class="value" id="${elementId}">${objValue}</div>`);

        switch (objType) {
            case "bottle":
                switch (objLabel) {
                    case "Owner Address":
                        if(objValue === App.metamaskAccountID){
                            let isOwnerTag = $(`<span class="tag">Yours</span>`);
                            propertyDisplayValue.append(isOwnerTag);
                        }
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }
        return propertyDisplayLabel.add(propertyDisplayValue);
    },

    registerFarm: function(event){
        event.preventDefault();

        let farm = App.readFarmForm();
        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.registerFarm(
                farm.name,
                farm.location.name,
                farm.location.longitude,
                farm.location.latitude,
                farm.description,
                {from: App.metamaskAccountID}
            );
        }).then(function(result) {
            App.showStatusMessage(
                "#farm-register-status",
                "success",
                `Success. Id of new farm is ${result.logs[0].args.farmId.toNumber()}`,
                5
            );
            console.log('registerFarm',result);
        }).catch(function(err) {
            App.showStatusMessage(
                "#farm-register-status",
                "error",
                `Failure. ${err.message}`,
                5
            );
            console.log(err);
        });
    },

    getFarm: async function(event){
        event.preventDefault();
        let farmId = App.readGetFarmForm();
        try {
            let wine = await App.contracts.SupplyChain.deployed();
            let farm = await wine.getFarm(farmId);
            App.displayObjectDetails("#farm-details", "farm", farm);
        } catch(e){
            App.clearElement("#farm-details");
            App.showStatusMessage("#farm-search-status", "error", `Failure. ${e.message}`, 5);
        }
    },

    harvestGrape: async function(event) {
        event.preventDefault();
        let grape = App.readGrapeForm();
        try {
            let wine = await App.contracts.SupplyChain.deployed();
            let result = await wine.harvestGrape(
                grape.name,
                grape.vintageYear,
                grape.notes,
                grape.farmId
            );
            App.showStatusMessage(
                "#grape-register-status",
                "success",
                `Success. Id of new grape is ${result.logs[0].args.grapeId.toNumber()}`,
                5
            );
        } catch (e) {
            App.showStatusMessage(
                "#grape-register-status",
                "error",
                `Failure. ${e.message}`,
                5
            );
            console.log(e);
        }
    },

    pressGrape: async function(event) {
        event.preventDefault();
        let grapeId = App.readGetGrapeForm();
        try {
            let wine = await App.contracts.SupplyChain.deployed();
            await wine.pressGrape(grapeId);
            App.showStatusMessage(
                "#grape-update-status",
                "success",
                `Success. Grape with id = ${grapeId} is now Pressed`,
                5
            );
        } catch (e) {
            App.showStatusMessage(
                "#grape-update-status",
                "error",
                `Failure. ${e.message}`,
                5
            );
            console.log(e);
        }
    },

    fermentGrape: async function(event){
        event.preventDefault();
        let grapeId = App.readGetGrapeForm();
        try {
            let wine = await App.contracts.SupplyChain.deployed();
            await wine.fermentGrape(grapeId);
            App.showStatusMessage(
                "#grape-update-status",
                "success",
                `Success. Grape with id = ${grapeId} is now Fermented`,
                5
            );
        } catch (e) {
            App.showStatusMessage(
                "#grape-update-status",
                "error",
                `Failure. ${e.message}`,
                5
            );
            console.log(e);
        }
    },

    getGrape: async function(event){
        if(event) event.preventDefault();
        let grapeId = App.readGetGrapeForm();
        try {
            let wine = await App.contracts.SupplyChain.deployed();
            let grape = await wine.getGrape(grapeId);
            let farm = await wine.getFarm(grape[5].toNumber());
            console.log(grape);
            App.displayObjectDetails("#grape-details", "grape", grape);
            App.displayObjectDetails("#grape-farm-details", "farm", farm);
        } catch(e) {
            App.clearElement("#grape-details");
            App.clearElement("#grape-farm-details");
            App.showStatusMessage("#grape-search-status", "error", `Failure. ${e.message}`, 5);
            console.log(e);
        }
    },

    createBottle: async function(event){
        event.preventDefault();
        let bottle = App.readCreateBottleForm();
        try {
            let wine = await App.contracts.SupplyChain.deployed();
            let result = await wine.createBottle(
                bottle.grapeId
            );
            App.showStatusMessage(
                "#create-bottle-status",
                "success",
                `Success. Id of new bottle is ${result.logs[0].args.upc.toNumber()}`,
                5
            );
        } catch (e) {
            App.showStatusMessage(
                "#create-bottle-status",
                "error",
                `Failure. ${e.message}`,
                5
            );
            console.log(e);
        }
    },

    addBottleForSale: async function(event){
        event.preventDefault();
        let bottle = App.readSellBottleForm();
        try {
            let wine = await App.contracts.SupplyChain.deployed();
            await wine.addBottleForSale(bottle.upc, bottle.price);
            App.showStatusMessage(
                "#owner-sell-bottle-status",
                "success",
                `Success. Bottle with UPC = ${bottle.upc} is now For Sale`,
                5
            );
        } catch (e) {
            App.showStatusMessage(
                "#owner-sell-bottle-status",
                "error",
                `Failure. ${e.message}`,
                5
            );
            console.log(e);
        }
    },

    buyBottle: async function(event) {
        event.preventDefault();
        let bottle = App.readBuyBottleForm();
        console.log(bottle);
        try{
            let wine = await App.contracts.SupplyChain.deployed();
            await wine.buyBottle(bottle.upc, {from: App.metamaskAccountID, value: bottle.bid});
            App.showStatusMessage(
                "#buy-bottle-status",
                "success",
                `Success. Bottle with UPC = ${bottle.upc} is now Sold`,
                5
            );
        } catch (e) {
            App.showStatusMessage(
                "#buy-bottle-status",
                "error",
                `Failure. ${e.message}`,
                5
            );
            console.log(e);
        }
    },

    shipBottle: async function(event){
        event.preventDefault();
        let bottle = App.readManageBottleForm();
        console.log(bottle);
        try{
            let wine = await App.contracts.SupplyChain.deployed();
            await wine.shipBottle(bottle.upc);
            App.showStatusMessage(
                "#owner-manage-bottle-status",
                "success",
                `Success. Bottle with UPC = ${bottle.upc} is now Shipped to Buyer`,
                5
            );
        } catch (e) {
            App.showStatusMessage(
                "#owner-manage-bottle-status",
                "error",
                `Failure. ${e.message}`,
                5
            );
            console.log(e);
        }
    },

    receiveBottle: async function(event){
        event.preventDefault();
        let bottle = App.readReceiveBottleForm();
        console.log(bottle);
        try{
            let wine = await App.contracts.SupplyChain.deployed();
            await wine.receiveBottle(bottle.upc);
            App.showStatusMessage(
                "#buyer-receive-bottle-status",
                "success",
                `Success. Bottle with UPC = ${bottle.upc} is now Owned by You`,
                5
            );
        } catch (e) {
            App.showStatusMessage(
                "#buyer-receive-bottle-status",
                "error",
                `Failure. ${e.message}`,
                5
            );
            console.log(e);
        }
    },

    consumeBottle: async function(event){
        event.preventDefault();
        let bottle = App.readManageBottleForm();
        console.log(bottle);
        try{
            let wine = await App.contracts.SupplyChain.deployed();
            await wine.consumeBottle(bottle.upc);
            App.showStatusMessage(
                "#owner-manage-bottle-status",
                "success",
                `Success. Bottle with UPC = ${bottle.upc} is now Consumed`,
                5
            );
        } catch (e) {
            App.showStatusMessage(
                "#owner-manage-bottle-status",
                "error",
                `Failure. ${e.message}`,
                5
            );
            console.log(e);
        }
    },

    getBottleForOwner: async function(event){
        if(event) event.preventDefault();
        let bottleUpc = App.readGetBottleForOwnerForm();
        try {
            let wine = await App.contracts.SupplyChain.deployed();
            let bottle = await wine.getBottle(bottleUpc);
            let grape = await wine.getGrape(bottle[7].toNumber());
            let farm = await wine.getFarm(grape[5].toNumber());
            console.log(bottle);
            App.displayObjectDetails("#owner-bottle-details", "bottle", bottle);
            App.displayObjectDetails("#owner-bottle-grape-details", "grape", grape);
            App.displayObjectDetails("#owner-bottle-farm-details", "farm", farm);
        } catch(e) {
            App.clearElement("#owner-bottle-details");
            App.clearElement("#owner-bottle-grape-details");
            App.clearElement("#owner-bottle-farm-details");
            App.showStatusMessage("#owner-search-bottle-status", "error", `Failure. ${e.message}`, 5);
            console.log(e);
        }
    },

    getBottleForBuyer: async function(event){
        if(event) event.preventDefault();
        let bottleUpc = App.readGetBottleForBuyerForm();
        try {
            let wine = await App.contracts.SupplyChain.deployed();
            let bottle = await wine.getBottle(bottleUpc);
            let grape = await wine.getGrape(bottle[7].toNumber());
            let farm = await wine.getFarm(grape[5].toNumber());
            console.log(bottle);
            App.displayObjectDetails("#buyer-bottle-details", "bottle", bottle);
            App.displayObjectDetails("#buyer-bottle-grape-details", "grape", grape);
            App.displayObjectDetails("#buyer-bottle-farm-details", "farm", farm);
        } catch(e) {
            App.clearElement("#buyer-bottle-details");
            App.clearElement("#buyer-bottle-grape-details");
            App.clearElement("#buyer-bottle-farm-details");
            App.showStatusMessage("#buyer-search-bottle-status", "error", `Failure. ${e.message}`, 5);
            console.log(e);
        }
    },

    fetchEvents: function () {
        if (typeof App.contracts.SupplyChain.currentProvider.sendAsync !== "function") {
            App.contracts.SupplyChain.currentProvider.sendAsync = function () {
                return App.contracts.SupplyChain.currentProvider.send.apply(
                    App.contracts.SupplyChain.currentProvider,
                    arguments
                );
            };
        }

        App.contracts.SupplyChain.deployed().then(function(instance) {
            var events = instance.allEvents(function(err, log){
                if (!err)
                    $("#ftc-events").append('<li>' + log.event + ' - ' + log.transactionHash + '</li>');
            });
        }).catch(function(err) {
            console.log(err.message);
        });

    }
};

$(function () {
    $(window).load(async function () {
        await App.init();
    });
});
