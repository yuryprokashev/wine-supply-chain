# Project 6 Feedback
Here you can find a set of questions, I logged along the way of implementing the Project 6.
## Question Log
1. Why do we have `Ownable.sol` in the project starter code?
It is not used anywhere in the starter code and there is no
grading rubric, that requires to use it. We only have the
requirement to have `Ownable.sol`. But all functions there
are already implemented in the starter code.

2. Why do we have to model 'Distributor', 'Retailer' and 'Consumer'
as separate roles? Distributor and Retailer both have the same
set of operations that they are allowed to do with the item.
I also wonder, why there must be a Consumer role, that only allows
to buy and consume. Such model is flawed b/c it 'hardcodes' the number
of shipping hops in the process. Any time you have less or more hops, 
the model does not work.
It also hardcodes the operations allowed for participant in the chain
at specific hop. Any time, participant want to behave differently, the
model does not work.
Imagine, Retailer wants to buy the bottle from the Farmer. Your model
does not allow it.
Imagine, Distributor wants to consume bottle, b/c he broken some after
he received them, or he just wants a bottle for himself. You model does
not allow it.
Imagine, there are several Distributors in the chain, b/c bottle has to travel from
New Zealand to UK. No way with your model.
Any owner of the item must be able to consume it when he owns it.
Any owner of the item must be able to sell the item, if he wants to.
Any potential buyer must be able to buy the item, if he wants to.
In such a way we can model the infinite supply chain with just two roles:
ItemOwner and ItemBuyer.
ItemOwner can sell the item or consume it.
ItemOwner is responsible to ship the item to ItemBuyer.
ItemBuyer can buy the item and acknowledge he had received it.
That's it. 
Item can travel along the supply chain, changing the owner any number of
times, until some owner decides to consume it.

3. Why do we have the mapping `itemsHistory` in the starter code of
`SupplyChain.sol`? There is no project rubric that asks to implement
fetching the history of an item.

4. Why do you call the variable for UPC at the contract level just `upc`,
when it is starting UPC, that is further incremented in `harvestItem`?
It is confusing, b/c you have the member called `Item#upc` just below in
30 loc.
Call it `lastAssignedUPC`, or something more meaningful. Same for `sku` 
on contract level. It is last assigned SKU.

5. Why to have both `sku` and `upc` at contract level, if `sku` is never used 
by the contract methods?
Just b/c there is a notion of the UPC and SKU in the Supply Chain?
If contract does not use the `sku`, then SKU meaning is similar to the 
Farm information. And why contract is responsible for updating it and not Farmer?

6. What are `fetchItemBufferOne` and `fetchItemBufferTwo`? Why this design?
Why not just fetch the item in one shot? It has plain structure.

7. Why Farm information is embedded into the Item? Farm is the separate struct.
It can have its identifier that Contract can use to give the information about
the Farm by id. And the method `fetchItem` may return just farmId instead of full 
farm info. And the `fetchFarm` can return the full farm info. Anyway, your client
will have to join the information from `fetchItemBufferOne` and `fetchItemBufferTwo`
why not to make the information split based on the separation of concerns, not on
number of the Item properties, that fits to the IDE screen? Related to above question.

8. Interesting note. The major problem is the authenticity of the Farm. I can register
any farm with any location without actually owning it. The transactions in the Etherium 
blockchain afterwards only record the hops. It is still useful, b/c I can track the
number of hops and even price changes due to logistics. But, but, it has nothing to
do with authenticity of the Item that travels along the supply chain. Why shall I trust 
the guy, who registered the Item with the Wine Farm from New Zealand, if I can do the 
same sitting here in Moscow without actually owning the Wine Farm?
Why shall I trust the guy hitting the "Pressed" button for Wine Grape of the Bottle, that
I'm going to buy, if I can press this button too? It is important for the Consumer
to know, what happened with the Wine Grape. How long was it fermented, or when it was 
harvested. But this information is hard to get reliably. And Etherium does not solve this
problem.

9. The starter code in `SupplyChainTest.js` contains code, that does not work.
It uses `event.watch`, but it is not longer available.
```javascript
// THIS CODE DOES NTO WORK AS OF 02-Mar-2019!!

// Watch the emitted event Harvested()
var event = supplyChain.Harvested();
await event.watch((err, res) => {
    eventEmitted = true
});
```
The correct way to test events with truffle is here: [link](
https://github.com/trufflesuite/truffle/blob/next/packages/truffle-contract/test/events.js).

10. The code in the `TestSupplyChain.js` does not use `beforeEach`. Instead it calls `SupplyChain.deployed()`
in every single `it` invocation. It is violation of the DRY in the obvious case, and it teaches
students who learn this first time a bad practice.

11. The code in the `TestSupplyChain.js` uses the following string as `null` address:
```javascript
const emptyAddress = '0x00000000000000000000000000000000000000';
```
I use `address(0)` in Smart Contract code to indicate the address, which is zero. It corresponds to
the following string in JavaScript:
```javascript
const emptyAddress = "0x0000000000000000000000000000000000000000";
```
As you can probably see, these two strings have difference in two zeros. The first one fails my assertion,
that buyer address is emptyAddress. The second one does not.

12. The starter code `app.js` tries to fill the element with id `ftc-item`, but there is no such element
in `index.html` in the starter code.

13. Starter code points to the contract .json file like this: `../../build/contracts/SupplyChain.json`
It does not work. JQuery fails to locate any file at this path.
The correct file path would be `.build/contracts/SupplyChain.json`.

14. When you write tests, your test code is responsible to deploy the contract.
When you test your frontend, you need to explicitly deploy your contract to the
test network.
To do that you need to create the migration .js file, that deploys your contract.
Then call `truffle deploy --network development_cli`, if your network is `development_cli`.

15. Contract methods in the app.js starter code use `web3`, that is undefined. It is undefined,
b/c it is not set anywhere. Starter code sets `App.web3Provider` instead. But never uses it.
I need to set App.web3 in order to use the web3 object capabilities:
```javascript
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
        // BELOW LINE SETS THE App.web3 variable, so it can be used again
        App.web3 = new Web3(App.web3Provider);
        App.getMetaskAccountID();

        return App.initSupplyChain();
    },
```

16. Starter code in app.js, that initializes the App does not work properly, b/c it is sync!
Yes, it sets the stuff under the hood, but things work afterwards only b/c the time required to
set the metamask id and web3Provider is small on development network and the other part of the code
does not use anything from that (see point 15).
In starter code:
```javascript
$(function () {
    $(window).load(function () {
        App.init();
        console.log(App.web3); // HERE YOU WILL SEE UNDEFINED IN THE CONSOLE!!!
    });
});
```
The async version of the starter code that works:
```javascript
$(function () {
    $(window).load(async function () {
        await App.init();
        console.log(App.web3); // HERE YOU WILL SEE THE PROPER WEB3 OBJECT IN THE CONSOLE!
    });
});
```
17. Thank you, Metamask. You inject the web3 provider, that does not have `utils`, so I have no way to
do conversion operations and big number conversions and checks with this object.
18. Thank you, Metamask. You suppress the error messages that my contract returns and throw your
own error instead. And there is not any way to find out what happened.
My contract throws:
```solidity
modifier grapeExists(uint _grapeId) {
    require(grapes[_grapeId].grapeId > 0, "Grape with this id does not exist.");
    _;
}
```
You show:
```
MetaMask - RPC Error: Internal JSON-RPC error. {code: -32603, message: "Internal JSON-RPC error."}
```