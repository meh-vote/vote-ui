/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   approveMeh: () => (/* binding */ approveMeh),
/* harmony export */   claim: () => (/* binding */ claim),
/* harmony export */   params: () => (/* binding */ params),
/* harmony export */   vote: () => (/* binding */ vote)
/* harmony export */ });
/* harmony import */ var _print_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _wallet_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var _addr_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);
/* harmony import */ var _product_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_wallet_js__WEBPACK_IMPORTED_MODULE_1__, _addr_js__WEBPACK_IMPORTED_MODULE_2__, _product_js__WEBPACK_IMPORTED_MODULE_3__, _common_js__WEBPACK_IMPORTED_MODULE_4__]);
([_wallet_js__WEBPACK_IMPORTED_MODULE_1__, _addr_js__WEBPACK_IMPORTED_MODULE_2__, _product_js__WEBPACK_IMPORTED_MODULE_3__, _common_js__WEBPACK_IMPORTED_MODULE_4__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);







// ****************************
// Todo list
// ****************************
//     --- HIGH ---
// [ ] account for multi-wallet
// [ ] update data after transaction submits
//     ... remaining contracts, contracts owned, available Meh
// [ ] write and use an updateMehApprovel function, for value and display, on approval and removal
// [ ] use wallet icon and rearrage wallet-display on narrower screens/devices
// [ ] helper to add Meh token to wallet
// [ ] periodic (every X min) refresh of product data (reconcile with pending txs)
// [ ] sort closed products to the end
//     --- MEDIUM ---
// [ ] spinner when waiting for tx to finish / indicator for pending transactions (toaster?)
// [ ] success message when tx finishes on chain (toaster?)
// [ ] ^^^ or ^^^ periodic check of any (new) txs on contract, then update
// [ ] work in persistent storage, record first time through and show splash with setup instructions
//     --- LOW ---
// [ ] move x/y contract count to stay visible on card change
// [ ] clean up all the code, no really, it's rough
// [ ] prize Meh indicator / leaderboard

const params = {
//    preferredNetwork: '0x14a34', // Sepolia
    preferredNetwork: '0x2105', // Base
    gameId: 1,
    timerDiv: document.getElementById("timer"),
    gameClockDiv: document.getElementById("game_clock"),
    timerStatusDiv: document.getElementById("timer_status"),
    contentDiv: document.getElementById("content"),
    tokenScale: 1000000000000000000,
    assumedContracts: 1,
    gameStatus: 2, // 0 = not started, 1 = started, 2 = ended
    transactionQueue : [],
    updatesOnChain : false
};

_common_js__WEBPACK_IMPORTED_MODULE_4__.sharedData.view = 'vote';

let products = [];

try {
    if (window.ethereum) {
        console.log(`Found provider at 'window.ethereum'`);
    }
} catch (error) {
    (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)("This d/app requires a web3 provider, like MetaMask", true);
    throw new Error(error);
}

await (0,_wallet_js__WEBPACK_IMPORTED_MODULE_1__.init)(params.preferredNetwork);
await loadGameData();
await setGameStatus();
if (params.gameStatus < 2) {
    showTimer();
    await loadProductData();
    updateTransactionQueue();
}

// ****************************
// all the VOTE specific things
// ****************************

async function loadGameData() {
    let gameDetails = await _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEHVote.methods.games(params.gameId).call();
    params.gameStart = Number(gameDetails.begin) * 1000;
    params.gameEnd = Number(gameDetails.end) * 1000;
//    console.log(`game start: ${new Date(params.gameStart).toLocaleString()}, game end: ${new Date(params.gameEnd).toLocaleString()}`);
}

async function loadProductData() {
    let gameProducts = await _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEHVote.methods.getProductsByGameId(params.gameId).call();

    products = [];
    for (let i = 0; i < gameProducts.length; i++) {
        products.push(new _product_js__WEBPACK_IMPORTED_MODULE_3__.product({
            id: Number(gameProducts[i].id),
            name: gameProducts[i].name,
            contractsDeposited: Number(gameProducts[i].mehContractsDeposited), // meh contracts deposited
            mehContracts: Number(gameProducts[i].mehContracts),
            contractPrice: (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.cleanBigInt)(gameProducts[i].mehContractPrice, params.tokenScale),
            prizeMeh: (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.cleanBigInt)(gameProducts[i].prizeMeh, params.tokenScale),
            mehStore: gameProducts[i].mehStore,
            begin: Number(gameProducts[i].begin),
            end: Number(gameProducts[i].end),
            limitedRun: gameProducts[i].limitedRun,
            totalContracts: Number(gameProducts[i].totalContracts)
        }));
        await products[i].asyncInit();
    };

    // sort by product begin
    products = products.sort(function (a, b) { return a.begin - b.begin });

    let lastProductend =products.reduce((maxEnd, currProduct) => {return (currProduct.end > maxEnd.end) ? currProduct : maxEnd});
    if (params.gameEnd < lastProductend.end) {
        params.gameEnd = lastProductend.end;
        checkGameStatus();
    }

    params.contentDiv.innerHTML = '';
    for (let i = 0; i < products.length; i++) {
        params.contentDiv.insertAdjacentElement('beforeend', products[i].html);
    };
}

async function setGameStatus() {
    await checkGameStatus();
    var x = setInterval(function () { checkGameStatus(); }, 60000); // Update the game status every minute
}

async function checkGameStatus() {
    var now = new Date().getTime();
    if (params.gameEnd < now) { // game has ended
        params.gameStatus = 2;
        params.timerDiv.innerHTML = "EXPIRED";
    } else if (params.gameStart > now) { // game hasn't started
        params.gameStatus = 0;
        params.countDownDate = new Date(params.gameStart).getTime();
        params.timerStatusDiv.innerHTML = "Game Starts In:";
    } else { // game is running
        params.gameStatus = 1;
        params.countDownDate = new Date(params.gameEnd).getTime();
        params.timerStatusDiv.innerHTML = "Game Ends In:";
    }
}

function updateTransactionQueue() {
    var x = setInterval(function () { checkTransactionQueue(); }, 120000); // Check for completion of pending txs every 2 minutes
}

async function checkTransactionQueue() {
    if (params.transactionQueue && params.transactionQueue.length > 0) {
        for (let i =  params.transactionQueue.length - 1 ; i >= 0 ; i--) {
            ethereum.request({
                "method": "eth_getTransactionReceipt",
                "params": [params.transactionQueue[i]]
            }).then(function (receipt) {
                if (receipt != null) {
                    console.info(`transaction complete: ${params.transactionQueue[i]}`);
                    params.transactionQueue.splice(i, 1);
                    params.updatesOnChain = true;
                }
            });
        };
        if (params.updatesOnChain && params.transactionQueue.length == 0) {
            loadProductData();
            params.updatesOnChain = false;
            console.log("loaded new updates from chain");
        }
    } else {
        console.info("No pending txs");
    }
}

function showTimer() {
    params.timerId = setInterval(function () {
        var now = new Date().getTime();
        var distance = params.countDownDate - now;

        var days = (Math.floor(distance / (1000 * 60 * 60 * 24))).toString().padStart(2, '0');
        var hours = (Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).toString().padStart(2, '0');
        var minutes = (Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).toString().padStart(2, '0');
        var seconds = (Math.floor((distance % (1000 * 60)) / 1000)).toString().padStart(2, '0');

        params.timerDiv.innerHTML = `${days}:${hours}:${minutes}:${seconds}`;

        if (distance < (1000 * 60 * 60)) { // 1 hour
            params.gameClockDiv.classList.add("limited_time");
        }

        if (distance < 0 || params.gameStatus == 2) {
            clearInterval(params.timerId);
            params.timerDiv.innerHTML = "EXPIRED";
        }
    }, 1000); // Update the count down every second
}
async function vote(_productId) {
    const accounts = await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.getAccounts)();
    const productCost = products.find(product => product.id == _productId).contractPrice;
    if (accounts.length <= 0) {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)("connect a provider like metamask");
        throw new Error("connect to metamask");
    }

    if (_common_js__WEBPACK_IMPORTED_MODULE_4__.sharedData.currApproval < productCost) {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)("Approval insufficient for product<br />approve more from link in header");
        throw new Error("Approval insufficient for product");
    }

    if (_common_js__WEBPACK_IMPORTED_MODULE_4__.sharedData.currMehBalance < productCost) {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)("Insufficient Meh for product<br />buy more from link in header");
        throw new Error("Insufficient Meh for product");
    }

    let gas = {}
    try {
        gas = await (0,_wallet_js__WEBPACK_IMPORTED_MODULE_1__.calcGas)({
            account: accounts[0],
            context: _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEHVote.methods,
            func: 'depositMeh',
            args: [params.gameId, _productId, params.assumedContracts]
        })
    } catch (e) {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)(`${e.message}`);
        return;
    };
