var Wine = artifacts.require("./Wine.sol");

module.exports = function(deployer) {
    deployer.deploy(Wine);
};