# Setting up your local development environment
## Environment Components
1. Local Etherium Network
2. Contract compiler
3. Automated test runner

## Local Etherium Network
I will use ganache-cli as local etherium network.

To install ganache-cli, one needs to run 
```bash
npm install -g ganache-cli
```

To run ganache-cli, one needs to run
```bash
ganache-cli
```

## Contract compiler and Automated test runner
I will use truffle suite for contract compilation and 
automated testing.

To use Truffle, one needs to create a truffle project
first. Sadly, truffle does not allow you to create the
project in directory, that is not empty. So, use the 
command below in the empty directory:
```bash
truffle init
```

It will create the directory structure, that truffle replies
on. It will also create the `truffle-config.js`.

Now, to hook up his local etherium network, one needs to
create `truffle.js` file in the project root folder.
The file shall describe at least one network, that 
points to the ganache-cli:
```javascript
// See <http://truffleframework.com/docs/advanced/configuration>
// to customize your Truffle configuration!
module.exports = {
    networks: {
        development_cli: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*"
        }
};
```

After that, one can create automated tests and run them. 
One shall use this command to run the `YourTest.js` test
file, that is located in `<project root>/test` folder.

Below is the command syntax (executed from project root 
folder)
```bash
truffle test --network development_cli test/YourTests.js
```

That's it. Thanks for reading.