//     console.log(gas);

    const tx = {
        'from': accounts[0],
        'to': _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEH_VOTE,
        'data': _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEHVote.methods.depositMeh(params.gameId, _productId, params.assumedContracts).encodeABI(),
        'gas': _addr_js__WEBPACK_IMPORTED_MODULE_2__.web3.utils.toHex(gas.estimatedGas),
        'gasPrice': _addr_js__WEBPACK_IMPORTED_MODULE_2__.web3.utils.toHex(gas.gasPrice)
    };
    //console.log(`calling vote. game: ${params.gameId}, productId: ${_productId}, contracts: ${params.assumedContracts}`);
    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(async result => {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showSuccess)('approve tx complete', result);
        params.transactionQueue.push(result);
    }, error => {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
};

async function approveMeh(amt) {
    const accounts = await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.getAccounts)();
    if (accounts.length <= 0) {
        throw new Error("connect to metamask");
    }

    var amtWei = _addr_js__WEBPACK_IMPORTED_MODULE_2__.web3.utils.toWei(amt.toString(), 'ether');

    let gas = {}
    try {
        gas = await (0,_wallet_js__WEBPACK_IMPORTED_MODULE_1__.calcGas)({
            account: accounts[0],
            context: _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEHToken.methods,
            func: 'approve',
            args: [_addr_js__WEBPACK_IMPORTED_MODULE_2__.MEH_VOTE, amtWei]
        })
    } catch (e) {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)(`${e.message}`);
        return;
    };

    const tx = {
        'from': accounts[0],
        'to': _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEH_TOKEN,
        'data': _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEHToken.methods.approve(_addr_js__WEBPACK_IMPORTED_MODULE_2__.MEH_VOTE, amtWei).encodeABI(),
        'gas': _addr_js__WEBPACK_IMPORTED_MODULE_2__.web3.utils.toHex(gas.estimatedGas),
        'gasPrice': _addr_js__WEBPACK_IMPORTED_MODULE_2__.web3.utils.toHex(gas.gasPrice)
    };

    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(result => {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showSuccess)('approve tx complete', result);
        params.transactionQueue.push(result);
        //        updateMehApproval(amt);
    }, error => {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
}

async function claim(_productId) {
    const accounts = await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.getAccounts)();
    if (accounts.length <= 0) {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)("connect a provider like metamask");
        throw new Error("connect to metamask");
    }

    let gas = {}
    try {
        gas = await (0,_wallet_js__WEBPACK_IMPORTED_MODULE_1__.calcGas)({
            account: accounts[0],
            context: _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEHVote.methods,
            func: 'claim',
            args: [params.gameId, _productId]
        })
    } catch (e) {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)(`${e.message}`);
        return;
    };

    const tx = {
        'from': accounts[0],
        'to': _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEH_VOTE,
        'data': _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEHVote.methods.claim(params.gameId, _productId).encodeABI(),
        'gas': _addr_js__WEBPACK_IMPORTED_MODULE_2__.web3.utils.toHex(gas.estimatedGas),
        'gasPrice': _addr_js__WEBPACK_IMPORTED_MODULE_2__.web3.utils.toHex(gas.gasPrice)
    };
    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(async result => {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showSuccess)('approve tx complete', result);
        params.transactionQueue.push(result);
    }, error => {
        (0,_common_js__WEBPACK_IMPORTED_MODULE_4__.showErrors)(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
};

// ****************************
// SAMPLE / TEST CODE BELOW
// ****************************

window.MEHToken = _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEHToken;
window.MEHVote = _addr_js__WEBPACK_IMPORTED_MODULE_2__.MEHVote;
window.vote = vote;
window.loadProductData = loadProductData;


__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ }),
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ printMe)
/* harmony export */ });
function printMe() {
  console.log('I get called from print.js!');
}


