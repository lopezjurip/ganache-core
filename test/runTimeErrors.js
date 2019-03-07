const Web3 = require("web3");
const assert = require("assert");
const Ganache = require(process.env.TEST_BUILD
  ? "../build/ganache.core." + process.env.TEST_BUILD + ".js"
  : "../index.js");
const fs = require("fs");
const path = require("path");
const solc = require("solc");
const to = require("../lib/utils/to");
const initializeTestProvider = require("./helpers/web3/initializeTestProvider");

describe("Runtime Errors with vmErrorsOnRPCResponse = true:", function() {
  let web3, provider;

  const testState = {
    accounts: null,
    ErrorContract: null,
    errorInstance: null,
    code: null
  };

  before("Setting up provider", async function() {
    const context = await initializeTestProvider({
      vmErrorsOnRPCResponse: true
    });
    web3 = context.web3;
    provider = context.provider;
  });

  before("get accounts", async function() {
    testState.accounts = await web3.eth.getAccounts();
  });

  before("compile source", async function() {
    this.timeout(10000);

    const source = fs.readFileSync(path.join(__dirname, "RuntimeError.sol"), "utf8");
    const result = solc.compile({ sources: { "RuntimeError.sol": source } }, 1);

    testState.code = "0x" + result.contracts["RuntimeError.sol:RuntimeError"].bytecode;
    const abi = JSON.parse(result.contracts["RuntimeError.sol:RuntimeError"].interface);

    testState.ErrorContract = new web3.eth.Contract(abi);
    testState.ErrorContract._code = testState.code;
    const instance = await testState.ErrorContract.deploy({ data: testState.code }).send({
      from: testState.accounts[0],
      gas: 3141592
    });

    // TODO: ugly workaround - not sure why this is necessary.
    if (!instance._requestManager.provider) {
      instance._requestManager.setProvider(web3.eth._provider);
    }
    testState.errorInstance = instance;
  });

  it("should output the transaction hash even if an runtime error occurs (out of gas)", function(done) {
    // we can't use `web3.eth.sendTransaction` because it will obfuscate the result
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [
          {
            from: testState.accounts[0],
            data: testState.code
          }
        ],
        id: 1
      },
      function(_, result) {
        if (provider.options.vmErrorsOnRPCResponse) {
          // null & undefined are equivalent for equality tests, but I'm being
          // pedantic here for readability's sake
          assert(result.error !== null);
          assert(result.error !== undefined);
        } else {
          assert(result.error === undefined);
        }

        // null & undefined are equivalent for equality tests, but I'm being
        // pedantic here for readability's sake
        assert(result.result !== null);
        assert(result.result !== undefined);

        assert.strictEqual(result.result.length, 66); // transaction hash
        done();
      }
    );
  });

  it("should output the transaction hash even if a runtime error occurs (revert)", function(done) {
    // we can't use `web3.eth.sendTransaction` because it will obfuscate the result
    provider.send(
      {
        jsonrpc: "2.0",
        id: new Date().getTime(),
        method: "eth_sendTransaction",
        params: [
          {
            from: testState.accounts[0],
            to: testState.errorInstance.options.address,
            // calls error()
            data: "0xc79f8b62",
            gas: to.hex(3141592)
          }
        ]
      },
      function(_, response) {
        if (provider.options.vmErrorsOnRPCResponse) {
          // null & undefined are equivalent for equality tests, but I'm being
          // pedantic here for readability's sake
          assert(response.error !== null);
          assert(response.error !== undefined);

          assert(
            /revert/.test(response.error.message),
            `Expected error message (${response.error.message}) to contain 'revert'`
          );
        } else {
          assert(response.error === undefined);
        }

        // null & undefined are equivalent for equality tests, but I'm being
        // pedantic here for readability's sake
        assert(response.result !== null);
        assert(response.result !== undefined);

        assert.strictEqual(response.result.length, 66); // transaction hash

        done();
      }
    );
  });

  it("should have correct return value when calling a method that reverts without message", function(done) {
    provider.send(
      {
        jsonrpc: "2.0",
        id: new Date().getTime(),
        method: "eth_call",
        params: [
          {
            from: testState.accounts[0],
            to: testState.errorInstance.options.address,
            // calls error()
            data: "0xc79f8b62",
            gas: to.hex(3141592)
          }
        ]
      },
      function(_, response) {
        if (provider.options.vmErrorsOnRPCResponse) {
          // null & undefined are equivalent for equality tests, but I'm being
          // pedantic here for readability's sake
          assert(response.error !== null);
          assert(response.error !== undefined);
          assert(response.result === undefined || response.result === null);

          assert(
            /revert/.test(response.error.message),
            `Expected error message (${response.error.message}) to contain 'revert'`
          );
        } else {
          assert(response.error === undefined);
          assert(response.result === "0x");
        }

        done();
      }
    );
  });

  it("should have correct return value when calling a method that reverts without message", function(done) {
    provider.send(
      {
        jsonrpc: "2.0",
        id: new Date().getTime(),
        method: "eth_call",
        params: [
          {
            from: testState.accounts[0],
            to: testState.errorInstance.options.address,
            // calls error()
            data: "0xc79f8b62",
            gas: to.hex(3141592)
          }
        ]
      },
      function(_, response) {
        if (provider.options.vmErrorsOnRPCResponse) {
          // null & undefined are equivalent for equality tests, but I'm being
          // pedantic here for readability's sake
          assert(response.error !== null);
          assert(response.error !== undefined);
          assert(response.result === undefined || response.result === null);

          assert(
            /revert/.test(response.error.message),
            `Expected error message (${response.error.message}) to contain 'revert'`
          );
        } else {
          assert(response.error === undefined);
          assert(response.result === "0x");
        }

        done();
      }
    );
  });

  it("should have correct return value when calling a method that reverts with message", function(done) {
    provider.send(
      {
        jsonrpc: "2.0",
        id: new Date().getTime(),
        method: "eth_call",
        params: [
          {
            from: testState.accounts[0],
            to: testState.errorInstance.options.address,
            // calls error()
            data: "0xcd4aed30",
            gas: to.hex(3141592)
          }
        ]
      },
      function(_, response) {
        if (provider.options.vmErrorsOnRPCResponse) {
          // null & undefined are equivalent for equality tests, but I'm being
          // pedantic here for readability's sake
          assert(response.error !== null);
          assert(response.error !== undefined);
          assert(response.result === undefined || response.result === null);

          // RuntimeError.sol reverts with revert("Message")
          assert(
            /Message/.test(response.error.message),
            `Expected error message (${response.error.message}) to contain revert reason "Message"`
          );
          assert(
            /revert/.test(response.error.message),
            `Expected error message (${response.error.message}) to contain 'revert'`
          );
        } else {
          assert(response.error === undefined);
          assert(
            response.result ===
              "0x08c379a000000000000000000000000000000000000000000000000000000000000000" +
                "2000000000000000000000000000000000000000000000000000000000000000074d6573" +
                "7361676500000000000000000000000000000000000000000000000000"
          );
        }
        done();
      }
    );
  });

  it("should output instruction index on runtime errors", function(done) {
    provider.send(
      {
        jsonrpc: "2.0",
        id: new Date().getTime(),
        method: "eth_sendTransaction",
        params: [
          {
            from: testState.accounts[0],
            to: testState.errorInstance.options.address,
            // calls error()
            data: "0xc79f8b62",
            gas: to.hex(3141592)
          }
        ]
      },
      function(err, response) {
        if (err) {
          assert(err);
        }
        let txHash = response.result;

        assert(response.error);
        assert(response.error.data[txHash]);
        // magic number, will change if compiler changes.
        assert.strictEqual(to.number(response.error.data[txHash].program_counter), 91);
        done();
      }
    );
  });

  after("shutdown", function(done) {
    let provider = web3._provider;
    web3.setProvider();
    provider.close(done);
  });
});

