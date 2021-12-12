const topology = require('fully-connected-topology')
const {
    stdin,
    exit,
    argv
} = process
const {
    log
} = console
const {
    me,
    peers
} = extractPeersAndMyPort()
const {
    Blockchain,
    Block,Wallets,
    Transaction,
    PendingTransaction,
    wallets,
} = require('./BlockChain.js')
const sockets = {}
const fs = require('fs');


log('---------------------')
log('Welcome server!')
log('me - ', me)
log('peers - ', peers)
log('connecting to peers...')

const myIp = toLocalIp(me)
const peerIps = getPeerIps(peers)

let powerCoupleCoin = new Blockchain()

//init reward for every wallets 100 coins
powerCoupleCoin.miningPendingTransaction(wallets[1].pk);
powerCoupleCoin.miningPendingTransaction(wallets[2].pk);

log("Your wallet 1 balance before load:", powerCoupleCoin.getBalanceOfAddress(wallets[1].pk));
log("Your wallet 2 balance before load:", powerCoupleCoin.getBalanceOfAddress(wallets[2].pk));

const transactionPool = readTransactionsFromMempool()
log(transactionPool)

powerCoupleCoin.loadTransactionsIntoBlocks(transactionPool)

const totalSum = powerCoupleCoin.getTotalBalanceOBlockChain()
log(`The total amount of coins in BlockChain: ${totalSum}` )
log('The Total Coins mined in blocks of the network: ')
log('The Total Coins burn in  the network: ')
log("Your wallet 1 balance:", powerCoupleCoin.getBalanceOfAddress(wallets[1].pk));
log("Your wallet 2 balance:", powerCoupleCoin.getBalanceOfAddress(wallets[2].pk));

//connect to peers
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp)
    log('connected to peer - ', peerPort)
    
   
    sockets[peerPort] = socket
    stdin.on('data', data => { //on user input
        let message = data.toString().trim()
        if (message === 'exit') { //on exit
            log('Bye bye')
            exit(0)
        }
        
      
    })

    //print data when received
    socket.on('data', data => {
        let message = data.toString('utf8')
        message = extractMessageToSpecificPeer(message)
        log(message)
        if (powerCoupleCoin.hasTransactionInBlockChain(PendingTransaction[message].toString())) { //message to specific peer
            socket.write(`transaction no: ${message}, exist in blockchain`)
        } else {
            socket.write(`transaction no: ${message}, doesn't exist in blockchain`)
        }
    })
})

function readTransactionsFromMempool() {
    return JSON.parse(fs.readFileSync('transactionPool.json', 'utf8'));
}

//extract ports from process arguments, {me: first_port, peers: rest... }
function extractPeersAndMyPort() {
    return {
        me: argv[2],
        peers: argv.slice(3, argv.length)
    }
}

//'4000' -> '127.0.0.1:4000'
function toLocalIp(port) {
    return `127.0.0.1:${port}`
}

//['4000', '4001'] -> ['127.0.0.1:4000', '127.0.0.1:4001']
function getPeerIps(peers) {
    return peers.map(peer => toLocalIp(peer))
}

//'hello' -> 'myPort:hello'
function formatMessage(message) {
    return `${me}>${message}`
}

//'127.0.0.1:4000' -> '4000'
function extractPortFromIp(peer) {
    return peer.toString().slice(peer.length - 4, peer.length);
}

//'4000>hello' -> '4000'
function extractReceiverPeer(message) {
    return message.slice(0, 4);
}

//'4000>hello' -> 'hello'
function extractMessageToSpecificPeer(message) {
    return message.slice(5, message.length);
}

function readTransactionsFromMempoolMock() {
    return JSON.parse(fs.readFileSync('transactionPool.json', 'utf8'));
}

