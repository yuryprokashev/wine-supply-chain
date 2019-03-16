/*
* NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
* function when declaring them. Failure to do so will cause commands to hang. ex:
* ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */
const HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "admit pen attend annual slice drum motion void essence stereo cherry spot";
//0x05c143686724a39ba6c5db44ffc1d2e9ce8e4400 - this is default address created from mnemonic above
//0x62fd352ac07c6135c963d3c032616ea62b9241b4 - rinkeby transaction for 3 ether
// https://rinkeby.etherscan.io/address/0x533c2dc83c9810e1f1debe92d47eef09e17da836 - contract on rinkeby
module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        development_cli: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*",
            websockets: true
        },
        development_ui: {
            host: "127.0.0.1",
            port: 7545,
            network_id: 5777
        },
        rinkeby: {
            provider: function() {
                return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/7c1980a964a741f5a4d051b488f654ef");
            },
            network_id: 4,
            gas: 4500000,
            gasPrice: 10000000000
        }
    }
};