import { params } from "./main.js";
import { MEHToken, MEH_VOTE, MEH_TOKEN, etherscan, web3 } from "./addr.js";

export function cleanBigInt(_bigInt, _divisor = 1) {
    return Math.round(Number(_bigInt) / _divisor);
};

export function shortenNumber(_longNum, _dec = 0) {
    return (_longNum >= 1000000000) ?
        Number(_longNum / 1000000000).toFixed(_dec) + "B" :
        (_longNum >= 1000000) ?
            Number(_longNum / 1000000).toFixed(_dec) + "M" :
            (_longNum >= 1000) ?
                Number(_longNum / 1000).toFixed(_dec) + "K" : _longNum;
}

export function reloadClient() {
    window.location.reload();
}

export async function getAccounts() {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    return accounts;
}

export function showErrors(_message, _stop = false) {
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

export function showSuccess(_message, link = null) {
    let div = document.createElement("div");
    div.id = "overlay";
    document.body.insertAdjacentElement('beforeend', div);
    if (link) {
        div.innerHTML = `${_message}<br /><a href="https://${etherscan}/tx/${link}" target="_blank">${link}</a>`;
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

export function helpProvider() {
    params.contentDiv.innerHTML =
        `<div>Meh is a d/app and requires a web3 provider,
        like <a href="https://metamask.io/download/" target="_blank">MetaMask</a>,
        <a href="https://trustwallet.com/" target="_blank">Trust Wallet</a>,
        or <a href="https://www.coinbase.com/wallet" target="_blank">Coinbase Wallet</a>.</div>`;
};

export async function helpChain(_chainId = defaultChainId) { // for now we assume Base
    if (params.provider) {
        try {
            await params.provider.request({
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
export async function helpToken() {
    await window.ethereum.request({
        "method": "wallet_watchAsset",
        "params": {
            "type": "ERC20",
            "options": {
                "address": MEH_TOKEN,
                "symbol": "MEH",
                "decimals": 18,
                "image": "/images/meh_token.png"
            }
        }
    });
};

export function helpApproval(_amount) {
};

export async function removeApproval(_wallet) {
    const accounts = await getAccounts();
    if (accounts.length <= 0) {
        throw new Error("connect to metamask");
    }

    let gas = {}
    try {
        gas = await calcGas({
            account: accounts[0],
            context: MEHToken.methods,
            func: 'approve',
            args: [MEH_VOTE, 0]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': accounts[0],
        'to': MEH_TOKEN,
        'data': MEHToken.methods.approve(MEH_VOTE, 0).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };

    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(result => {
        showSuccess('remove approval tx complete', result);
        params.transactionQueue.push(result);
        //        updateMehApproval(amt);
    }, error => {
        showErrors(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
};

export async function checkRemainingApproval(_wallet) {
    let approval = await MEHToken.methods.allowance(_wallet, MEH_VOTE).call().then((_meh) => { return cleanBigInt(_meh, params.tokenScale); });
    return approval;
};

export async function checkMehBalance(_wallet) {
    let balance = await MEHToken.methods.balanceOf(_wallet).call().then((result) => {return cleanBigInt(result,params.tokenScale)});
    return balance;
};

export async function calcGas({account, context, func, args = null}) {
    let gasPrice = await getGasPrice();
    gasPrice = Math.trunc(Number(gasPrice) * 1.5);
  
    let estimatedGas = await context[func].apply(null,args?args:null).estimateGas({from: account})
      .catch((error) => {throw new Error(error.message);});
  
    return {gasPrice,estimatedGas};
}

async function getGasPrice() {
    const price = await web3.eth.getGasPrice();
//    console.log(`Checking gas:`,price);
    return price;
}

