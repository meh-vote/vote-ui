import { abiFaucet } from './abi.js';
import {
    MEH_FAUCET,
    MEH_TOKEN,
    web3,
    chainId,
    defaultChainId,
    etherscan,
    MEHToken,
    init as addrInit
} from './addr.js';
import {
    helpProvider,
    helpChain,
    helpToken,
    helpApproval,
    removeApproval,
    checkRemainingApproval,
    cleanBigInt,
    shortenNumber,
    showErrors
} from './common.js';
import { approveMeh } from './vote.js';
import { params, sharedData } from './main.js';

export const MEHScale = 1000000000000000000;
export let currWallet = null;
let preferredNetwork = null;
export let provider = null;

const prepWallet = {
    ethereumProvider: false,
    walletConnected: false,
    correctChain: false,
    tokenAdded: false
};

// 1. ethereum provider available
// 2. have the right chain? add the chain?
// 3. on the right chain? switch chain?
// 4. have the token? add the token?
// 5. get wallet address(s)

export async function init( _chainId = defaultChainId) {
    console.log(`1 ... _chainId: ${_chainId}, defaultChainId: ${defaultChainId}`);
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

        await addrInit();

        preferredNetwork = (_chainId)?_chainId:chainId;
        console.log(`2 ... preferredNetwork: ${preferredNetwork}`);

        await web3.eth.getAccounts().then(async (accounts) => {
            if (accounts.length === 0) {
                console.log('No connected accounts');
                await connect();
            } else {
                console.log('Connected with account:', accounts[0]);
                currWallet = accounts[0].toLowerCase();
                sharedData.currMehBalance = await MEHToken.methods.balanceOf(currWallet).call().then((result) => {return cleanBigInt(result,params.tokenScale)});
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

export function reloadClient() {
    // When chain changes, Metamask recommends reloading the page
    window.location.reload();
}

function handleAccountsChanged(accounts) {
    // When chain changes, Metamask recommends reloading the page
    reloadClient();
};

// Access user's accounts (EIP-1102)
export async function connect() {
    await ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleAccountsChanged)
        .catch((err) => {
            if (err.code === 4001) {
                // user rejected connection request (EIP-1193)
                showErrors('User rejected connection request.');
                console.log('Please connect to MetaMask.');
            } else {
                console.error(err);
            }
        });
}

export async function updateConnectionStatus() {
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
        if (sharedData.view == 'vote') {tokenDisplay()};
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
export async function switchNetwork(_chainId = defaultChainId) {
    console.log(`_chainId: ${_chainId}, chainId: ${chainId}, defaultChainId: ${defaultChainId}`);
    if (_chainId != chainId) {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: _chainId }]
        }).then((out) => {
            handleChainChanged(null);
        }).catch((e) => {
            if (e.code === 4902) {
                helpChain(_chainId);
            }
            throw new Error("Could not connect to a supported network");
        });
    };
};

export async function checkWallet(walletAddress = null) {
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
    const MEHFaucet = new web3.eth.Contract(abiFaucet, MEH_FAUCET);

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
        'to': MEH_FAUCET,
        'data': MEHFaucet.methods.faucet().encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
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

export async function calcGas({account, context, func, args = null}) {
    let gasPrice = await getGasPrice();
    gasPrice = Math.trunc(Number(gasPrice) * 1.5);
  
    let estimatedGas = await context[func].apply(null,args?args:null).estimateGas({from: account})
      .catch((error) => {throw new Error(error.message);});
  
    return {gasPrice,estimatedGas};
}

export async function getGasPrice() {
    const price = await web3.eth.getGasPrice();
//    console.log(`Checking gas:`,price);
    return price;
}

export function showSuccess(message, tx = false) {
    let tmp = document.createElement("div");
    tmp.setAttribute("id","success_block");
    if (tx) {
        tmp.innerHTML = `<a href="https://${etherscan}/tx/${tx}" target="_blank">${message}</a>`;
    } else {
        tmp.innerHTML = `${message}`;
    }
    tmp.style.zIndex = 1000;
    let successNode = document.body.appendChild(tmp);
    setTimeout(() => {document.body.removeChild(successNode);}, 5000);
}

export function showError(message = 'MEH', tx = false) {
    let tmp = document.createElement("div");
    tmp.setAttribute("id","error_block");
    if (tx) {
        tmp.innerHTML = `<a href="https://${etherscan}/tx/${tx}" target="_blank">${message}</a>`;
    } else {
        tmp.innerHTML = `ERROR: ${message}`;
    }
    tmp.style.zIndex = 1000;
    let errorNode = document.body.appendChild(tmp);
    setTimeout(() => {document.body.removeChild(errorNode);}, 5000);
}

export function truncAddr(addr, limit) {
    if (addr.length <= (limit * 2)) {
        return addr;
    }
    var shortAddr = `${addr.substr(0, limit)}...${addr.substr(limit * -1)}`
    return shortAddr;
};

async function tokenDisplay() {
    if (sharedData.view == 'vote') {
//        const displayDiv = document.getElementById('token_display');
        const displayDiv = document.getElementById('wallet');
        sharedData.currApproval = await checkRemainingApproval(currWallet);
        displayDiv.insertAdjacentHTML('beforeend',
            `<div id="token_status">
                ${shortenNumber(sharedData.currMehBalance,2)} Meh
                <a href="https://app.uniswap.org/explore/tokens/base/0xa999542c71febba77602fbc2f784ba9ba0c850f6" target="_blank"><i class="fa-solid fa-circle-plus"></i></a> |
                <span id="meh_approval" class="meh_approval ${(sharedData.currApproval < 25000) && 'low_approval'}">${shortenNumber(sharedData.currApproval)} Approved</span>
                <span id="del_approval"><i class="fa-regular fa-trash-can"></i></span>
            </div>`
        );
        document.getElementById('meh_approval').addEventListener('click', () => {approveMeh(100000000);});
        document.getElementById('del_approval').addEventListener('click', () => {removeApproval()});
    }
}