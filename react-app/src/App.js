import logo from './logo.svg';
import './App.css';

// Nostr
import { SimplePool } from 'nostr-tools';

const pool = new SimplePool()

// Sent variable to window for hacking
window.pool = pool
window.relays = [
  "wss://lunchbox.sandwich.farm",
  "wss://anthro.cc/relay",
  "wss://nostr.stakey.net",
  "wss://br.purplerelay.com",
  "wss://relay.snort.social"
]

// await pool.querySync(relays, [{ kind: [0], authors: [await nostr.getPublicKey()] }])
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
