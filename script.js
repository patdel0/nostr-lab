const { getSharedSecret, schnorr, utils } = nobleSecp256k1
const crypto = window.crypto
const getRand = size => crypto.getRandomValues(new Uint8Array(size))
const sha256 = bitcoinjs.crypto.sha256
const keypair = bitcoinjs.ECPair.makeRandom()
const privKey = keypair.privateKey.toString("hex")
const pubKey = keypair.publicKey.toString("hex").substring(2)
const relay = "wss://relay.damus.io"
const socket = new WebSocket(relay)

socket.addEventListener("message", async (message) => {
  const [type, subId, event] = JSON.parse(message.data)
  console.log({ type, subId, event })

  let { kind, content } = event || {}
  console.log({ kind, content })

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
})