/***/ }),
/* 2 */
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MEHScale: () => (/* binding */ MEHScale),
/* harmony export */   calcGas: () => (/* binding */ calcGas),
/* harmony export */   checkWallet: () => (/* binding */ checkWallet),
/* harmony export */   currWallet: () => (/* binding */ currWallet),
/* harmony export */   getGasPrice: () => (/* binding */ getGasPrice),
/* harmony export */   init: () => (/* binding */ init),
/* harmony export */   provider: () => (/* binding */ provider),
/* harmony export */   reloadClient: () => (/* binding */ reloadClient),
/* harmony export */   showError: () => (/* binding */ showError),
/* harmony export */   showSuccess: () => (/* binding */ showSuccess),
/* harmony export */   switchNetwork: () => (/* binding */ switchNetwork),
/* harmony export */   truncAddr: () => (/* binding */ truncAddr),
/* harmony export */   updateConnectionStatus: () => (/* binding */ updateConnectionStatus),
/* harmony export */   userReady: () => (/* binding */ userReady)
/* harmony export */ });
/* harmony import */ var _abi_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);
/* harmony import */ var _addr_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5);
/* harmony import */ var _vote_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(0);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_addr_js__WEBPACK_IMPORTED_MODULE_1__, _common_js__WEBPACK_IMPORTED_MODULE_2__, _vote_js__WEBPACK_IMPORTED_MODULE_3__]);
([_addr_js__WEBPACK_IMPORTED_MODULE_1__, _common_js__WEBPACK_IMPORTED_MODULE_2__, _vote_js__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);





const MEHScale = 1000000000000000000;
let currWallet = null;
let preferredNetwork = null;
let provider = null;

const prepWallet = {
    ethereumProvider: false,
    walletConnected: false,
    correctChain: false,
    tokenAdded: false
};
let userReady = false;

// 1. wallet/'ethereum' available
// 2. have the right chain? add the chain?
// 3. on the right chain? switch chain?
// 4. have the token? add the token?
// 5. get wallet address(s)

async function init( _chainId = _addr_js__WEBPACK_IMPORTED_MODULE_1__.defaultChainId) {
    console.log(`1 ... _chainId: ${_chainId}, defaultChainId: ${_addr_js__WEBPACK_IMPORTED_MODULE_1__.defaultChainId}`);
    try {
/*        provider = await detectEthereumProvider(); // defined in @metamask/detect-provider
        if (provider) {
            if (provider !== window.ethereum) {
                console.error('Do you have multiple wallets installed?');
            } else {
                console.info('Ethereum provider successfully detected!');
                prepWallet.ethereumProvider = (ethereum.isConnected())?true:false;
            }
        } else {
            helpProvider();
            console.error('Please install MetaMask!');
            return;
        };
*/

        await (0,_addr_js__WEBPACK_IMPORTED_MODULE_1__.init)();

        preferredNetwork = (_chainId)?_chainId:_addr_js__WEBPACK_IMPORTED_MODULE_1__.chainId;
        console.log(`2 ... preferredNetwork: ${preferredNetwork}`);

        await _addr_js__WEBPACK_IMPORTED_MODULE_1__.web3.eth.getAccounts().then(async (accounts) => {
            if (accounts.length === 0) {
                console.log('No connected accounts');
                await connect();
            } else {
                console.log('Connected with account:', accounts[0]);
                currWallet = accounts[0].toLowerCase();
                _common_js__WEBPACK_IMPORTED_MODULE_2__.sharedData.currMehBalance = await _addr_js__WEBPACK_IMPORTED_MODULE_1__.MEHToken.methods.balanceOf(currWallet).call().then((result) => {return (0,_common_js__WEBPACK_IMPORTED_MODULE_2__.cleanBigInt)(result,_vote_js__WEBPACK_IMPORTED_MODULE_3__.params.tokenScale)});
                updateConnectionStatus();
            }
        }).catch(error => {
            console.error('Failed to fetch accounts:', error);
        });

    } catch (err) {
        console.log(err);
        return;
    };

/*
    if (prepWallet.ethereumProvider) { // Handle user accounts
        ethereum
            .request({ method: 'eth_accounts' })
            .then(async (accounts) => {
//                console.log('got accounts', accounts);
                if (accounts.length > 0) {
                    currWallet = accounts[0].toLowerCase();
                    sharedData.currMehBalance = await MEHToken.methods.balanceOf(currWallet).call().then((result) => {return cleanBigInt(result,params.tokenScale)});
                    updateConnectionStatus();
                } else {
                    connect();
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };
*/
    // Handle chain (network) and chainChanged (EIP-1193)
    ethereum.on('chainChanged', handleChainChanged);
    // Handle user accountsChanged (EIP-1193)
    ethereum.on('accountsChanged', handleAccountsChanged);

    ethereum.on('disconnect', reloadClient);

//    console.log('wallet init complete');
};

function handleChainChanged(_chainId) {
    // When chain changes, Metamask recommends reloading the page
    reloadClient();
}

function reloadClient() {
    // When chain changes, Metamask recommends reloading the page
    window.location.reload();
}

function handleAccountsChanged(accounts) {
    // When chain changes, Metamask recommends reloading the page
    reloadClient();
};

// Access user's accounts (EIP-1102)
async function connect() {
    await ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleAccountsChanged)
        .catch((err) => {
            if (err.code === 4001) {
                // user rejected connection request (EIP-1193)
                (0,_common_js__WEBPACK_IMPORTED_MODULE_2__.showErrors)('User rejected connection request.', true);
                console.log('Please connect to MetaMask.');
            } else {
                console.error(err);
            }
        });
}

