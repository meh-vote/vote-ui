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
        <h1>Meh voting</h1>
      </div>
    );
  }