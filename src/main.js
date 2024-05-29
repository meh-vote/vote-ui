import '@fortawesome/fontawesome-free/css/all.min.css';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';

import {
    loadStaticGameData,
    loadStaticProductData,
    setGameStatus,
    displayProducts,
    updateLiveProductData,
    checkForContracts
} from './vote.js';
import { reloadClient } from './common.js';
import { init as walletInit, connect, tokenDisplay } from './wallet.js';

library.add(faCirclePlus, faTrashCan);
dom.watch();

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
// [ ] refine product class to store its own pointer to the display div/html
//     --- MEDIUM ---
// [ ] spinner when waiting for tx to finish / indicator for pending transactions (toaster?)
// [ ] success message when tx finishes on chain (toaster?)
// [ ] ^^^ or ^^^ periodic check of any (new) txs on contract, then update
// [ ] work in persistent storage, record first time through and show splash with setup instructions
//     --- LOW ---
// [ ] move x/y contract count to stay visible on card change
// [ ] clean up all the code, no really, it's rough
// [ ] prize Meh indicator / leaderboard

export const params = {
    //    preferredNetwork: '0x14a34', // Sepolia
    preferredNetwork: '0x2105', // Base
    currNetwork: null,
    gameId: 1,
    timerDiv: document.getElementById("timer"),
    gameClockDiv: document.getElementById("game_clock"),
    timerStatusDiv: document.getElementById("timer_status"),
    contentDiv: document.getElementById("content"),
    walletDiv: document.getElementById("wallet_status"),
    tokenScale: 1000000000000000000,
    assumedContracts: 1,
    gameStatus: 2, // 0 = not started, 1 = started, 2 = ended
    transactionQueue: [],
    updatesOnChain: false,
    provider: null,
    account: null,
    connection: 'static'  // oneOf('static', 'read', 'write')
    // static :: only what is provided on-load of webapp
    // read :: requires a provider and the correct chain
    // write :: additionally, requires an address
};

export let sharedData = {
    view: 'vote'
}

// SHOW WHAT WE CAN WITHOUT A PROVIDER / WALLET
await loadStaticGameData();
await loadStaticProductData();
await setGameStatus();
await prepConnectBtn();
await walletInit();

// NEXT STEPS
// * monitor tx queue
// updateTransactionQueue();

export function prepConnectBtn() {
    document.body.classList.add("disconnected");
    document.body.classList.remove("connected");
    params.walletDiv.innerText = 'Connect';
    params.walletDiv.addEventListener("click", connect);
    params.account = null;
}

function showConnected() {
    document.body.classList.add("connected");
    document.body.classList.remove("disconnected");
    params.walletDiv.innerText = 'Connected';
    params.walletDiv.removeEventListener("click", connect);
//    console.info(`output meh token balance and approval amount`);
    tokenDisplay();
}

export function updateConnectionStatus(_status = 'static') {
    if (_status == 'read' && params.connection != 'read') { // we've just switched to read
        displayProducts(true);
        if (params.connection != 'write') {
            updateLiveProductData();
        } else {
            reloadClient()
        }
        params.connection = 'read';
    } else if (_status == 'write' && params.connection != 'write') { // we've just switched to write
        displayProducts(true);
        if (params.connection != 'read') {
            updateLiveProductData();
        }
        checkForContracts()
        showConnected()
        params.connection = 'write';
    } else if (_status == 'static' && params.connection != 'static') {  // we've just switched to static
        reloadClient()
    } else {
        throw new Error(`Trying to switch to/from an unknown connection type: ${params.connection} ... ${_status}`);
    }
}