async function updateConnectionStatus() {
//    console.log('wallet.js updateConnectionStatus()');
    const walletDiv = document.getElementById("wallet_status");

    if (window.ethereum && currWallet) {
//        console.log('IF wallet.js updateConnectionStatus()');
        checkWallet(currWallet);
        document.body.classList.add("connected");
        walletDiv.innerText = 'Connected';
        document.body.classList.remove("disconnected");
        walletDiv.removeEventListener("click",connect);
        console.info('Wallet:',currWallet);
        const faucet_btn = document.getElementById('faucet_btn');
        if (faucet_btn) {
            faucet_btn.removeEventListener("click",connect);
            faucet_btn.addEventListener("click",dripFaucet);
        };
        if (_common_js__WEBPACK_IMPORTED_MODULE_2__.sharedData.view == 'vote') {tokenDisplay()};
    } else {
//        console.log('ELSE wallet.js updateConnectionStatus()');
        currWallet = null;
        document.body.classList.add("disconnected");
        walletDiv.innerText = 'Connect';
        document.body.classList.remove("connected");
        walletDiv.addEventListener("click",connect);
        const faucet_btn = document.getElementById('faucet_btn');
        if (faucet_btn) {
            faucet_btn.removeEventListener("click",dripFaucet);
            faucet_btn.addEventListener("click",connect);
        };
    };
}

// Prompt the user to switch network
async function switchNetwork(_chainId = _addr_js__WEBPACK_IMPORTED_MODULE_1__.defaultChainId) {
    console.log(`_chainId: ${_chainId}, chainId: ${_addr_js__WEBPACK_IMPORTED_MODULE_1__.chainId}, defaultChainId: ${_addr_js__WEBPACK_IMPORTED_MODULE_1__.defaultChainId}`);
    if (_chainId != _addr_js__WEBPACK_IMPORTED_MODULE_1__.chainId) {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: _chainId }]
        }).then((out) => {
            handleChainChanged(null);
        }).catch((e) => {
            if (e.code === 4902) {
                (0,_common_js__WEBPACK_IMPORTED_MODULE_2__.helpChain)(_chainId);
            }
            throw new Error("Could not connect to a supported network");
        });
    };
};

async function checkWallet(walletAddress = null) {
    let useWallet = walletAddress;
    if (!useWallet) {
        throw new Error("connect to metamask");
    };
    // is wallet on a supported chain?
    switchNetwork(preferredNetwork);

    return;
}

