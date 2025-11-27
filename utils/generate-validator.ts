#!/usr/bin/env bun

import { Wallet } from "ethers";

// Generate a random wallet
const wallet = Wallet.createRandom();

console.log("🔐 New Validator Generated\n");
console.log("Address:     ", wallet.address);
console.log("Private Key: ", wallet.privateKey);
console.log("Public Key:  ", wallet.publicKey);
console.log("Mnemonic:    ", wallet.mnemonic?.phrase);
