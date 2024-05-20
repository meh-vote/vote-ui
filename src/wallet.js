import detectEthereumProvider from '@metamask/detect-provider';
import { init as addrInit, chainInfo } from './addr.js';
import { params, prepConnectBtn, showConencted } from "./main.js";
import { showErrors } from './common.js';

export async function init() {
    // this returns the provider, or null if it wasn't detected
    params.provider = await detectEthereumProvider();

    if (params.provider) {
        await startApp(params.provider); // Initialize your app
    } else {
        console.log('Please install MetaMask!');
        // call showErrors with stop
        showErrors("Please install a web3 provider like MetaMask", true);
    }

    params.currNetwork = await ethereum.request({ method: 'eth_chainId' });

    await switchNetwork(params.preferredNetwork)

    await addrInit();
    
    // Verify this is the desired chain.
    // --- if not, try to switch to desired chain
    // --- try/catch in case that fails due to the chain not being known...in which case try to add
    // --- if we add the chain, may also need to (explicity) switch to it

    await ethereum
        .request({ method: 'eth_accounts' })
        .then(handleAccounts)
        .catch((err) => {
            // Some unexpected error.
            // For backwards compatibility reasons, if no accounts are available,
            // eth_accounts will return an empty array.
            console.error(err);
        });
}

async function startApp(_provider) {
    if (_provider !== window.ethereum) {
        console.error('Do you have multiple wallets installed?');
        // If the provider returned by detectEthereumProvider is not the same as
        // window.ethereum, something is overwriting it. There are likely multiple wallets.
        showErrors("There was an error getting your provider, do you have multiple wallets installed?", true);
    }
    ethereum.on('chainChanged', handleChainChanged);

    // Note that this event is emitted on page load...
    // --- if the array of accounts is non-empty, you're already connected.
    ethereum.on('accountsChanged', handleAccounts);

    // set a 'read' flag to true, so we can start any operations that only need to read
    // --- NOTE: may yet be wrong chain
}

function handleChainChanged(_chainId) {
    // When the chain changes, reload the page
    window.location.reload();
}

// 'eth_accounts' returns an array
function handleAccounts(accounts) {
    if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
console.log(`in read mode`);
        prepConnectBtn();
        // in read-mode at this point
        // update connection status
        // provide 'connect' option
        // there is an experimental ethereum._metamask.isUnlocked() that we may use to validate
    } else if (accounts[0] !== params.account) {
        params.account = accounts[0];

console.log(`can send txs`);
        showConencted();
        // update connection status
        // At this point we should be able to send txs
        // --- no longer stuck in read-mode
    }
    showConnectionInfo();
}

export function connect() {
    ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleAccounts)
        .catch((err) => {
            if (err.code === 4001) {
                // EIP-1193 userRejectedRequest error
                // If this happens, the user rejected the connection request.
                console.log('Please connect to MetaMask.');
            } else {
                console.error(err);
            }
        });
}

async function switchNetwork(_chainId = params.preferredNetwork) {
    if (_chainId != params.currNetwork) {
        await params.provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: _chainId }]
        }).then((out) => {
            handleChainChanged(null);
        }).catch((e) => {
            if (e.code === 4902) {
//                helpChain(_chainId);
console.log(`need to add chain ${_chainId}`);
            }
            throw new Error("Could not connect to a supported network");
        });
    };
};

function showConnectionInfo() {
    let infoDiv = document.createElement("div");
    infoDiv.id = "connection_info";
    let _network= chainInfo.find(({ chainId }) => chainId === params.currNetwork);
    // Layer in logic for known but unsupported networks
    infoDiv.innerHTML = `${(_network) ? _network.chainName : 'unknown'} ${(params.account) ? `(${truncAddr(params.account)})` : ''}`;
    let existingInfoDiv = document.getElementById("connection_info");
    (existingInfoDiv) ? existingInfoDiv.replaceWith(infoDiv) : 
        document.getElementById("wallet").insertAdjacentElement('beforeend', infoDiv);
}

function truncAddr(addr, limit = 4) {
    if (addr.length <= (limit * 2)) {
        return addr;
    }
    var shortAddr = `${addr.substr(0, limit)}...${addr.substr(limit * -1)}`
    return shortAddr;
};