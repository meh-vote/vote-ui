import { switchNetwork } from './wallet.js';
import { abiVote, abiMeh, abiRoyalty } from './abi.js';

export let MEH_FAUCET;
export let MEH_VOTE;
export let MEH_TOKEN;
export let MEH_ROYALTY;
export let web3;
export let etherscan;
export let apiKey;
export let alchemy;

export const defaultChainId = '0x2105';
// 0x2105 >>> BaseMainnet
// 0x14a34 >>> BaseSepolia

export let chainId;

export let MEHToken;
export let MEHVote;
export let MEHRoyalty;

//init();

export async function init() {
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
        await switchNetwork();
    }

    MEHToken = new web3.eth.Contract(abiMeh, MEH_TOKEN);
    MEHVote = new web3.eth.Contract(abiVote, MEH_VOTE);
    MEHRoyalty = new web3.eth.Contract(abiRoyalty, MEH_ROYALTY);
};
