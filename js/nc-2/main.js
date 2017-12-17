const SHA256 = require('crypto-js/sha256');
const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');

const http_port = process.env.HTTP_PORT || 3001;
const p2p_port = process.env.P2P_PORT || 6001;
const initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

class Block {
  constructor(index, previousHash, timestamp, data, hash) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash.toString();
    this.hash = hash.toString();
    // this.nonce = 0;
  }
  computeHash() {
    return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString();
  }
};

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 5;
  }
  createGenesisBlock() {
    return new Block(0, '0', 1465154705, 'Genesis block', "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7");
  }
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    // newBlock.mineBlock(this.difficulty);
    // newBlock.hash = newBlock.computeHash();
    this.chain.push(newBlock);
  }
  isChainValid() {
    for(let i=1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i-1];
      if(currentBlock.hash !== currentBlock.computeHash()) {
        return false;
      }
      if(currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
};

class HttpServer {
  constructor(http_port || 3001) {
    this.express = require('express');
    this.bodyParser = require('body-parser');
    this.morgan = require('morgan');
    this.app = this.express();
    this.app.use(this.bodyParser.json());
    this.app.use(this.morgan('dev'));

    this.app.get('/', (req, res) => {
      return res.send('Hello!');
    });
    this.app.listen(http_port, () => console.log('Listening on port: ' + http_port));
  }
};

class P2PServer {
  constructor(p2p_port || 6001) {
    this.sockets = [];
    this.MessageType = {
      QUERY_LATEST: 0,
      QUERY_ALL: 1,
      RESPONSE_BLOCKCHAIN: 2
    }
    this.WebSocket = require('ws');
    this.server = new this.WebSocket.Server({port: p2p_port});
    this.server.on('connection', ws => {
      this.initConnection(ws);
    });
    console.log('Listening websocket p2p port on: ' + p2p_port);
  }
  write(ws, message) {
    ws.send(JSON.stringify(message));
  };
  broadcast(message) {
    sockets.forEach(socket => write(socket, message));
  }
  initConnection(ws) {
    this.sockets.push(ws);
    this.initMessageHandler(ws);
    this.initErrorHandler(ws);
    this.write(ws, this.queryChainLengthMsg());
  }
  initMessageHandler(ws) {
    ws.on('message', (data) => {
      var message = JSON.parse(data);
      console.log('Received message' + JSON.stringify(message));
      if(message.type === this.MessageType.QUERY_LATEST) return this.write(ws, this.responseLatestMsg());
      if(message.type === this.MessageType.QUERY_ALL) return this.write(ws, this.responseChainMsg());
      if(message.type === this.MessageType.RESPONSE_BLOCKCHAIN) return this.handleBlockchainResponse(message);
      return console.log('Something went wrong in initMessageHandler');
    });
  }
  handleBlockchainResponse(message) {
    const receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index));
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    const latestBlockHeld = Blockchain.getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
      console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
      if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
        console.log("We can append the received block to our chain");
        blockchain.push(latestBlockReceived);
        this.broadcast(this.responseLatestMsg());
      } else if (receivedBlocks.length === 1) {
        console.log("We have to query the chain from our peer");
        this.broadcast(this.queryAllMsg());
      } else {
        console.log("Received blockchain is longer than current blockchain");
        this.replaceChain(receivedBlocks);
      }
    } else {
      console.log('Received blockchain is not longer than received blockchain. Do nothing');
    }
  }
  closeConnection(ws) {
    console.log('connection failed to peer: ' + ws.url);
    sockets.splice(sockets.indexOf(ws), 1);
  }
  initErrorHandler(ws) {
    ws.on('close', () => this.closeConnection(ws));
    ws.on('error', () => this.closeConnection(ws));
  }
  queryChainLengthMsg() {
    return {'type': this.MessageType.QUERY_LATEST};
  }
  queryAllMsg() {
    return {'type': this.MessageType.QUERY_ALL};
  }
  responseChainMsg() {
    return {'type': this.MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(Blockchain.chain)};
  }
  responseLatestMsg() {
    return {
      'type': this.MessageType.RESPONSE_BLOCKCHAIN,
      'data': JSON.stringify([Blockchain.getLatestBlock()])
    }
  }
};


const something = (it) => {
  if(it) return console.log('hello');
  return console.log('not hello');
};
