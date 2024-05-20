import { shortenNumber } from './common.js';
import { vote, claim } from './vote.js';
import { params } from './main.js';
import { web3, MEHVote } from './addr.js';

export class product {
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
// Need to hold on displaying the remaining contracts until we have a read connection and check the live data
//        console.log(`contractsDeposited ${this.contractsDeposited}`)
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
                <div>${shortenNumber(this.contractPrice,0)} Meh</div>
                ${(params.provider)
                    ?`<div>Contracts Remaining ${this.remainingContracts}/${this.mehContracts}</div>`
                    :`<div>Provider required to check Contracts Remaining</div>`
                }
            </div>
        </div>`;

        if (this.soldOut) {
            this.html.insertAdjacentHTML('beforeend', `<div class="alert">Sold Out</div>`);
        } else if (this.activeStatus == 0) {
            this.html.insertAdjacentHTML('beforeend', `<div class="message"><div class="success small_text">Opens<br />${new Date(this.begin).toLocaleString()}</div></div>`);
        } else if (this.activeStatus == 2) {
            this.html.insertAdjacentHTML('beforeend', `<div class="alert small_text">Voting Closed</div>`);
        } else if (this.activeStatus == 1 && this.soldOut == false) {
            this.html.addEventListener('click', () => vote(this.id))
        }

        if (this.contractsOwned && this.contractsOwned > 0) {
            if (this.soldOut) {
                this.html.insertAdjacentHTML('afterbegin', `<span id="contract_count_${this.id}" class="contract_count fa-layers-counter fa-4x">CLAIM ${this.contractsOwned}</span>`);
                this.html.getElementsByClassName(`contract_count`)[0].addEventListener('click', () => {
                    claim(this.id);
                    evt.stopImmediatePropagation();
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
//        await this.getAvailableContracts();
//        await this.checkForOwnedContracts();
        this.genHtml();
    }

    setActiveState() {
        var now = new Date().getTime();
        this.activeStatus = (this.begin < now && now < this.end)? 1 :
            (this.begin > now)? 0 : 2;
    }

    async checkForOwnedContracts() {
        this.contractsOwned = Number(await MEHVote.methods.deposits(params.account,web3.utils.padLeft(web3.utils.numberToHex(this.id),40)).call());
    }
};