describe("Runtime Errors with vmErrorsOnRPCResponse = false:", function() {
  const provider = Ganache.provider({
    vmErrorsOnRPCResponse: false
  });

  const web3 = new Web3(provider);

  const testState = {
    accounts: null,
    ErrorContract: null,
    errorInstance: null,
    code: null
  };

  before("get accounts", async function() {
    testState.accounts = await web3.eth.getAccounts();
  });

  before("compile source", async function() {
    this.timeout(10000);

    const source = fs.readFileSync(path.join(__dirname, "RuntimeError.sol"), "utf8");
    const result = solc.compile({ sources: { "RuntimeError.sol": source } }, 1);

    testState.code = "0x" + result.contracts["RuntimeError.sol:RuntimeError"].bytecode;
    const abi = JSON.parse(result.contracts["RuntimeError.sol:RuntimeError"].interface);

    testState.ErrorContract = new web3.eth.Contract(abi);
    testState.ErrorContract._code = testState.code;
    const instance = await testState.ErrorContract.deploy({ data: testState.code }).send({
      from: testState.accounts[0],
      gas: 3141592
    });

    // TODO: ugly workaround - not sure why this is necessary.
    if (!instance._requestManager.provider) {
      instance._requestManager.setProvider(web3.eth._provider);
    }
    testState.errorInstance = instance;
  });

  it("should output the transaction hash even if an runtime error occurs (out of gas)", function(done) {
    // we can't use `web3.eth.sendTransaction` because it will obfuscate the result
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [
          {
            from: testState.accounts[0],
            data: testState.code
          }
        ],
        id: 1
      },
      function(_, result) {
        if (provider.options.vmErrorsOnRPCResponse) {
          // null & undefined are equivalent for equality tests, but I'm being
          // pedantic here for readability's sake
          assert(result.error !== null);
          assert(result.error !== undefined);
        } else {
          assert(result.error === undefined);
        }

        // null & undefined are equivalent for equality tests, but I'm being
        // pedantic here for readability's sake
        assert(result.result !== null);
        assert(result.result !== undefined);

        assert.strictEqual(result.result.length, 66); // transaction hash
        done();
      }
    );
  });

  it("should output the transaction hash even if a runtime error occurs (revert)", function(done) {
    // we can't use `web3.eth.sendTransaction` because it will obfuscate the result
    provider.send(
      {
        jsonrpc: "2.0",
        id: new Date().getTime(),
        method: "eth_sendTransaction",
        params: [
          {
            from: testState.accounts[0],
            to: testState.errorInstance.options.address,
            // calls error()
            data: "0xc79f8b62",
            gas: to.hex(3141592)
          }
        ]
      },
      function(_, response) {
        if (provider.options.vmErrorsOnRPCResponse) {
          // null & undefined are equivalent for equality tests, but I'm being
          // pedantic here for readability's sake
          assert(response.error !== null);
          assert(response.error !== undefined);

          assert(
            /revert/.test(response.error.message),
            `Expected error message (${response.error.message}) to contain 'revert'`
          );
        } else {
          assert(response.error === undefined);
        }

        // null & undefined are equivalent for equality tests, but I'm being
        // pedantic here for readability's sake
        assert(response.result !== null);
        assert(response.result !== undefined);

        assert.strictEqual(response.result.length, 66); // transaction hash

        done();
      }
    );
  });

  it("should have correct return value when calling a method that reverts without message", function(done) {
    provider.send(
      {
        jsonrpc: "2.0",
        id: new Date().getTime(),
        method: "eth_call",
        params: [
          {
            from: testState.accounts[0],
            to: testState.errorInstance.options.address,
            // calls error()
            data: "0xc79f8b62",
            gas: to.hex(3141592)
          }
        ]
      },
      function(_, response) {
        if (provider.options.vmErrorsOnRPCResponse) {
          // null & undefined are equivalent for equality tests, but I'm being
          // pedantic here for readability's sake
          assert(response.error !== null);
          assert(response.error !== undefined);
          assert(response.result === undefined || response.result === null);

          assert(
            /revert/.test(response.error.message),
            `Expected error message (${response.error.message}) to contain 'revert'`
          );
        } else {
          assert(response.error === undefined);
          assert(response.result === "0x");
        }

        done();
      }
    );
  });

  it("should have correct return value when calling a method that reverts without message", function(done) {
    provider.send(
      {
        jsonrpc: "2.0",
        id: new Date().getTime(),
        method: "eth_call",
        params: [
          {
            from: testState.accounts[0],
            to: testState.errorInstance.options.address,
            // calls error()
            data: "0xc79f8b62",
            gas: to.hex(3141592)
          }
        ]
      },
      function(_, response) {
        if (provider.options.vmErrorsOnRPCResponse) {
          // null & undefined are equivalent for equality tests, but I'm being
          // pedantic here for readability's sake
          assert(response.error !== null);
          assert(response.error !== undefined);
          assert(response.result === undefined || response.result === null);

          assert(
            /revert/.test(response.error.message),
            `Expected error message (${response.error.message}) to contain 'revert'`
          );
        } else {
          assert(response.error === undefined);
          assert(response.result === "0x");
        }

        done();
      }
    );
  });

  it("should have correct return value when calling a method that reverts with message", function(done) {
    provider.send(
      {
        jsonrpc: "2.0",
        id: new Date().getTime(),
        method: "eth_call",
        params: [
          {
            from: testState.accounts[0],
            to: testState.errorInstance.options.address,
            // calls error()
            data: "0xcd4aed30",
            gas: to.hex(3141592)
          }
        ]
      },
      function(_, response) {
        if (provider.options.vmErrorsOnRPCResponse) {
          // null & undefined are equivalent for equality tests, but I'm being
          // pedantic here for readability's sake
          assert(response.error !== null);
          assert(response.error !== undefined);
          assert(response.result === undefined || response.result === null);

          // RuntimeError.sol reverts with revert("Message")
          assert(
            /Message/.test(response.error.message),
            `Expected error message (${response.error.message}) to contain revert reason "Message"`
          );
          assert(
            /revert/.test(response.error.message),
            `Expected error message (${response.error.message}) to contain 'revert'`
          );
        } else {
          assert(response.error === undefined);
          assert(
            response.result ===
              "0x08c379a000000000000000000000000000000000000000000000000000000000000000" +
                "2000000000000000000000000000000000000000000000000000000000000000074d6573" +
                "7361676500000000000000000000000000000000000000000000000000"
          );
        }

        done();
      }
    );
  });

  after("shutdown", function(done) {
    let provider = web3._provider;
    web3.setProvider();
    provider.close(done);
  });
});
