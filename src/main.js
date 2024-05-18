import '@fortawesome/fontawesome-free/css/all.min.css';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';

import { loadGameData,loadProductData, setGameStatus, updateTransactionQueue } from './vote.js';
import { init as walletInit, connect } from './wallet.js';

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
    wallet: null
};

export let sharedData = {
    view: 'vote'
}

// SHOW WHAT WE CAN WITHOUT A PROVIDER / WALLET
await loadGameData();
await loadProductData();
await setGameStatus();
prepConnectBtn();
await walletInit();
if (params.wallet) {
    showConencted();
}

// NEXT STEPS
// * monitor tx queue
   // updateTransactionQueue();

function prepConnectBtn() {
    document.body.classList.add("disconnected");
    document.body.classList.remove("connected");
    params.walletDiv.innerText = 'Connect';
    params.walletDiv.addEventListener("click",connect);
}

function showConencted() {
    document.body.classList.add("connected");
    document.body.classList.remove("disconnected");
    params.walletDiv.innerText = 'Connected';
    params.walletDiv.removeEventListener("click",connect);
}