async function dripFaucet() {
//    var amtWei = web3.utils.toWei(amt.toString(),'ether');
    const MEHFaucet = new _addr_js__WEBPACK_IMPORTED_MODULE_1__.web3.eth.Contract(_abi_js__WEBPACK_IMPORTED_MODULE_0__.abiFaucet, _addr_js__WEBPACK_IMPORTED_MODULE_1__.MEH_FAUCET);

    let gas = {}
    try {gas = await calcGas({
        account: currWallet,
        context: MEHFaucet.methods,
        func: 'faucet'
    })} catch(e) {
        console.error(`MEH: ${e.message}`);
        showError();
        return;
    };

    const tx = {
        'from': currWallet,
        'to': _addr_js__WEBPACK_IMPORTED_MODULE_1__.MEH_FAUCET,
        'data': MEHFaucet.methods.faucet().encodeABI(),
        'gas': _addr_js__WEBPACK_IMPORTED_MODULE_1__.web3.utils.toHex(gas.estimatedGas),
        'gasPrice': _addr_js__WEBPACK_IMPORTED_MODULE_1__.web3.utils.toHex(gas.gasPrice)
    };

    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(result => {
        showSuccess('MEH drip tx complete');
        let tmp = document.getElementById('faucet_btn');
        tmp.src = '/images/meh_btn_money.png';
    },error => {
        console.error(`MEH: ${error.message}`)
        showError();
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
}

async function calcGas({account, context, func, args = null}) {
    let gasPrice = await getGasPrice();
    gasPrice = Math.trunc(Number(gasPrice) * 1.5);
  
    let estimatedGas = await context[func].apply(null,args?args:null).estimateGas({from: account})
      .catch((error) => {throw new Error(error.message);});
  
    return {gasPrice,estimatedGas};
}

async function getGasPrice() {
    const price = await _addr_js__WEBPACK_IMPORTED_MODULE_1__.web3.eth.getGasPrice();
//    console.log(`Checking gas:`,price);
    return price;
}

function showSuccess(message, tx = false) {
    let tmp = document.createElement("div");
    tmp.setAttribute("id","success_block");
    if (tx) {
        tmp.innerHTML = `<a href="https://${_addr_js__WEBPACK_IMPORTED_MODULE_1__.etherscan}/tx/${tx}" target="_blank">${message}</a>`;
    } else {
        tmp.innerHTML = `${message}`;
    }
    tmp.style.zIndex = 1000;
    let successNode = document.body.appendChild(tmp);
    setTimeout(() => {document.body.removeChild(successNode);}, 5000);
}

function showError(message = 'MEH', tx = false) {
    let tmp = document.createElement("div");
    tmp.setAttribute("id","error_block");
    if (tx) {
        tmp.innerHTML = `<a href="https://${_addr_js__WEBPACK_IMPORTED_MODULE_1__.etherscan}/tx/${tx}" target="_blank">${message}</a>`;
    } else {
        tmp.innerHTML = `ERROR: ${message}`;
    }
    tmp.style.zIndex = 1000;
    let errorNode = document.body.appendChild(tmp);
    setTimeout(() => {document.body.removeChild(errorNode);}, 5000);
}

function truncAddr(addr, limit) {
    if (addr.length <= (limit * 2)) {
        return addr;
    }
    var shortAddr = `${addr.substr(0, limit)}...${addr.substr(limit * -1)}`
    return shortAddr;
};

async function tokenDisplay() {
    if (_common_js__WEBPACK_IMPORTED_MODULE_2__.sharedData.view == 'vote') {
//        const displayDiv = document.getElementById('token_display');
        const displayDiv = document.getElementById('wallet');
        _common_js__WEBPACK_IMPORTED_MODULE_2__.sharedData.currApproval = await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__.checkRemainingApproval)(currWallet);
        displayDiv.insertAdjacentHTML('beforeend',
            `<div id="token_status">
                ${(0,_common_js__WEBPACK_IMPORTED_MODULE_2__.shortenNumber)(_common_js__WEBPACK_IMPORTED_MODULE_2__.sharedData.currMehBalance,2)} Meh
                <a href="https://app.uniswap.org/explore/tokens/base/0xa999542c71febba77602fbc2f784ba9ba0c850f6" target="_blank"><i class="fa-solid fa-circle-plus"></i></a> |
                <span id="meh_approval" class="meh_approval ${(_common_js__WEBPACK_IMPORTED_MODULE_2__.sharedData.currApproval < 25000) && 'low_approval'}">${(0,_common_js__WEBPACK_IMPORTED_MODULE_2__.shortenNumber)(_common_js__WEBPACK_IMPORTED_MODULE_2__.sharedData.currApproval)} Approved</span>
                <span id="del_approval"><i class="fa-regular fa-trash-can"></i></span>
            </div>`
        );
        document.getElementById('meh_approval').addEventListener('click', () => {(0,_vote_js__WEBPACK_IMPORTED_MODULE_3__.approveMeh)(100000000);});
        document.getElementById('del_approval').addEventListener('click', () => {(0,_common_js__WEBPACK_IMPORTED_MODULE_2__.removeApproval)()});
    }
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   abiFaucet: () => (/* binding */ abiFaucet),
/* harmony export */   abiMeh: () => (/* binding */ abiMeh),
/* harmony export */   abiRoyalty: () => (/* binding */ abiRoyalty),
/* harmony export */   abiVote: () => (/* binding */ abiVote)
/* harmony export */ });
const abiVote = [
    {
        "inputs": [
            {
                "internalType": "contract IERC20",
                "name": "_mehToken",
                "type": "address"
            },
            {
                "internalType": "contract IRoyalty",
                "name": "_royalties",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "productId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "productName",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "allocatorMerkleRoot",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalContracts",
                "type": "uint256"
            }
        ],
        "name": "MehStore",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_gameId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_mehContracts",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_mehContractPrice",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_end",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_totalContracts",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "_limitedRun",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "_prizeMeh",
                "type": "uint256"
            }
        ],
        "name": "addProductToGame",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_gameId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_productId",
                "type": "uint256"
            }
        ],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_end",
                "type": "uint256"
            }
        ],
        "name": "createGame",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_gameId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_productId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_numContracts",
                "type": "uint256"
            }
        ],
        "name": "depositMeh",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "depositMehStore",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "deposits",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "games",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "numProducts",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "gameId",
                "type": "uint256"
            }
        ],
        "name": "getProductsByGameId",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "mehContractsDeposited",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "mehContracts",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "mehContractPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "prizeMeh",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "mehStore",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "begin",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "end",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "totalContracts",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bool",
                        "name": "limitedRun",
                        "type": "bool"
                    }
                ],
                "internalType": "struct MehVoteV1.Product[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "mehToken",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "royalties",
        "outputs": [
            {
                "internalType": "contract IRoyalty",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const abiRoyalty = [
    {
        "inputs": [
            {
                "internalType": "contract IERC20",
                "name": "_mehToken",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "approved",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "approved",
                "type": "bool"
            }
        ],
        "name": "ApprovalForAll",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "MINTER_ADDRESS",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "baseURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_productId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_totalContracts",
                "type": "uint256"
            }
        ],
        "name": "createProduct",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amt",
                "type": "uint256"
            }
        ],
        "name": "depositMehToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "deposits",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amt",
                "type": "uint256"
            }
        ],
        "name": "extractMehToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "getApproved",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            }
        ],
        "name": "isApprovedForAll",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "mehToken",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_productId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_to",
                "type": "address"
            }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "ownerOf",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "products",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "totalContracts",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "currentSerial",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "operator",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "approved",
                "type": "bool"
            }
        ],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "newURI",
                "type": "string"
            }
        ],
        "name": "setBaseTokenURI",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "tokenURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newMinter",
                "type": "address"
            }
        ],
        "name": "updateMinter",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const abiFaucet = [
    {
        "inputs": [
            {
                "internalType": "contract IERC20",
                "name": "_mehToken",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "MAX_TOKEN_AMOUNT",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MIN_TOKEN_AMOUNT",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "TIME_INTERVAL",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "faucet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "faucetOn",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "lastAccessTime",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "mehToken",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "toggleFaucet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const abiMeh = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "burnMeh",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "burnFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "cap",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "subtractedValue",
                "type": "uint256"
            }
        ],
        "name": "decreaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "addedValue",
                "type": "uint256"
            }
        ],
        "name": "increaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

/***/ }),
/* 4 */
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MEHRoyalty: () => (/* binding */ MEHRoyalty),
/* harmony export */   MEHToken: () => (/* binding */ MEHToken),
/* harmony export */   MEHVote: () => (/* binding */ MEHVote),
/* harmony export */   MEH_FAUCET: () => (/* binding */ MEH_FAUCET),
/* harmony export */   MEH_ROYALTY: () => (/* binding */ MEH_ROYALTY),
/* harmony export */   MEH_TOKEN: () => (/* binding */ MEH_TOKEN),
/* harmony export */   MEH_VOTE: () => (/* binding */ MEH_VOTE),
/* harmony export */   alchemy: () => (/* binding */ alchemy),
/* harmony export */   apiKey: () => (/* binding */ apiKey),
/* harmony export */   chainId: () => (/* binding */ chainId),
/* harmony export */   defaultChainId: () => (/* binding */ defaultChainId),
/* harmony export */   etherscan: () => (/* binding */ etherscan),
/* harmony export */   init: () => (/* binding */ init),
/* harmony export */   web3: () => (/* binding */ web3)
/* harmony export */ });
/* harmony import */ var _wallet_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _abi_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_wallet_js__WEBPACK_IMPORTED_MODULE_0__]);
_wallet_js__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];



