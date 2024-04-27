import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function Page() {
    return (
        <div>
            <div id="header">
                <div id="logo">
                    <img id="meh_logo" src="/images/meh.png" alt="Meh Logo" />
                </div>
                <div id="menu"><FontAwesomeIcon icon={['fas', 'bars']} size="2xl" /></div>
            </div>
            <Products />
            <div id="footer"></div>
        </div>
    );
}

// Connect Wallet
// Add Base to Wallet
// Set Chain to Base
// Add Token to Wallet
// Indicate connection status

// Buy/Trade Meh

function Product() {
    return (
        <div className="basis-1/2">
            <div className="basis-1/2 border-solid border border-gray-400 m-8 p-8">
                Product
            </div>
        </div>
    )
};

function Products() {
    return (
        <div className='flex flex-wrap w-screen'>
            <Product />
            <Product />
            <Product />
            <Product />
            <Product />
            <Product />
        </div>
    )
};
