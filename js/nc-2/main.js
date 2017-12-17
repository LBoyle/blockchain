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