let MEH_FAUCET;
let MEH_VOTE;
let MEH_TOKEN;
let MEH_ROYALTY;
let web3;
let etherscan;
let apiKey;
let alchemy;

const defaultChainId = '0x2105';
// 0x2105 >>> BaseMainnet
// 0x14a34 >>> BaseSepolia

let chainId;

let MEHToken;
let MEHVote;
let MEHRoyalty;

//init();

async function init() {
    chainId = await window.ethereum.request({ method: 'eth_chainId' });
    web3 = new Web3(window.ethereum);

    if (chainId == '0x14a34') {    //  ----- BaseSepolia -----
        MEH_TOKEN = "0xEf4C3545edf08563bbC112D5CEf0A10B396Ea12E";
        MEH_FAUCET = "0x47FA1e09E9Ae17bC6F37A60F3C44f56D25213112";
        MEH_ROYALTY = "0x177C84EcDd00224d0b7B34e78De1bb7927b1d2B3";
        MEH_VOTE = "0xAC42e62be97abeAb7775cC4Bae84d0DB4223C508";
        apiKey = "GBfdhUAKP01Zmxr9l8JybRbAnEH7YRb9";
        alchemy = "https://base-sepolia.g.alchemy.com/v2/";
        etherscan = "sepolia.basescan.org";
    } else if (chainId == '0x2105') {    //  ----- Base -----
        MEH_TOKEN = "0xa999542c71FEbba77602fBc2F784bA9BA0C850F6";
        MEH_FAUCET = "0x97246294c9c373D5f3f5c0E0BA2D2029FF73877e";
        MEH_ROYALTY = "0x0F3b4250d174aDC7d1e90A438a1706404C85fFd4";
        MEH_VOTE = "0x617981E1DbDdAc0b7e14949B6dF784e92BC9bCDd";
        apiKey = "DSDV-PHXPq4Znjpnwr4DkthBE6MLWc--";
        alchemy = "https://base-mainnet.g.alchemy.com/v2/"
        etherscan = "basescan.org";
    } else {
        console.error(`Error: Unsupported chain`);
//        document.getElementById("loading").classList.add('move'); // force the loading screen;
        await (0,_wallet_js__WEBPACK_IMPORTED_MODULE_0__.switchNetwork)();
    }

    MEHToken = new web3.eth.Contract(_abi_js__WEBPACK_IMPORTED_MODULE_1__.abiMeh, MEH_TOKEN);
    MEHVote = new web3.eth.Contract(_abi_js__WEBPACK_IMPORTED_MODULE_1__.abiVote, MEH_VOTE);
    MEHRoyalty = new web3.eth.Contract(_abi_js__WEBPACK_IMPORTED_MODULE_1__.abiRoyalty, MEH_ROYALTY);
};

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),
/* 5 */
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   checkRemainingApproval: () => (/* binding */ checkRemainingApproval),
/* harmony export */   cleanBigInt: () => (/* binding */ cleanBigInt),
/* harmony export */   getAccounts: () => (/* binding */ getAccounts),
/* harmony export */   helpApproval: () => (/* binding */ helpApproval),
/* harmony export */   helpChain: () => (/* binding */ helpChain),
/* harmony export */   helpProvider: () => (/* binding */ helpProvider),
/* harmony export */   helpToken: () => (/* binding */ helpToken),
/* harmony export */   removeApproval: () => (/* binding */ removeApproval),
/* harmony export */   sharedData: () => (/* binding */ sharedData),
/* harmony export */   shortenNumber: () => (/* binding */ shortenNumber),
/* harmony export */   showErrors: () => (/* binding */ showErrors),
/* harmony export */   showSuccess: () => (/* binding */ showSuccess)
/* harmony export */ });
/* harmony import */ var _vote_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var _addr_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);
/* harmony import */ var _wallet_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(2);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_vote_js__WEBPACK_IMPORTED_MODULE_0__, _addr_js__WEBPACK_IMPORTED_MODULE_1__, _wallet_js__WEBPACK_IMPORTED_MODULE_2__]);
([_vote_js__WEBPACK_IMPORTED_MODULE_0__, _addr_js__WEBPACK_IMPORTED_MODULE_1__, _wallet_js__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);




const sharedData = {};

function cleanBigInt(_bigInt, _divisor = 1) {
    return Math.round(Number(_bigInt) / _divisor);
};

function shortenNumber(_longNum, _dec = 0) {
    return (_longNum >= 1000000000) ?
        Number(_longNum / 1000000000).toFixed(_dec) + "B" :
        (_longNum >= 1000000) ?
            Number(_longNum / 1000000).toFixed(_dec) + "M" :
            (_longNum >= 1000) ?
                Number(_longNum / 1000).toFixed(_dec) + "K" : _longNum;
}

async function getAccounts() {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    return accounts;
}

function showErrors(_message, _stop = false) {
    let div = document.createElement("div");
    div.id = "overlay";
    document.body.insertAdjacentElement('beforeend', div);
    div.innerHTML = _message;
    document.body.classList.add("overlay_on");

    if (_stop) {
        throw new Error(_message);
    } else {
        setTimeout(() => { document.body.classList.remove("overlay_on"); }, 5000);
    }
}

function showSuccess(_message, link = null) {
    let div = document.createElement("div");
    div.id = "overlay";
    document.body.insertAdjacentElement('beforeend', div);
    if (link) {
        div.innerHTML = `${_message}<br /><a href="https://${_addr_js__WEBPACK_IMPORTED_MODULE_1__.etherscan}/tx/${link}" target="_blank">${link}</a>`;
    } else {
        div.innerHTML = _message;
    }
    document.body.classList.add("overlay_on");

    setTimeout(() => { document.body.classList.remove("overlay_on"); }, 5000);
    //console.log(_message);
}

// **********************
// Connection helpers
// **********************

function helpProvider() {
    _vote_js__WEBPACK_IMPORTED_MODULE_0__.params.contentDiv.innerHTML =
        `<div>Meh is a d/app and requires a web3 provider,
        like <a href="https://metamask.io/download/" target="_blank">MetaMask</a>,
        <a href="https://trustwallet.com/" target="_blank">Trust Wallet</a>,
        or <a href="https://www.coinbase.com/wallet" target="_blank">Coinbase Wallet</a>.</div>`;
};

async function helpChain(_chainId = defaultChainId) { // for now we assume Base
    if (window.ethereum) {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: _chainId, // A hexadecimal string representing the chain ID. For example, Ethereum Mainnet is 0x1
                    chainName: (_chainId == '0x14a34') ? 'Base Sepolia' : 'Base', // A human-readable name for the chain
                    rpcUrls: [`https://${(_chainId == '0x14a34') ? 'sepolia.base.org' : 'mainnet.base.org'}`], // An array of RPC URLs the wallet can use
                    nativeCurrency: {
                        name: 'Ether', // The currency the chain uses
                        symbol: 'ETH', // The currency symbol
                        decimals: 18 // The number of decimals the currency uses
                    },
                    blockExplorerUrls: [`https://${(_chainId == '0x14a34') ? 'sepolia-explorer.base.org' : 'basescan.org'}`] // An array of URLs to block explorers for this chain
                }]
            });
            console.info('Chain added or switched successfully.');
        } catch (error) {
            console.error('Failed to add the chain', error);
        }
    } else {
        console.error('Ethereum provider is not available. Install MetaMask!');
    }
};

