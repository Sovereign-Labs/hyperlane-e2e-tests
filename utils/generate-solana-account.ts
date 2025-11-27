#!/usr/bin/env bun

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const keypair = Keypair.generate();

const privateKey = keypair.secretKey.slice(0, 32);

console.log("Public Key:         ", keypair.publicKey.toBase58());
console.log("Private Key (hex):  ", Buffer.from(privateKey).toString("hex"));
console.log("Private Key (base58):", bs58.encode(privateKey));
console.log("Full Secret (64b):  ", bs58.encode(keypair.secretKey));
