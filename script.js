const { getSharedSecret, schnorr, utils } = nobleSecp256k1
const crypto = window.crypto
const getRand = size => crypto.getRandomValues(new Uint8Array(size))
const sha256 = bitcoinjs.crypto.sha256
const keypair = bitcoinjs.ECPair.makeRandom()
const privKey = keypair.privateKey.toString("hex")
const pubKey = keypair.publicKey.toString("hex").substring(2)
const relay = "wss://lunchbox.sandwich.farm"
const socket = new WebSocket(relay)

socket.addEventListener("message", async (message) => {
  const [type, subId, event] = JSON.parse(message.data)
  console.log({ type, subId, event })

  let { kind, content } = event || {}

  if (!event || event === true) return
  console.log('message:', event)

  if (kind === 4) {
    content = await decrypt(privKey, pubKey, content)
  }
  console.log(content)
})

const subId = bitcoinjs.ECPair.makeRandom().privateKey.toString("hex").substring(0, 16)
const filter = { "authors": [pubKey] }

socket.addEventListener("open", async () => {
  console.log("connected to:", relay)

  const subscription = ["REQ", subId, filter]
  socket.send(JSON.stringify(subscription))

  const event = {
    "content": "hello world!",
    "created_at": Math.floor(Date.now() / 1000),
    "kind": 1,
    "tags": [],
    "pubkey": pubKey
  }
  const signedEvent = await getSignedEvent(event, privKey)
  console.log('signedEvent:', signedEvent)

  socket.send(JSON.stringify(["EVENT", signedEvent]))

  //put this stuff inside the “open” event listener from earlier
  var message = "this message is super secret!"
  var encrypted = encrypt(privKey, pubKey, message)
  var event2 = {
    "content": encrypted,
    "created_at": Math.floor(Date.now() / 1000),
    "kind": 4,
    "tags": [['p', pubKey]],
    "pubkey": pubKey,
  }
  var signedEvent2 = await getSignedEvent(event2, privKey)
  socket.send(JSON.stringify(["EVENT", signedEvent2]))
})

async function getSignedEvent(event, privateKey) {
  const eventData = JSON.stringify([
    0,
    event['pubkey'],
    event['created_at'],
    event['kind'],
    event['tags'],
    event['content']
  ])
  event.id = sha256(eventData).toString('hex')
  event.sig = await schnorr.sign(event.id, privateKey)
  return event
}

function hexToBytes(hex) {
  return Uint8Array.from(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
}

function bytesToHex(bytes) {
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
}

function base64ToHex(str) {
  const raw = atob(str)
  let result = ''
  let i; for (i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16)
    result += (hex.length === 2 ? hex : '0' + hex)
  }
  return result
}

function encrypt(privkey, pubkey, text) {
  var key = nobleSecp256k1.getSharedSecret(privkey, '02' +
    pubkey, true).substring(2);
  var iv = window.crypto.getRandomValues(new Uint8Array(16));
  var cipher = browserifyCipher.createCipheriv('aes-256-cbc',
    hexToBytes(key), iv);
  var encryptedMessage = cipher.update(text, "utf8", "base64");
  let emsg = encryptedMessage + cipher.final("base64");
  var uint8View = new Uint8Array(iv.buffer);
  var decoder = new TextDecoder();
  return emsg + "?iv=" + btoa(String.fromCharCode.apply(null,
    uint8View));
}

//put this right above your closing script tag
function decrypt(privkey, pubkey, ciphertext) {
  var [emsg, iv] = ciphertext.split("?iv=");
  var key = nobleSecp256k1.getSharedSecret(privkey, '02' +
    pubkey, true).substring(2);
  var decipher = browserifyCipher.createDecipheriv(
    'aes-256-cbc',
    hexToBytes(key),
    hexToBytes(base64ToHex(iv))
  );
  var decryptedMessage = decipher.update(emsg, "base64");
  dmsg = decryptedMessage + decipher.final("utf8");
  return dmsg;
}