// this needs cleanup before use vvv
async function helpToken() {
    await window.ethereum.request({
        "method": "wallet_watchAsset",
        "params": {
            "type": "ERC20",
            "options": {
                "address": _addr_js__WEBPACK_IMPORTED_MODULE_1__.MEH_TOKEN,
                "symbol": "MEH",
                "decimals": 18,
                "image": "/images/meh_token.png"
            }
        }
    });
};

function helpApproval(_amount) {
};

async function removeApproval(_wallet) {
    const accounts = await getAccounts();
    if (accounts.length <= 0) {
        throw new Error("connect to metamask");
    }

    let gas = {}
    try {
        gas = await (0,_wallet_js__WEBPACK_IMPORTED_MODULE_2__.calcGas)({
            account: accounts[0],
            context: _addr_js__WEBPACK_IMPORTED_MODULE_1__.MEHToken.methods,
            func: 'approve',
            args: [_addr_js__WEBPACK_IMPORTED_MODULE_1__.MEH_VOTE, 0]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': accounts[0],
        'to': _addr_js__WEBPACK_IMPORTED_MODULE_1__.MEH_TOKEN,
        'data': _addr_js__WEBPACK_IMPORTED_MODULE_1__.MEHToken.methods.approve(_addr_js__WEBPACK_IMPORTED_MODULE_1__.MEH_VOTE, 0).encodeABI(),
        'gas': _addr_js__WEBPACK_IMPORTED_MODULE_1__.web3.utils.toHex(gas.estimatedGas),
        'gasPrice': _addr_js__WEBPACK_IMPORTED_MODULE_1__.web3.utils.toHex(gas.gasPrice)
    };

    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(result => {
        showSuccess('remove approval tx complete', result);
        _vote_js__WEBPACK_IMPORTED_MODULE_0__.params.transactionQueue.push(result);
        //        updateMehApproval(amt);
    }, error => {
        showErrors(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
};

async function checkRemainingApproval(_wallet) {
    let approval = await _addr_js__WEBPACK_IMPORTED_MODULE_1__.MEHToken.methods.allowance(_wallet, _addr_js__WEBPACK_IMPORTED_MODULE_1__.MEH_VOTE).call().then((_meh) => { return cleanBigInt(_meh, _vote_js__WEBPACK_IMPORTED_MODULE_0__.params.tokenScale); });
    return approval;
};


__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),
/* 6 */
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   product: () => (/* binding */ product)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _vote_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(0);
/* harmony import */ var _wallet_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(2);
/* harmony import */ var _addr_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(4);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_common_js__WEBPACK_IMPORTED_MODULE_0__, _vote_js__WEBPACK_IMPORTED_MODULE_1__, _wallet_js__WEBPACK_IMPORTED_MODULE_2__, _addr_js__WEBPACK_IMPORTED_MODULE_3__]);
([_common_js__WEBPACK_IMPORTED_MODULE_0__, _vote_js__WEBPACK_IMPORTED_MODULE_1__, _wallet_js__WEBPACK_IMPORTED_MODULE_2__, _addr_js__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);





class product {
    constructor({
        id,
        name = null,
        contractsDeposited = 0, // meh contracts deposited
        mehContracts = null,
        contractPrice = null,
        prizeMeh = 0,
        mehStore = false,
        begin = null,
        end = null,
        limitedRun = true,
        totalContracts = null
    }) {
        this.id = id;
        this.name = name;
        this.contractsDeposited = isNaN(contractsDeposited) ? 0 : contractsDeposited; // meh contracts deposited
        this.mehContracts = isNaN(mehContracts) ? 0 : mehContracts;
        this.contractPrice = isNaN(contractPrice) ? null : (contractPrice < 1)? 1 : contractPrice;
        this.prizeMeh = prizeMeh;
        this.mehStore = mehStore;
        this.begin = Number(begin) * 1000;
        this.end = Number(end) * 1000;
        this.remainingContracts = (mehContracts && (mehContracts - contractsDeposited) > 0)?mehContracts - contractsDeposited:0;
        this.soldOut = (this.remainingContracts && this.remainingContracts >= 1)?false:true;
        this.limitedRun = limitedRun;
        this.html = null;
        this.image = `/images/vote/id_${this.id}.png`;
        this.totalContracts = isNaN(totalContracts) ? 0 : totalContracts;
        this.activeStatus = 2; // 0: not yet open, 1: active, 2: product has closed
        this.setActiveState();
        this.contractsOwned = null;
    };

    genHtml() {
        this.html = document.createElement('div');
        this.html.className = 'product';
        this.html.style.backgroundImage = `url(${this.image})`;
        this.html.id = `product_${this.id}`;
        this.html.innerHTML =
        `<div class="remaining">${this.remainingContracts}/${this.mehContracts}</div>
        <div class="desc">
            <div class="title">
                <div>${this.name}</div>
                <div></div>
            </div>
            <div class="action">
                <div>${(0,_common_js__WEBPACK_IMPORTED_MODULE_0__.shortenNumber)(this.contractPrice,0)} Meh</div>
                <div>Contracts Remaining ${this.remainingContracts}/${this.mehContracts}</div>
            </div>
        </div>`;

        if (this.soldOut) {
            this.html.insertAdjacentHTML('beforeend', `<div class="alert">Sold Out</div>`);
        } else if (this.activeStatus == 0) {
            this.html.insertAdjacentHTML('beforeend', `<div class="message"><div class="success small_text">Opens<br />${new Date(this.begin).toLocaleString()}</div></div>`);
        } else if (this.activeStatus == 2) {
            this.html.insertAdjacentHTML('beforeend', `<div class="alert small_text">Voting Closed</div>`);
        } else if (this.activeStatus == 1 && _vote_js__WEBPACK_IMPORTED_MODULE_1__.params.gameStatus == 1 && this.soldOut == false) {
            this.html.addEventListener('click', () => (0,_vote_js__WEBPACK_IMPORTED_MODULE_1__.vote)(this.id))
        }

        if (this.contractsOwned && this.contractsOwned > 0) {
            if (this.soldOut) {
                this.html.insertAdjacentHTML('afterbegin', `<span id="contract_count_${this.id}" class="contract_count fa-layers-counter fa-4x">CLAIM ${this.contractsOwned}</span>`);
                this.html.getElementsByClassName(`contract_count`)[0].addEventListener('click', () => {
                    (0,_vote_js__WEBPACK_IMPORTED_MODULE_1__.claim)(this.id)
                    console.log(`Claiming ${this.contractsOwned} contracts...`)
                })
            } else {
                this.html.insertAdjacentHTML('afterbegin', `<span class="contract_count fa-layers-counter fa-3x">${this.contractsOwned}</span>`)
            }
        }
    }

    async asyncInit() {
        await fetch(this.image, {method: 'HEAD'})
        .then((res) => {
            if (!res.ok) {
                this.image = `/images/vote/id_0.png`;
//                throw new Error("Status code error :" + res.status);
            };
        })
        .catch((err) => {console.info(err)});

        await this.checkForOwnedContracts();

        this.genHtml();
    }

    setActiveState() {
        var now = new Date().getTime();
        this.activeStatus = (this.begin < now && now < this.end)? 1 :
            (this.begin > now)? 0 : 2;
    }

    async checkForOwnedContracts() {
        this.contractsOwned = Number(await _addr_js__WEBPACK_IMPORTED_MODULE_3__.MEHVote.methods.deposits(_wallet_js__WEBPACK_IMPORTED_MODULE_2__.currWallet,_addr_js__WEBPACK_IMPORTED_MODULE_3__.web3.utils.padLeft(_addr_js__WEBPACK_IMPORTED_MODULE_3__.web3.utils.numberToHex(this.id),40)).call());
    }
};

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/async module */
/******/ 	(() => {
/******/ 		var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 		var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 		var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 		var resolveQueue = (queue) => {
/******/ 			if(queue && queue.d < 1) {
/******/ 				queue.d = 1;
/******/ 				queue.forEach((fn) => (fn.r--));
/******/ 				queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 			}
/******/ 		}
/******/ 		var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 			if(dep !== null && typeof dep === "object") {
/******/ 				if(dep[webpackQueues]) return dep;
/******/ 				if(dep.then) {
/******/ 					var queue = [];
/******/ 					queue.d = 0;
/******/ 					dep.then((r) => {
/******/ 						obj[webpackExports] = r;
/******/ 						resolveQueue(queue);
/******/ 					}, (e) => {
/******/ 						obj[webpackError] = e;
/******/ 						resolveQueue(queue);
/******/ 					});
/******/ 					var obj = {};
/******/ 					obj[webpackQueues] = (fn) => (fn(queue));
/******/ 					return obj;
/******/ 				}
/******/ 			}
/******/ 			var ret = {};
/******/ 			ret[webpackQueues] = x => {};
/******/ 			ret[webpackExports] = dep;
/******/ 			return ret;
/******/ 		}));
/******/ 		__webpack_require__.a = (module, body, hasAwait) => {
/******/ 			var queue;
/******/ 			hasAwait && ((queue = []).d = -1);
/******/ 			var depQueues = new Set();
/******/ 			var exports = module.exports;
/******/ 			var currentDeps;
/******/ 			var outerResolve;
/******/ 			var reject;
/******/ 			var promise = new Promise((resolve, rej) => {
/******/ 				reject = rej;
/******/ 				outerResolve = resolve;
/******/ 			});
/******/ 			promise[webpackExports] = exports;
/******/ 			promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 			module.exports = promise;
/******/ 			body((deps) => {
/******/ 				currentDeps = wrapDeps(deps);
/******/ 				var fn;
/******/ 				var getResult = () => (currentDeps.map((d) => {
/******/ 					if(d[webpackError]) throw d[webpackError];
/******/ 					return d[webpackExports];
/******/ 				}))
/******/ 				var promise = new Promise((resolve) => {
/******/ 					fn = () => (resolve(getResult));
/******/ 					fn.r = 0;
/******/ 					var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 					currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 				});
/******/ 				return fn.r ? promise : getResult();
/******/ 			}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 			queue && queue.d < 0 && (queue.d = 0);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	
/******/ })()
;