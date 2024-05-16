import {params, sharedData} from './main.js';
import { init as walletInit, calcGas } from './wallet.js';
import {
    MEH_VOTE,
    MEH_TOKEN,
    web3,
    MEHToken,
    MEHVote
} from './addr.js';
import { product } from './product.js';
import { cleanBigInt, getAccounts, showErrors, showSuccess } from './common.js';

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

let products = [];

/*
try {
    if (window.ethereum) {
        console.log(`Found provider at 'window.ethereum'`);
    }
} catch (error) {
    showErrors("This d/app requires a web3 provider, like MetaMask", true);
    throw new Error(error);
}
*/

export async function loadGameData() {
    //    let gameDetails = await MEHVote.methods.games(params.gameId).call();
    fetch(new Request("/data/game_1.json"))
        .then((response) => response.json())
        .then((data) => {
            params.gameStart = Number(data.begin) * 1000;
            params.gameEnd = Number(data.end) * 1000;
        })
        .catch(console.error);

    //  console.log(params)
}

export async function loadProductData() {
    // When switching to static date, to allow showing w/o provider, will need to assume that contractsDeposited is unkown
    //    let gameProducts = await MEHVote.methods.getProductsByGameId(params.gameId).call();

    products = [];

    await fetch(new Request("/data/products_1.json"))
        .then((response) => response.json())
        .then((data) => {
            for (const _product of data) {
                products.push(new product({
                    id: Number(_product.id),
                    name: _product.name,
                    contractsDeposited: Number(_product.mehContractsDeposited), // meh contracts deposited
                    mehContracts: Number(_product.mehContracts),
                    contractPrice: cleanBigInt(_product.mehContractPrice, params.tokenScale),
                    prizeMeh: cleanBigInt(_product.prizeMeh, params.tokenScale),
                    mehStore: _product.mehStore,
                    begin: Number(_product.begin),
                    end: Number(_product.end),
                    limitedRun: _product.limitedRun,
                    totalContracts: Number(_product.totalContracts)
                }));
            }
            // sort by product begin
            products = products.sort(function (a, b) { return a.begin - b.begin });

            let lastProductend = products.reduce((maxEnd, currProduct) => { return (currProduct.end > maxEnd.end) ? currProduct : maxEnd });
            if (params.gameEnd < lastProductend.end) {
                params.gameEnd = lastProductend.end;
                checkGameStatus();
            }
        })
        .catch(console.error);

    for (const _product of products) {
        await _product.asyncInit();
    }

    params.contentDiv.innerHTML = '';
    for (const _product of products) {
        params.contentDiv.insertAdjacentElement('beforeend', _product.html);
    };
}

export async function setGameStatus() {
    await checkGameStatus();
    var x = setInterval(function () { checkGameStatus(); }, 60000); // Update the game status every minute
}

export async function checkGameStatus() {
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

export function updateTransactionQueue() {
    var x = setInterval(function () { checkTransactionQueue(); }, 120000); // Check for completion of pending txs every 2 minutes
}

async function checkTransactionQueue() {
    if (params.transactionQueue && params.transactionQueue.length > 0) {
        for (let i = params.transactionQueue.length - 1; i >= 0; i--) {
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

export function initTimer() {
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
export async function vote(_productId) {
    const accounts = await getAccounts();
    const productCost = products.find(product => product.id == _productId).contractPrice;
    if (accounts.length <= 0) {
        showErrors("connect a provider like metamask");
        throw new Error("connect to metamask");
    }

    if (sharedData.currApproval < productCost) {
        showErrors("Approval insufficient for product<br />approve more from link in header");
        throw new Error("Approval insufficient for product");
    }

    if (sharedData.currMehBalance < productCost) {
        showErrors("Insufficient Meh for product<br />buy more from link in header");
        throw new Error("Insufficient Meh for product");
    }

    let gas = {}
    try {
        gas = await calcGas({
            account: accounts[0],
            context: MEHVote.methods,
            func: 'depositMeh',
            args: [params.gameId, _productId, params.assumedContracts]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };
    //     console.log(gas);

    const tx = {
        'from': accounts[0],
        'to': MEH_VOTE,
        'data': MEHVote.methods.depositMeh(params.gameId, _productId, params.assumedContracts).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };
    //console.log(`calling vote. game: ${params.gameId}, productId: ${_productId}, contracts: ${params.assumedContracts}`);
    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(async result => {
        showSuccess('approve tx complete', result);
        params.transactionQueue.push(result);
    }, error => {
        showErrors(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
};

export async function approveMeh(amt) {
    const accounts = await getAccounts();
    if (accounts.length <= 0) {
        throw new Error("connect to metamask");
    }

    var amtWei = web3.utils.toWei(amt.toString(), 'ether');

    let gas = {}
    try {
        gas = await calcGas({
            account: accounts[0],
            context: MEHToken.methods,
            func: 'approve',
            args: [MEH_VOTE, amtWei]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': accounts[0],
        'to': MEH_TOKEN,
        'data': MEHToken.methods.approve(MEH_VOTE, amtWei).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };

    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(result => {
        showSuccess('approve tx complete', result);
        params.transactionQueue.push(result);
        //        updateMehApproval(amt);
    }, error => {
        showErrors(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
}

export async function claim(_productId) {
    const accounts = await getAccounts();
    if (accounts.length <= 0) {
        showErrors("connect a provider like metamask");
        throw new Error("connect to metamask");
    }

    let gas = {}
    try {
        gas = await calcGas({
            account: accounts[0],
            context: MEHVote.methods,
            func: 'claim',
            args: [params.gameId, _productId]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': accounts[0],
        'to': MEH_VOTE,
        'data': MEHVote.methods.claim(params.gameId, _productId).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };
    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(async result => {
        showSuccess('approve tx complete', result);
        params.transactionQueue.push(result);
    }, error => {
        showErrors(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
};

// ****************************
// SAMPLE / TEST CODE BELOW
// ****************************

window.MEHToken = MEHToken;
window.MEHVote = MEHVote;
window.vote = vote;
window.loadProductData = loadProductData;

